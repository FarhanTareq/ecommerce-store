import { getDb, isDbConfigured } from "./client";
import type { OrderStatus, PaymentMethod } from "../types";

const COLLECTION = "orders";

export const reportRanges = [7, 30, 90, 365] as const;
export type ReportRange = (typeof reportRanges)[number];

export function normalizeRange(value: unknown): ReportRange {
  const parsed = Number(value);
  return reportRanges.includes(parsed as ReportRange)
    ? (parsed as ReportRange)
    : 30;
}

function startDate(days: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

export type SalesReport = {
  range: ReportRange;
  from: string;
  to: string;
  summary: {
    revenue: number;
    orders: number;
    units: number;
    averageOrderValue: number;
    cancelledOrders: number;
    cancelledValue: number;
  };
  daily: { date: string; revenue: number; orders: number }[];
  topProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  statuses: { status: OrderStatus; count: number; value: number }[];
  payments: { method: PaymentMethod; count: number; value: number }[];
};

const emptyReport = (range: ReportRange, from: Date): SalesReport => ({
  range,
  from: from.toISOString(),
  to: new Date().toISOString(),
  summary: {
    revenue: 0,
    orders: 0,
    units: 0,
    averageOrderValue: 0,
    cancelledOrders: 0,
    cancelledValue: 0,
  },
  daily: [],
  topProducts: [],
  statuses: [],
  payments: [],
});

export async function getSalesReport(days: number): Promise<SalesReport> {
  const range = normalizeRange(days);
  const from = startDate(range);
  if (!isDbConfigured()) return emptyReport(range, from);

  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const salesMatch = { createdAt: { $gte: from }, status: { $ne: "cancelled" } };

  const [summaryRows, dailyRows, topRows, statusRows, paymentRows] =
    await Promise.all([
      collection
        .aggregate([
          { $match: salesMatch },
          {
            $project: {
              total: 1,
              units: { $sum: "$items.quantity" },
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
              units: { $sum: "$units" },
            },
          },
        ])
        .toArray(),
      collection
        .aggregate([
          { $match: salesMatch },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      collection
        .aggregate([
          { $match: salesMatch },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              name: { $first: "$items.name" },
              quantity: { $sum: "$items.quantity" },
              revenue: { $sum: "$items.lineTotal" },
            },
          },
          { $sort: { quantity: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
      collection
        .aggregate([
          { $match: { createdAt: { $gte: from } } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              value: { $sum: "$total" },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      collection
        .aggregate([
          { $match: salesMatch },
          {
            $group: {
              _id: "$payment.method",
              count: { $sum: 1 },
              value: { $sum: "$total" },
            },
          },
          { $sort: { value: -1 } },
        ])
        .toArray(),
    ]);

  const summary = summaryRows[0] ?? {
    revenue: 0,
    orders: 0,
    units: 0,
  };
  const cancelled = statusRows.find((row) => row._id === "cancelled");
  const revenue = Number(summary.revenue ?? 0);
  const orders = Number(summary.orders ?? 0);

  return {
    range,
    from: from.toISOString(),
    to: new Date().toISOString(),
    summary: {
      revenue,
      orders,
      units: Number(summary.units ?? 0),
      averageOrderValue: orders ? Math.round(revenue / orders) : 0,
      cancelledOrders: Number(cancelled?.count ?? 0),
      cancelledValue: Number(cancelled?.value ?? 0),
    },
    daily: dailyRows.map((row) => ({
      date: String(row._id),
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders ?? 0),
    })),
    topProducts: topRows.map((row) => ({
      productId: String(row._id ?? ""),
      name: String(row.name ?? "Unknown product"),
      quantity: Number(row.quantity ?? 0),
      revenue: Number(row.revenue ?? 0),
    })),
    statuses: statusRows.map((row) => ({
      status: String(row._id) as OrderStatus,
      count: Number(row.count ?? 0),
      value: Number(row.value ?? 0),
    })),
    payments: paymentRows.map((row) => ({
      method: String(row._id) as PaymentMethod,
      count: Number(row.count ?? 0),
      value: Number(row.value ?? 0),
    })),
  };
}
