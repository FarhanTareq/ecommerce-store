import type { Metadata } from "next";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import AdminAccountForm from "@/components/admin/AdminAccountForm";
import { getAdminRequests } from "@/lib/db/admin";
import { requirePagePermission } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin account",
  robots: { index: false, follow: false },
};

export default async function AdminAccountPage() {
  const actor = await requirePagePermission("account.view");
  const requests = await getAdminRequests({
    adminUserId: actor.userId,
    status: "pending",
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5">
        <p className="eyebrow">Security</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Admin account.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Manage the credentials used to access the Sporsify admin panel.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="h-fit rounded-2xl border border-ink/10 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-lg font-bold text-volt">
              {(actor.name || actor.email || "A").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">{actor.name || "Administrator"}</p>
              <p className="text-xs text-ink/45">
                {actor.isOwner ? "Owner" : "Administrator"}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-ink/10 pt-4 text-sm">
            <p className="flex items-center gap-2 text-ink/60">
              <UserRound className="h-4 w-4 text-ink/35" /> {actor.name || "Admin"}
            </p>
            <p className="flex items-center gap-2 break-all text-ink/60">
              <Mail className="h-4 w-4 shrink-0 text-ink/35" /> {actor.email}
            </p>
            <p className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />{" "}
              {actor.isOwner ? "Owner access" : "Admin access enabled"}
            </p>
          </div>
        </aside>

        <AdminAccountForm
          isOwner={actor.isOwner}
          currentEmail={actor.email}
          pending={requests.map((request) => ({
            id: request.id,
            type: request.type,
            proposedEmail: request.proposedEmail,
            createdAt: request.createdAt,
          }))}
        />
      </div>
    </div>
  );
}
