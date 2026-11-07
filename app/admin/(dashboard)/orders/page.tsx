import Link from "next/link";
import { ChevronLeft, ChevronRight, ReceiptText, Search } from "lucide-react";
import OrderStatusBadge from "@/components/site/OrderStatusBadge";
import { getOrders } from "@/lib/db/orders";
import { orderStatusLabels, paymentMethodLabels, paymentStatusLabels } from "@/lib/order-status";
import { formatBDT, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statuses = ["all", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const result = await getOrders({ search: q, status, page, pageSize: 20 });

  function href(nextPage = page, nextStatus = status) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (nextStatus !== "all") search.set("status", nextStatus);
    if (nextPage > 1) search.set("page", String(nextPage));
    const suffix = search.toString();
    return `/admin/orders${suffix ? `?${suffix}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Fulfilment</p>
          <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Orders.</h1>
          <p className="mt-1 text-sm text-ink/50">{result.total} orders total</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Link
            key={item}
            href={href(1, item)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold capitalize transition ${
              status === item
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white text-ink/60 hover:border-ink"
            }`}
          >
            {item === "all" ? "All orders" : orderStatusLabels[item as keyof typeof orderStatusLabels]}
          </Link>
        ))}
      </div>

      <form className="mt-3 flex gap-2">
        <input type="hidden" name="status" value={status} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order number, name, phone or email…"
            className="input pl-9"
          />
        </div>
        <button className="btn-outline px-5">Search</button>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-wide text-ink/45">
              <tr>
                <th className="px-4 py-3 font-bold">Order</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Payment</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {result.items.map((order) => (
                <tr key={order.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-bold hover:text-coral">
                      {order.orderNumber}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink/40">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{order.customer.name}</p>
                    <p className="text-xs text-ink/45">{order.customer.phone}</p>
                    <p className="text-xs text-ink/40">{order.customer.district}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{paymentMethodLabels[order.payment.method]}</p>
                    <p className={`text-xs ${
                      order.payment.status === "verified"
                        ? "text-emerald-600"
                        : order.payment.status === "failed"
                          ? "text-red-600"
                          : "text-amber-600"
                    }`}>
                      {paymentStatusLabels[order.payment.status]}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold">{formatBDT(order.total)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="btn-outline px-3 py-1.5 text-xs">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!result.items.length ? (
          <div className="p-10 text-center text-sm text-ink/45">
            <ReceiptText className="mx-auto mb-2 h-8 w-8 text-ink/25" />
            No orders match this filter.
          </div>
        ) : null}
      </div>

      {result.pages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm">
          <p className="text-xs text-ink/45">Page {result.page} of {result.pages}</p>
          <div className="flex gap-2">
            <Link href={href(Math.max(1, page - 1))} className={`btn-outline px-3 py-2 ${page === 1 ? "pointer-events-none opacity-30" : ""}`}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Link>
            <Link href={href(Math.min(result.pages, page + 1))} className={`btn-outline px-3 py-2 ${page === result.pages ? "pointer-events-none opacity-30" : ""}`}>
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
