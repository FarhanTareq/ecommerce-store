import Link from "next/link";
import {
  ArrowDownRight,
  Banknote,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { getSalesReport, normalizeRange, reportRanges } from "@/lib/db/reports";
import { requirePagePermission } from "@/lib/server/page-guards";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requirePagePermission("revenue.view");
  const params = await searchParams;
  const range = normalizeRange(params.range);
  const report = await getSalesReport(range);
  const maxDaily = Math.max(1, ...report.daily.map((day) => day.revenue));
  const recentDays = report.daily.slice(-14);

  const cards = [
    {
      label: "Revenue",
      value: formatBDT(report.summary.revenue),
      hint: "Non-cancelled orders",
      icon: Banknote,
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
      label: "Cancelled",
      value: String(report.summary.cancelledOrders),
      hint: formatBDT(report.summary.cancelledValue),
      icon: ArrowDownRight,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Financial overview</p>
          <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Revenue.</h1>
          <p className="mt-1 text-sm text-ink/50">
            Revenue from non-cancelled orders. Cancelled orders are shown separately.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {reportRanges.map((item) => (
            <Link
              key={item}
              href={`/admin/revenue?range=${item}`}
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
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-ink/10 bg-white p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper">
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/40">
              {card.label}
            </p>
            <p className="display mt-1 text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-ink/45">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Recent daily revenue</h2>
            <span className="text-xs text-ink/40">Last 14 active days</span>
          </div>
          {recentDays.length ? (
            <div className="mt-5 flex h-48 items-end gap-2">
              {recentDays.map((day) => (
                <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="text-[9px] font-bold text-ink/40">
                    {formatBDT(day.revenue)}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-ink transition hover:bg-coral"
                    style={{
                      height: `${Math.max(6, (day.revenue / maxDaily) * 140)}px`,
                    }}
                    title={`${day.date}: ${formatBDT(day.revenue)}`}
                  />
                  <span className="text-[9px] text-ink/35">{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-paper p-6 text-center text-sm text-ink/45">
              No revenue recorded in this period.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <ShoppingBag className="h-4 w-4" /> Orders by status
          </h2>
          <div className="mt-4 space-y-2">
            {report.statuses.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-xs"
              >
                <span className="font-semibold capitalize">{row.status}</span>
                <span className="text-ink/45">
                  {row.count} · {formatBDT(row.value)}
                </span>
              </div>
            ))}
            {!report.statuses.length ? (
              <p className="text-sm text-ink/45">No orders in this period.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
