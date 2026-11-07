import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  Package,
  ReceiptText,
  Tag,
  TrendingUp,
} from "lucide-react";
import OrderStatusBadge from "@/components/site/OrderStatusBadge";
import { getCouponStats } from "@/lib/db/coupons";
import { isDbConfigured } from "@/lib/db/client";
import { getOrderStats, getOrders } from "@/lib/db/orders";
import { getProductCounts } from "@/lib/db/products";
import { formatBDT, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orders, products, coupons] = await Promise.all([
    getOrderStats(),
    getProductCounts(),
    getCouponStats(),
  ]);
  const recent = await getOrders({ pageSize: 6 });
  const dbReady = isDbConfigured();

  const cards = [
    {
      label: "Revenue",
      value: formatBDT(orders.revenue),
      hint: "All non-cancelled orders",
      icon: Banknote,
    },
    {
      label: "Orders",
      value: String(orders.total),
      hint: `${orders.today} placed today`,
      icon: ReceiptText,
    },
    {
      label: "Active products",
      value: String(products.active),
      hint: `${products.draft} drafts · ${products.lowStock} low stock`,
      icon: Package,
    },
    {
      label: "Active coupons",
      value: String(coupons.active),
      hint: `${coupons.total} total coupons`,
      icon: Tag,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Store overview</p>
          <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Dashboard.</h1>
          <p className="mt-1 text-sm text-ink/50">Everything happening at Sporsify, at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="btn-dark px-4 py-2.5">
            + Add product
          </Link>
          <Link href="/" className="btn-outline px-4 py-2.5">
            View store
          </Link>
        </div>
      </div>

      {!dbReady ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Database not connected</p>
            <p className="mt-1 text-amber-800">
              Add your MongoDB connection string to <code>.env.local</code>, then run{" "}
              <code>npm run seed</code> to create the admin account and demo products.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-ink/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper">
                <card.icon className="h-5 w-5" />
              </span>
              {card.label === "Revenue" ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : null}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/40">{card.label}</p>
            <p className="display mt-1 text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-ink/45">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-ink/10 bg-white">
          <div className="flex items-center justify-between border-b border-ink/10 p-5">
            <h2 className="font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-bold text-ink/50 hover:text-ink">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.items.length ? (
            <div className="divide-y divide-ink/10">
              {recent.items.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 p-4 transition hover:bg-paper"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{order.orderNumber}</p>
                    <p className="mt-0.5 truncate text-xs text-ink/45">
                      {order.customer.name} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold">{formatBDT(order.total)}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-ink/45">
              No orders yet. Once a customer checks out, it will appear here.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-bold">Quick actions</h2>
            <div className="mt-3 space-y-2">
              <Link href="/admin/products/new" className="flex items-center justify-between rounded-xl bg-paper px-3 py-2.5 text-sm font-semibold hover:bg-volt">
                Add a product <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/coupons" className="flex items-center justify-between rounded-xl bg-paper px-3 py-2.5 text-sm font-semibold hover:bg-volt">
                Create a coupon <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/settings" className="flex items-center justify-between rounded-xl bg-paper px-3 py-2.5 text-sm font-semibold hover:bg-volt">
                Update bKash/Nagad numbers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-ink p-5 text-white">
            <div className="flex items-center gap-2 text-volt">
              <Boxes className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-[0.16em]">Inventory</p>
            </div>
            <p className="mt-3 text-3xl font-bold">{products.lowStock}</p>
            <p className="mt-1 text-xs text-white/55">products with a size at 3 units or fewer.</p>
            <Link href="/admin/products" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-volt hover:underline">
              Manage stock <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
