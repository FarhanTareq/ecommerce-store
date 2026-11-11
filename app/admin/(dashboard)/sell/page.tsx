import Link from "next/link";
import { BarChart3, Package, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { getSalesReport, normalizeRange, reportRanges } from "@/lib/db/reports";
import { requirePagePermission } from "@/lib/server/page-guards";
import { paymentMethodLabels } from "@/lib/order-status";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSellPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requirePagePermission("sell.view");
  const params = await searchParams;
  const range = normalizeRange(params.range);
  const report = await getSalesReport(range);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Sales & Reports.</h1>
          <p className="mt-1 text-sm text-ink/50">
            Read-only sales performance. Orders are created only by customers at checkout.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {reportRanges.map((item) => (
            <Link
              key={item}
              href={`/admin/sell?range=${item}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                range === item
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-white text-ink/60 hover:border-ink"
              }`}
            >
              {item === 365 ? "1 year" : `${item} days`}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Revenue",
            value: formatBDT(report.summary.revenue),
            hint: "Non-cancelled orders",
            icon: Wallet,
          },
          {
            label: "Orders",
            value: String(report.summary.orders),
            hint: `${report.summary.units} units sold`,
            icon: ReceiptText,
          },
          {
            label: "Average order",
            value: formatBDT(report.summary.averageOrderValue),
            hint: "Revenue ÷ orders",
            icon: TrendingUp,
          },
          {
            label: "Best seller units",
            value: String(report.topProducts[0]?.quantity ?? 0),
            hint: report.topProducts[0]?.name ?? "No sales yet",
            icon: Package,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-ink/10 bg-white p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper">
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/40">
              {card.label}
            </p>
            <p className="display mt-1 text-2xl font-bold">{card.value}</p>
            <p className="mt-1 truncate text-xs text-ink/45">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-ink/10 bg-white">
          <div className="flex items-center justify-between border-b border-ink/10 p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <BarChart3 className="h-4 w-4" /> Top products
            </h2>
            <span className="text-xs text-ink/40">By units sold</span>
          </div>
          {report.topProducts.length ? (
            <div className="divide-y divide-ink/10">
              {report.topProducts.map((product, index) => (
                <div key={`${product.productId}-${index}`} className="flex items-center gap-3 p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{product.name}</p>
                    <p className="text-xs text-ink/45">{product.quantity} units</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{formatBDT(product.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-ink/45">
              No product sales in this period.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Payment methods</h2>
          <div className="mt-4 space-y-2">
            {report.payments.map((row) => (
              <div key={row.method} className="rounded-xl bg-paper p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{paymentMethodLabels[row.method]}</span>
                  <span className="font-bold">{formatBDT(row.value)}</span>
                </div>
                <p className="mt-0.5 text-ink/45">{row.count} orders</p>
              </div>
            ))}
            {!report.payments.length ? (
              <p className="text-sm text-ink/45">No payments in this period.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/10 p-5">
          <h2 className="font-bold">Daily sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-ink/45">
              <tr>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Orders</th>
                <th className="px-4 py-3 text-right font-bold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {[...report.daily].reverse().map((day) => (
                <tr key={day.date}>
                  <td className="px-4 py-2.5 text-xs font-semibold">{day.date}</td>
                  <td className="px-4 py-2.5 text-xs text-ink/55">{day.orders}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold">
                    {formatBDT(day.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!report.daily.length ? (
          <p className="p-8 text-center text-sm text-ink/45">No sales in this period.</p>
        ) : null}
      </section>
    </div>
  );
}
