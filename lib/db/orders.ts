import { randomBytes } from "node:crypto";
import { ObjectId, type ClientSession, type Document, type Filter } from "mongodb";
import type {
  CartLine,
  CouponSummary,
  Order,
  OrderCustomer,
  OrderStatus,
  PaymentMethod,
  Settings,
} from "../types";
import { getDb, isDbConfigured } from "./client";
import { mapOrder } from "./mappers";

const COLLECTION = "orders";
const PRODUCTS = "products";

export function generateOrderNumber() {
  const date = new Date();
  const stamp = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `SP-${stamp}-${random}`;
}

export function generatePublicToken() {
  return randomBytes(20).toString("hex");
}

export async function decrementStock(
  productId: string,
  size: string,
  quantity: number,
  session?: ClientSession,
) {
  if (!ObjectId.isValid(productId)) throw new Error("Invalid product in cart");
  const db = await getDb();
  const result = await db.collection(PRODUCTS).updateOne(
    {
      _id: new ObjectId(productId),
      status: "active",
      sizes: { $elemMatch: { size, stock: { $gte: quantity } } },
    },
    { $inc: { "sizes.$.stock": -quantity } },
    { session },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("One of the products just went out of stock. Please update your cart.");
  }
}

export type NewOrderData = {
  userId: string | null;
  customer: OrderCustomer;
  items: CartLine[];
  coupon: CouponSummary | null;
  subtotal: number;
  productDiscount: number;
  shipping: number;
  total: number;
  payment: {
    method: PaymentMethod;
    transactionId: string;
    senderNumber: string;
  };
};

export async function insertOrder(
  data: NewOrderData,
  settings: Settings,
  session?: ClientSession,
) {
  const db = await getDb();
  const now = new Date();
  const couponDiscount = data.coupon?.discount ?? 0;
  const paymentStatus =
    data.payment.method === "cod" ? "cod_pending" : "pending_verification";
  const doc = {
    orderNumber: generateOrderNumber(),
    publicToken: generatePublicToken(),
    userId: data.userId,
    customer: data.customer,
    items: data.items.map((line) => ({
      productId: line.productId,
      name: line.name,
      slug: line.slug,
      image: line.image,
      brand: line.brand,
      size: line.size,
      unitPrice: line.price,
      discountPercent: line.discountPercent,
      salePrice: line.salePrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
    subtotal: data.subtotal,
    productDiscount: data.productDiscount,
    couponCode: data.coupon?.code ?? "",
    couponDiscount,
    shipping: data.shipping,
    total: data.total,
    payment: {
      method: data.payment.method,
      status: paymentStatus,
      transactionId: data.payment.transactionId,
      senderNumber: data.payment.senderNumber || data.customer.phone,
    },
    status: "pending" as OrderStatus,
    statusHistory: [
      {
        status: "pending" as OrderStatus,
        at: now,
        note: "Order placed",
      },
    ],
    settingsSnapshot: {
      bkashNumber: settings.bkashNumber,
      nagadNumber: settings.nagadNumber,
      contactPhone: settings.contactPhone,
    },
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection(COLLECTION).insertOne(doc, { session });
  return mapOrder({ ...doc, _id: result.insertedId });
}

export async function getOrderByToken(token: string) {
  if (!isDbConfigured() || !token) return null;
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ publicToken: token });
  return doc ? mapOrder(doc) : null;
}

export async function getOrderByNumberAndPhone(orderNumber: string, phone: string) {
  if (!isDbConfigured()) return null;
  const db = await getDb();
  const doc = await db
    .collection(COLLECTION)
    .findOne({ orderNumber: orderNumber.trim().toUpperCase(), "customer.phone": phone });
  return doc ? mapOrder(doc) : null;
}

export async function getOrderById(id: string) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  return doc ? mapOrder(doc) : null;
}

export async function getOrders(options: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const empty = { items: [] as Order[], total: 0, page: 1, pages: 1 };
  if (!isDbConfigured()) return empty;
  const db = await getDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  const filter: Filter<Document> = {};
  if (options.status && options.status !== "all") filter.status = options.status;
  if (options.search?.trim()) {
    const pattern = new RegExp(options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { orderNumber: pattern },
      { "customer.name": pattern },
      { "customer.phone": pattern },
      { "customer.email": pattern },
    ];
  }
  const collection = db.collection(COLLECTION);
  const [docs, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ]);
  return {
    items: docs.map(mapOrder),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOrdersForUser(userId: string, email: string) {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const filter: Filter<Document> = {
    $or: [{ userId }, ...(email ? [{ "customer.email": email }] : [])],
  };
  const docs = await db.collection(COLLECTION).find(filter).sort({ createdAt: -1 }).limit(30).toArray();
  return docs.map(mapOrder);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note = "",
) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid order id");
  const db = await getDb();
  type OrderUpdateDoc = {
    status: OrderStatus;
    statusHistory: { status: OrderStatus; at: Date; note: string }[];
    updatedAt: Date;
  };
  const doc = await db.collection<OrderUpdateDoc>(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: { status, updatedAt: new Date() },
      $push: {
        statusHistory: { status, at: new Date(), note },
      },
    },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("Order not found");
  return mapOrder(doc);
}

export async function updatePaymentStatus(
  id: string,
  status: "verified" | "failed",
) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid order id");
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { "payment.status": status, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("Order not found");
  return mapOrder(doc);
}

export async function getOrderStats() {
  if (!isDbConfigured()) {
    return { total: 0, pending: 0, today: 0, revenue: 0, delivered: 0 };
  }
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [total, pending, today, delivered, revenueRows] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ status: { $in: ["pending", "confirmed", "packed"] } }),
    collection.countDocuments({ createdAt: { $gte: start } }),
    collection.countDocuments({ status: "delivered" }),
    collection
      .aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ])
      .toArray(),
  ]);
  return {
    total,
    pending,
    today,
    delivered,
    revenue: Number(revenueRows[0]?.revenue ?? 0),
  };
}

export async function countCouponUsageForPhone(code: string, phone: string) {
  if (!isDbConfigured()) return 0;
  const db = await getDb();
  return db.collection(COLLECTION).countDocuments({
    couponCode: code.toUpperCase(),
    "customer.phone": phone,
    status: { $ne: "cancelled" },
  });
}
