import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PackageSearch, Search } from "lucide-react";
import OrderStatusBadge from "@/components/site/OrderStatusBadge";
import { getOrderByNumberAndPhone } from "@/lib/db/orders";
import {
  orderStatusFlow,
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/lib/order-status";
import { formatBDT, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track your order",
  description:
    "Track your Sporsify order with your order number and phone number. No account required.",
  alternates: { canonical: "/track-order" },
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string; phone?: string }>;
}) {
  const params = await searchParams;
  const number = params.number?.trim() ?? "";
  const phone = params.phone?.trim() ?? "";
  const order = number && phone ? await getOrderByNumberAndPhone(number, phone) : null;
  const searched = Boolean(number && phone);
  const currentIndex = order ? orderStatusFlow.indexOf(order.status) : -1;

  return (
    <section className="container-x py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-volt">
            <PackageSearch className="h-6 w-6" />
          </span>
          <h1 className="display mt-4 text-4xl font-bold">Track your order.</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">
            Enter the order number from your confirmation page and the phone number used at
            checkout.
          </p>
        </div>

        <form method="GET" className="mt-8 rounded-2xl border border-ink/10 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="number">Order number</label>
              <input
                id="number"
                name="number"
                required
                defaultValue={number}
                placeholder="SP-260101-ABC12"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                required
                defaultValue={phone}
                placeholder="01XXXXXXXXX"
                className="input"
              />
            </div>
          </div>
          <button className="btn-dark mt-4 w-full">
            <Search className="h-4 w-4" /> Find my order
          </button>
        </form>

        {searched && !order ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            No order matched those details. Check the order number and phone number, or contact us.
          </div>
        ) : null}

        {order ? (
          <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
                  {order.orderNumber}
                </p>
                <h2 className="display mt-1 text-2xl font-bold">{order.customer.name}</h2>
                <p className="mt-1 text-xs text-ink/45">{formatDate(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {order.status !== "cancelled" ? (
              <ol className="mt-6 grid grid-cols-5 gap-1">
                {orderStatusFlow.map((status, index) => (
                  <li key={status} className="text-center">
                    <span
                      className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${
                        index <= currentIndex ? "bg-volt text-ink" : "bg-paper text-ink/30"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className={`mt-1.5 block text-[10px] font-semibold ${index <= currentIndex ? "text-ink" : "text-ink/35"}`}>
                      {orderStatusLabels[status]}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                This order has been cancelled.
              </p>
            )}

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-paper p-3">
                <p className="text-xs text-ink/45">Deliver to</p>
                <p className="mt-1 font-semibold">{order.customer.address}</p>
                <p className="text-ink/55">
                  {order.customer.area}, {order.customer.district}
                </p>
              </div>
              <div className="rounded-xl bg-paper p-3">
                <p className="text-xs text-ink/45">Payment</p>
                <p className="mt-1 font-semibold">{paymentMethodLabels[order.payment.method]}</p>
                <p className="text-ink/55">{paymentStatusLabels[order.payment.status]}</p>
                <p className="mt-1 font-bold">{formatBDT(order.total)}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
              {order.items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex justify-between gap-3">
                  <span className="text-ink/60">
                    {item.name} · {item.size} × {item.quantity}
                  </span>
                  <span className="font-semibold">{formatBDT(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <Link href="/shop" className="btn-outline mt-5">
              Continue shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
