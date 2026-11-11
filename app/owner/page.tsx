import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { getAdminProfiles, getAdminRequests } from "@/lib/db/admin";
import { getAuditLogs } from "@/lib/server/audit";
import { requireOwnerPage } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export default async function OwnerOverviewPage() {
  const owner = await requireOwnerPage();
  const [pending, profiles, audit] = await Promise.all([
    getAdminRequests({ status: "pending", limit: 20 }),
    getAdminProfiles(),
    getAuditLogs({ limit: 6 }),
  ]);

  const activeAdmins = profiles.filter((profile) => profile.status === "active").length;
  const suspended = profiles.filter((profile) => profile.status === "suspended").length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Owner control</p>
          <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Owner Panel.</h1>
          <p className="mt-1 text-sm text-ink/50">
            Signed in as {owner.email}. Only you can manage admins, approvals,
            security, and audit logs.
          </p>
        </div>
        <Link href="/owner/admins/new" className="btn-dark px-4 py-2.5">
          + Create admin
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active admins",
            value: String(activeAdmins),
            hint: `${suspended} suspended`,
            icon: Users,
            href: "/owner/admins",
          },
          {
            label: "Pending requests",
            value: String(pending.length),
            hint: "Credential approvals waiting",
            icon: KeyRound,
            href: "/owner/requests",
          },
          {
            label: "Audit events",
            value: String(audit.length),
            hint: "Most recent entries",
            icon: ScrollText,
            href: "/owner/audit",
          },
          {
            label: "Security",
            value: "Owner",
            hint: "Recovery and reset links",
            icon: ShieldCheck,
            href: "/owner/security",
          },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-ink/10 bg-white p-5 transition hover:border-ink"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper">
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/40">
              {card.label}
            </p>
            <p className="display mt-1 text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-ink/45">{card.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-ink/10 bg-white">
          <div className="flex items-center justify-between border-b border-ink/10 p-5">
            <h2 className="font-bold">Pending approvals</h2>
            <Link href="/owner/requests" className="flex items-center gap-1 text-xs font-bold text-ink/50 hover:text-ink">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {pending.length ? (
            <div className="divide-y divide-ink/10">
              {pending.slice(0, 5).map((request) => (
                <Link
                  key={request.id}
                  href="/owner/requests"
                  className="flex items-center justify-between gap-3 p-4 hover:bg-paper"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{request.adminEmail}</p>
                    <p className="text-xs capitalize text-ink/45">
                      {request.type.replaceAll("_", " ")}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink/30" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-ink/45">
              No pending credential requests.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white">
          <div className="flex items-center justify-between border-b border-ink/10 p-5">
            <h2 className="font-bold">Recent audit events</h2>
            <Link href="/owner/audit" className="flex items-center gap-1 text-xs font-bold text-ink/50 hover:text-ink">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {audit.length ? (
            <ul className="divide-y divide-ink/10">
              {audit.slice(0, 5).map((entry) => (
                <li key={entry.id} className="p-4">
                  <p className="text-xs font-bold">{entry.action}</p>
                  <p className="mt-0.5 text-xs text-ink/50">{entry.summary}</p>
                  <p className="mt-1 text-[10px] text-ink/35">
                    {entry.actorEmail || "system"} ·{" "}
                    {new Date(entry.createdAt).toLocaleString("en-BD")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-8 text-center text-sm text-ink/45">No audit events yet.</p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/owner/admins" className="flex items-center justify-between rounded-2xl bg-ink p-5 text-white transition hover:bg-ink/90">
          <span className="flex items-center gap-2 text-sm font-bold">
            <UserCog className="h-4 w-4 text-volt" /> Manage admins
          </span>
          <ArrowRight className="h-4 w-4 text-volt" />
        </Link>
        <Link href="/owner/requests" className="flex items-center justify-between rounded-2xl bg-ink p-5 text-white transition hover:bg-ink/90">
          <span className="flex items-center gap-2 text-sm font-bold">
            <KeyRound className="h-4 w-4 text-volt" /> Review requests
          </span>
          <ArrowRight className="h-4 w-4 text-volt" />
        </Link>
        <Link href="/owner/audit" className="flex items-center justify-between rounded-2xl bg-ink p-5 text-white transition hover:bg-ink/90">
          <span className="flex items-center gap-2 text-sm font-bold">
            <ScrollText className="h-4 w-4 text-volt" /> Audit log
          </span>
          <ArrowRight className="h-4 w-4 text-volt" />
        </Link>
      </div>
    </div>
  );
}
