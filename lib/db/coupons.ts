import { ObjectId, type ClientSession, type Document } from "mongodb";
import { calculateCouponDiscount } from "../pricing";
import type { Coupon, CouponSummary } from "../types";
import type { CouponInput } from "../validators";
import { getDb, isDbConfigured } from "./client";
import { mapCoupon } from "./mappers";

const COLLECTION = "coupons";
const ORDERS = "orders";

export type CouponValidation =
  | { ok: true; coupon: Coupon; discount: number; summary: CouponSummary }
  | { ok: false; message: string };

function normalizeCoupon(input: CouponInput) {
  return {
    code: input.code.toUpperCase(),
    type: input.type,
    value: Math.round(input.value),
    minSubtotal: Math.round(input.minSubtotal),
    maxDiscount: Math.round(input.maxDiscount),
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    usageLimit: input.usageLimit > 0 ? Math.round(input.usageLimit) : null,
    perPhoneLimit: input.perPhoneLimit > 0 ? Math.round(input.perPhoneLimit) : null,
    active: input.active,
  };
}

export async function getCoupons(): Promise<Coupon[]> {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const docs = await db.collection(COLLECTION).find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(mapCoupon);
}

export async function getCouponById(id: string) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  return doc ? mapCoupon(doc) : null;
}

export async function getCouponByCode(code: string) {
  if (!isDbConfigured() || !code.trim()) return null;
  const db = await getDb();
  const doc = await db
    .collection(COLLECTION)
    .findOne({ code: code.trim().toUpperCase() });
  return doc ? mapCoupon(doc) : null;
}

export async function validateCoupon(
  code: string,
  amount: number,
  phone = "",
): Promise<CouponValidation> {
  const coupon = await getCouponByCode(code);
  if (!coupon) return { ok: false, message: "Coupon code not found" };
  if (!coupon.active) return { ok: false, message: "This coupon is no longer active" };

  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { ok: false, message: "This coupon is not active yet" };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) {
    return { ok: false, message: "This coupon has expired" };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: "This coupon has reached its usage limit" };
  }
  if (amount < coupon.minSubtotal) {
    return {
      ok: false,
      message: `Add ৳${(coupon.minSubtotal - amount).toLocaleString("en-BD")} more to use this coupon`,
    };
  }
  if (coupon.perPhoneLimit && phone) {
    const db = await getDb();
    const used = await db.collection(ORDERS).countDocuments({
      couponCode: coupon.code,
      "customer.phone": phone,
      status: { $ne: "cancelled" },
    });
    if (used >= coupon.perPhoneLimit) {
      return { ok: false, message: "You have already used this coupon" };
    }
  }

  const discount = calculateCouponDiscount(coupon, amount);
  return {
    ok: true,
    coupon,
    discount,
    summary: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      description:
        coupon.type === "percent"
          ? `${coupon.value}% off${coupon.maxDiscount ? ` (max ৳${coupon.maxDiscount})` : ""}`
          : `৳${coupon.value} off`,
    },
  };
}

export async function createCoupon(input: CouponInput) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const normalized = normalizeCoupon(input);
  const duplicate = await collection.findOne({ code: normalized.code });
  if (duplicate) throw new Error("A coupon with this code already exists");
  const doc = {
    ...normalized,
    usedCount: 0,
    createdAt: new Date(),
  };
  const result = await collection.insertOne(doc);
  return mapCoupon({ ...doc, _id: result.insertedId });
}

export async function updateCoupon(id: string, input: CouponInput) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid coupon id");
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const normalized = normalizeCoupon(input);
  const duplicate = await collection.findOne({
    code: normalized.code,
    _id: { $ne: new ObjectId(id) },
  });
  if (duplicate) throw new Error("A coupon with this code already exists");
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: normalized },
    { returnDocument: "after" },
  );
  if (!result) throw new Error("Coupon not found");
  return mapCoupon(result);
}

export async function deleteCoupon(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid coupon id");
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
}

export async function incrementCouponUsage(code: string, session?: ClientSession) {
  if (!code) return;
  const db = await getDb();
  const result = await db.collection(COLLECTION).updateOne(
    {
      code: code.toUpperCase(),
      active: true,
      $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
    },
    { $inc: { usedCount: 1 } },
    { session },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("This coupon is no longer available");
  }
}

export async function getCouponStats() {
  if (!isDbConfigured()) return { total: 0, active: 0 };
  const db = await getDb();
  const [total, active] = await Promise.all([
    db.collection(COLLECTION).countDocuments({}),
    db.collection(COLLECTION).countDocuments({ active: true }),
  ]);
  return { total, active };
}

export async function findCouponDoc(code: string) {
  if (!isDbConfigured()) return null;
  const db = await getDb();
  return db.collection(COLLECTION).findOne({ code: code.trim().toUpperCase() }) as Promise<
    (Document & { _id: ObjectId }) | null
  >;
}
