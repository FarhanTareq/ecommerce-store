import { ObjectId } from "mongodb";
import { getDb, isDbConfigured } from "../db/client";
import { getSettings } from "../db/settings";
import { validateCoupon } from "../db/coupons";
import { calculateTotals, getSalePrice } from "../pricing";
import type {
  CartItemInput,
  CartLine,
  CartTotals,
  CouponSummary,
  Product,
  Settings,
} from "../types";

export class CartError extends Error {}

export function mergeCartItems(items: CartItemInput[]): CartItemInput[] {
  const merged = new Map<string, CartItemInput>();
  for (const item of items) {
    const key = `${item.productId}::${item.size}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + item.quantity);
    } else {
      merged.set(key, { ...item });
    }
  }
  return Array.from(merged.values());
}

type ServerCart = {
  lines: CartLine[];
  subtotal: number;
  productDiscount: number;
  settings: Settings;
};

export async function buildServerCart(items: CartItemInput[]): Promise<ServerCart> {
  if (!isDbConfigured()) {
    throw new CartError(
      "The store database is not connected yet. Add MONGODB_URI to enable checkout.",
    );
  }
  const settings = await getSettings();
  const merged = mergeCartItems(items);
  if (!merged.length) throw new CartError("Your cart is empty");

  const ids = merged
    .map((item) => item.productId)
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  if (!ids.length) throw new CartError("Your cart contains invalid products");

  const db = await getDb();
  const docs = await db
    .collection("products")
    .find({ _id: { $in: ids }, status: "active" })
    .toArray();

  const products = new Map<string, Product>();
  for (const doc of docs) {
    const product = {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      category: doc.category,
      description: doc.description,
      brand: doc.brand ?? "Sporsify",
      price: Number(doc.price),
      discountPercent: Number(doc.discountPercent),
      images: doc.images ?? [],
      sizes: doc.sizes ?? [],
      tags: doc.tags ?? [],
      featured: Boolean(doc.featured),
      status: doc.status,
      seoTitle: doc.seoTitle ?? "",
      seoDescription: doc.seoDescription ?? "",
      createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    } satisfies Product;
    products.set(product.id, product);
  }

  const lines: CartLine[] = [];
  for (const item of merged) {
    const product = products.get(item.productId);
    if (!product) {
      throw new CartError("A product in your cart is no longer available");
    }
    const size = product.sizes.find((entry) => entry.size === item.size);
    if (!size) {
      throw new CartError(`${product.name} is no longer available in size ${item.size}`);
    }
    if (size.stock < item.quantity) {
      throw new CartError(
        `${product.name} (${item.size}) only has ${size.stock} left in stock`,
      );
    }
    const salePrice = getSalePrice(product.price, product.discountPercent);
    lines.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? "",
      brand: product.brand,
      price: product.price,
      discountPercent: product.discountPercent,
      salePrice,
      size: item.size,
      quantity: item.quantity,
      stock: size.stock,
      lineTotal: salePrice * item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const productDiscount = lines.reduce(
    (sum, line) =>
      sum + (line.price - line.salePrice) * line.quantity,
    0,
  );

  return { lines, subtotal, productDiscount, settings };
}

export async function buildCartWithCoupon(
  items: CartItemInput[],
  couponCode = "",
  phone = "",
  district = "Dhaka",
): Promise<{
  lines: CartLine[];
  coupon: CouponSummary | null;
  totals: CartTotals;
  settings: Settings;
}> {
  const cart = await buildServerCart(items);
  const afterProductDiscount = cart.subtotal - cart.productDiscount;
  let coupon: CouponSummary | null = null;
  let couponDiscount = 0;

  if (couponCode.trim()) {
    const result = await validateCoupon(
      couponCode,
      afterProductDiscount,
      phone,
    );
    if (!result.ok) throw new CartError(result.message);
    coupon = result.summary;
    couponDiscount = result.discount;
  }

  const totals = calculateTotals(
    cart.lines,
    couponDiscount,
    cart.settings,
    district,
  );
  return { lines: cart.lines, coupon, totals, settings: cart.settings };
}
