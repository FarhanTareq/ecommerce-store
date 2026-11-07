import type { WithId, Document } from "mongodb";
import type {
  Category,
  Coupon,
  Order,
  OrderStatus,
  Product,
  Settings,
} from "../types";
import { orderStatusLabels } from "../order-status";

function iso(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function isoOrNull(value: unknown): string | null {
  if (!value) return null;
  return iso(value);
}

export function mapProduct(doc: WithId<Document>): Product {
  return {
    id: doc._id.toString(),
    name: doc.name ?? "",
    slug: doc.slug ?? "",
    category: doc.category ?? "",
    description: doc.description ?? "",
    brand: doc.brand ?? "Sporsify",
    price: Number(doc.price ?? 0),
    discountPercent: Number(doc.discountPercent ?? 0),
    images: Array.isArray(doc.images)
      ? doc.images.map((image: Record<string, unknown>) => ({
          key: String(image.key ?? ""),
          url: String(image.url ?? ""),
          alt: String(image.alt ?? ""),
        }))
      : [],
    sizes: Array.isArray(doc.sizes)
      ? doc.sizes.map((size: Record<string, unknown>) => ({
          size: String(size.size ?? ""),
          stock: Number(size.stock ?? 0),
        }))
      : [],
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    featured: Boolean(doc.featured),
    status: doc.status ?? "active",
    seoTitle: doc.seoTitle ?? "",
    seoDescription: doc.seoDescription ?? "",
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function mapCategory(doc: WithId<Document>): Category {
  return {
    id: doc._id.toString(),
    name: doc.name ?? "",
    slug: doc.slug ?? "",
    description: doc.description ?? "",
    image: doc.image ?? "",
    sortOrder: Number(doc.sortOrder ?? 0),
    active: doc.active !== false,
  };
}

export function mapCoupon(doc: WithId<Document>): Coupon {
  return {
    id: doc._id.toString(),
    code: doc.code ?? "",
    type: doc.type === "fixed" ? "fixed" : "percent",
    value: Number(doc.value ?? 0),
    minSubtotal: Number(doc.minSubtotal ?? 0),
    maxDiscount: Number(doc.maxDiscount ?? 0),
    startsAt: isoOrNull(doc.startsAt),
    expiresAt: isoOrNull(doc.expiresAt),
    usageLimit:
      doc.usageLimit === null || doc.usageLimit === undefined
        ? null
        : Number(doc.usageLimit),
    usedCount: Number(doc.usedCount ?? 0),
    perPhoneLimit:
      doc.perPhoneLimit === null || doc.perPhoneLimit === undefined
        ? null
        : Number(doc.perPhoneLimit),
    active: doc.active !== false,
    createdAt: iso(doc.createdAt),
  };
}

export function mapOrder(doc: WithId<Document>): Order {
  const customer = (doc.customer ?? {}) as Record<string, unknown>;
  const payment = (doc.payment ?? {}) as Record<string, unknown>;
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber ?? "",
    publicToken: doc.publicToken ?? "",
    userId: doc.userId ? String(doc.userId) : null,
    customer: {
      name: String(customer.name ?? ""),
      phone: String(customer.phone ?? ""),
      email: String(customer.email ?? ""),
      address: String(customer.address ?? ""),
      area: String(customer.area ?? ""),
      district: String(customer.district ?? ""),
      notes: String(customer.notes ?? ""),
    },
    items: Array.isArray(doc.items)
      ? doc.items.map((item: Record<string, unknown>) => ({
          productId: String(item.productId ?? ""),
          name: String(item.name ?? ""),
          slug: String(item.slug ?? ""),
          image: String(item.image ?? ""),
          brand: String(item.brand ?? ""),
          size: String(item.size ?? ""),
          unitPrice: Number(item.unitPrice ?? 0),
          discountPercent: Number(item.discountPercent ?? 0),
          salePrice: Number(item.salePrice ?? 0),
          quantity: Number(item.quantity ?? 0),
          lineTotal: Number(item.lineTotal ?? 0),
        }))
      : [],
    subtotal: Number(doc.subtotal ?? 0),
    productDiscount: Number(doc.productDiscount ?? 0),
    couponCode: doc.couponCode ?? "",
    couponDiscount: Number(doc.couponDiscount ?? 0),
    shipping: Number(doc.shipping ?? 0),
    total: Number(doc.total ?? 0),
    payment: {
      method:
        payment.method === "bkash" || payment.method === "nagad"
          ? payment.method
          : "cod",
      status:
        payment.status === "verified" ||
        payment.status === "failed" ||
        payment.status === "pending_verification"
          ? payment.status
          : "cod_pending",
      transactionId: String(payment.transactionId ?? ""),
      senderNumber: String(payment.senderNumber ?? ""),
    },
    status: doc.status ?? "pending",
    statusHistory: Array.isArray(doc.statusHistory)
      ? doc.statusHistory.map((entry: Record<string, unknown>) => ({
          status:
            typeof entry.status === "string" && entry.status in orderStatusLabels
              ? (entry.status as OrderStatus)
              : "pending",
          at: iso(entry.at),
          note: String(entry.note ?? ""),
        }))
      : [],
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export const defaultSettings: Settings = {
  insideDhakaFee: 70,
  outsideDhakaFee: 150,
  freeShippingThreshold: 3000,
  bkashNumber: "",
  nagadNumber: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  announcement:
    "Inside Dhaka ৳70 · Outside Dhaka ৳150 · Free delivery over ৳3,000 · COD available",
  facebookUrl: "",
  instagramUrl: "",
};

export function mapSettings(doc: Document | null): Settings {
  return { ...defaultSettings, ...(doc ?? {}) } as Settings;
}
