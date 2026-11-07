import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, Wallet } from "lucide-react";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import OrderStatusBadge from "@/components/site/OrderStatusBadge";
import { getOrderById } from "@/lib/db/orders";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/lib/order-status";
import { formatBDT, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Order detail</p>
          <h1 className="display mt-1 text-3xl font-bold">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink/45">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="text-xs" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-bold">Items</h2>
            <div className="mt-3 divide-y divide-ink/10">
              {order.items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <span className="display grid h-full place-items-center text-xs font-bold text-ink/25">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${item.slug}`} target="_blank" className="truncate text-sm font-bold hover:text-coral">
                      {item.name}
                    </Link>
                    <p className="text-xs text-ink/45">
                      Size {item.size} · {formatBDT(item.salePrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold">{formatBDT(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span>{formatBDT(order.subtotal)}</span></div>
              {order.productDiscount > 0 ? <div className="flex justify-between text-coral"><span>Product discount</span><span>−{formatBDT(order.productDiscount)}</span></div> : null}
              {order.couponDiscount > 0 ? <div className="flex justify-between text-coral"><span>Coupon {order.couponCode}</span><span>−{formatBDT(order.couponDiscount)}</span></div> : null}
              <div className="flex justify-between"><span className="text-ink/50">Delivery</span><span>{order.shipping === 0 ? "Free" : formatBDT(order.shipping)}</span></div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-bold"><span>Total</span><span>{formatBDT(order.total)}</span></div>
            </div>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-bold">Customer & delivery</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="font-bold">{order.customer.name}</p>
                <a href={`tel:${order.customer.phone}`} className="mt-1 flex items-center gap-1.5 text-ink/55 hover:text-ink">
                  <Phone className="h-3.5 w-3.5" /> {order.customer.phone}
                </a>
                {order.customer.email ? (
                  <a href={`mailto:${order.customer.email}`} className="mt-1 flex items-center gap-1.5 text-ink/55 hover:text-ink">
                    <Mail className="h-3.5 w-3.5" /> {order.customer.email}
                  </a>
                ) : null}
              </div>
              <div>
                <p className="flex items-start gap-1.5 text-ink/55">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {order.customer.address}, {order.customer.area}, {order.customer.district}
                </p>
                {order.customer.notes ? (
                  <p className="mt-2 rounded-lg bg-paper p-2 text-xs text-ink/55">
                    Note: {order.customer.notes}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="font-bold">Status history</h2>
            <ol className="mt-3 space-y-3">
              {order.statusHistory.map((entry, index) => (
                <li key={`${entry.status}-${index}`} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-volt" />
                  <div>
                    <p className="font-semibold">{orderStatusLabels[entry.status]}</p>
                    <p className="text-xs text-ink/45">
                      {formatDate(entry.at)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-4">
          <OrderStatusForm
            orderId={order.id}
            status={order.status}
            paymentStatus={order.payment.status}
          />

          <section className="rounded-2xl border border-ink/10 bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold"><Wallet className="h-4 w-4" /> Payment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink/45">Method</dt><dd className="font-semibold">{paymentMethodLabels[order.payment.method]}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/45">Status</dt><dd className="font-semibold">{paymentStatusLabels[order.payment.status]}</dd></div>
              {order.payment.transactionId ? (
                <div className="flex justify-between gap-3"><dt className="text-ink/45">Transaction</dt><dd className="break-all text-right font-semibold">{order.payment.transactionId}</dd></div>
              ) : null}
              {order.payment.senderNumber ? (
                <div className="flex justify-between gap-3"><dt className="text-ink/45">Sender</dt><dd className="font-semibold">{order.payment.senderNumber}</dd></div>
              ) : null}
              <div className="flex justify-between border-t border-ink/10 pt-2"><dt className="text-ink/45">Amount</dt><dd className="font-bold">{formatBDT(order.total)}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
