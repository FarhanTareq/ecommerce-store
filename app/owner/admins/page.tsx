import Link from "next/link";
import { Pencil, Plus, ShieldCheck, UserRound } from "lucide-react";
import {
  getAdminProfiles,
  listAdminAuthUsers,
} from "@/lib/db/admin";
import { requireOwnerPage } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export default async function OwnerAdminsPage() {
  const owner = await requireOwnerPage();
  const [users, profiles] = await Promise.all([
    listAdminAuthUsers(),
    getAdminProfiles(),
  ]);
  const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Access control</p>
          <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Admins.</h1>
          <p className="mt-1 text-sm text-ink/50">
            Create admins and choose exactly which modules and actions they can use.
          </p>
        </div>
        <Link href="/owner/admins/new" className="btn-dark px-4 py-2.5">
          <Plus className="h-4 w-4" /> Create admin
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-wide text-ink/45">
              <tr>
                <th className="px-4 py-3 font-bold">Account</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Permissions</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {users.map((user) => {
                const profile = profileByUser.get(user.id);
                const isOwner = user.id === owner.userId || user.role === "owner";
                return (
                  <tr key={user.id} className="hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper text-xs font-bold">
                          {(user.name || user.email || "A").slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{user.name || "Unnamed"}</p>
                          <p className="truncate text-xs text-ink/45">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        {isOwner ? <ShieldCheck className="h-3 w-3 text-volt" /> : <UserRound className="h-3 w-3" />}
                        {isOwner ? "Owner" : "Admin"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          isOwner
                            ? "bg-emerald-100 text-emerald-800"
                            : profile?.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isOwner ? "active" : profile?.status ?? "no profile"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink/55">
                      {isOwner
                        ? "Full Owner access"
                        : profile
                          ? `${profile.permissions.length} permissions`
                          : "None"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isOwner ? (
                        <span className="text-xs text-ink/35">Protected</span>
                      ) : (
                        <Link
                          href={`/owner/admins/${user.id}`}
                          className="btn-outline px-3 py-1.5 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!users.length ? (
          <p className="p-10 text-center text-sm text-ink/45">
            No Owner or admin accounts found.
          </p>
        ) : null}
      </div>
    </div>
  );
}
