import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mail, PackageOpen, UserRound } from "lucide-react";
import OrderStatusBadge from "@/components/site/OrderStatusBadge";
import SignOutButton from "@/components/auth/SignOutButton";
import { getOrdersForUser } from "@/lib/db/orders";
import { getServerSession, sessionRole } from "@/lib/server/guard";
import { paymentMethodLabels } from "@/lib/order-status";
import { formatBDT, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My account",
  description: "Your Sporsify account and order history.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login?next=/account");

  const orders = await getOrdersForUser(session.user.id, session.user.email ?? "");
  const role = sessionRole(session);

  return (
    <section className="container-x py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 rounded-3xl border border-ink/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink text-2xl font-bold text-volt">
              {(session.user.name || session.user.email || "S").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="eyebrow">Your account</p>
              <h1 className="display text-2xl font-bold">{session.user.name || "Sporsify player"}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink/50">
                <Mail className="h-3.5 w-3.5" /> {session.user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === "admin" ? (
              <Link href="/admin" className="btn-dark px-4 py-2">Admin panel</Link>
            ) : null}
            <SignOutButton />
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Order history</p>
              <h2 className="display mt-1 text-2xl font-bold">Your recent orders.</h2>
            </div>
            <span className="chip"><UserRound className="h-3.5 w-3.5" /> {session.user.email}</span>
          </div>

          {orders.length ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-ink/45">{formatDate(order.createdAt)}</p>
                      <p className="mt-2 text-sm text-ink/60">
                        {order.items.length} item{order.items.length > 1 ? "s" : ""} ·{" "}
                        {paymentMethodLabels[order.payment.method]} ·{" "}
                        <span className="font-bold text-ink">{formatBDT(order.total)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      <Link href={`/orders/${order.publicToken}`} className="btn-outline px-3 py-2 text-xs">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-10 text-center">
              <PackageOpen className="mx-auto h-9 w-9 text-ink/30" />
              <h3 className="display mt-3 text-2xl font-bold">No orders yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink/50">
                Your future order history will appear here. You can also order as a guest any time.
              </p>
              <Link href="/shop" className="btn-dark mt-5">Find your gear</Link>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 text-sm text-ink/55">
          <p className="font-bold text-ink">Guest checkout still works</p>
          <p className="mt-1 leading-6">
            You never need an account to buy from Sporsify. Use{" "}
            <Link href="/track-order" className="font-semibold text-ink underline decoration-volt decoration-2 underline-offset-4">
              order tracking
            </Link>{" "}
            with your order number and phone if you checked out as a guest.
          </p>
        </div>
      </div>
    </section>
  );
}
