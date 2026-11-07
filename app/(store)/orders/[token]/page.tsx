import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  ReceiptText,
  Truck,
  Wallet,
} from "lucide-react";
import OrderStatusBadge from "@/components/site/OrderStatusBadge";
import { getOrderByToken } from "@/lib/db/orders";
import {
  orderStatusFlow,
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/lib/order-status";
import { formatBDT, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const currentIndex = orderStatusFlow.indexOf(order.status);
  const isMobilePayment = order.payment.method !== "cod";

  return (
    <section className="container-x py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> Order received
              </span>
              <h1 className="display mt-4 text-3xl font-bold sm:text-4xl">
                Thanks, {order.customer.name.split(" ")[0]}. Your order is in.
              </h1>
              <p className="mt-2 text-sm text-ink/55">
                We will call {order.customer.phone} to confirm delivery. Save your order number.
              </p>
            </div>
            <div className="rounded-2xl bg-paper p-4 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
                Order number
              </p>
              <p className="display mt-1 text-xl font-bold">{order.orderNumber}</p>
              <p className="mt-1 text-xs text-ink/45">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-ink/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold">Delivery status</p>
              <OrderStatusBadge status={order.status} />
            </div>
            {order.status === "cancelled" ? (
              <p className="mt-3 text-sm text-red-600">
                This order was cancelled. Contact us if you need help placing a new order.
              </p>
            ) : (
              <ol className="mt-5 grid grid-cols-5 gap-1">
                {orderStatusFlow.map((status, index) => {
                  const done = index <= currentIndex;
                  return (
                    <li key={status} className="text-center">
                      <span
                        className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${
                          done ? "bg-volt text-ink" : "bg-paper text-ink/30"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className={`mt-1.5 block text-[10px] font-semibold ${done ? "text-ink" : "text-ink/35"}`}>
                        {orderStatusLabels[status]}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/40">
                <MapPin className="h-3.5 w-3.5" /> Deliver to
              </p>
              <p className="mt-2 font-bold">{order.customer.name}</p>
              <p className="mt-1 text-sm leading-6 text-ink/55">
                {order.customer.address}, {order.customer.area}, {order.customer.district}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/55">
                <Phone className="h-3.5 w-3.5" /> {order.customer.phone}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/40">
                <Wallet className="h-3.5 w-3.5" /> Payment
              </p>
              <p className="mt-2 font-bold">{paymentMethodLabels[order.payment.method]}</p>
              <p className="mt-1 text-sm text-ink/55">
                {paymentStatusLabels[order.payment.status]}
              </p>
              {order.payment.transactionId ? (
                <p className="mt-1 text-xs text-ink/45">
                  Transaction: {order.payment.transactionId}
                </p>
              ) : null}
            </div>
          </div>

          {isMobilePayment ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-bold">Payment verification pending</p>
              <p className="mt-1 leading-6">
                Our team is checking your {paymentMethodLabels[order.payment.method]} transaction.
                We will confirm by phone. Keep your transaction ID ready.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-volt bg-volt/20 p-4 text-sm">
              <p className="font-bold">Pay {formatBDT(order.total)} when your order arrives.</p>
              <p className="mt-1 text-ink/60">Please keep the exact amount ready for the delivery rider.</p>
            </div>
          )}

          <div className="mt-7">
            <h2 className="display flex items-center gap-2 text-xl font-bold">
              <ReceiptText className="h-5 w-5" /> Order summary
            </h2>
            <div className="mt-3 divide-y divide-ink/10">
              {order.items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <span className="display grid h-full place-items-center text-sm font-bold text-ink/20">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-ink/45">
                      Size {item.size} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{formatBDT(item.lineTotal)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/50">Subtotal</span>
                <span>{formatBDT(order.subtotal)}</span>
              </div>
              {order.productDiscount > 0 ? (
                <div className="flex justify-between text-coral">
                  <span>Product discount</span>
                  <span>−{formatBDT(order.productDiscount)}</span>
                </div>
              ) : null}
              {order.couponDiscount > 0 ? (
                <div className="flex justify-between text-coral">
                  <span>Coupon {order.couponCode}</span>
                  <span>−{formatBDT(order.couponDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-ink/50">Delivery</span>
                <span>{order.shipping === 0 ? "Free" : formatBDT(order.shipping)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink/10 pt-2">
                <span className="font-bold">Total</span>
                <span className="display text-2xl font-bold">{formatBDT(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/track-order?number=${order.orderNumber}&phone=${order.customer.phone}`} className="btn-dark">
              <Truck className="h-4 w-4" /> Track this order
            </Link>
            <Link href="/shop" className="btn-outline">
              Continue shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs text-ink/40">
            <Clock3 className="h-3.5 w-3.5" /> Confirmation usually happens within a few hours during business time.
          </p>
        </div>
      </div>
    </section>
  );
}
