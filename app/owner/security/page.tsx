import Link from "next/link";
import { KeyRound, ShieldAlert, ShieldCheck, Terminal } from "lucide-react";
import RevokeLinksButton from "@/components/owner/RevokeLinksButton";
import { getAdminProfiles, getAuthUserById } from "@/lib/db/admin";
import { requireOwnerPage } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export default async function OwnerSecurityPage() {
  const owner = await requireOwnerPage();
  const profiles = await getAdminProfiles();
  const admins = (
    await Promise.all(
      profiles.map(async (profile) => {
        const user = await getAuthUserById(profile.userId);
        return user ? { profile, user } : null;
      }),
    )
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <p className="eyebrow">Owner security</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Security controls.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Owner identity, terminal recovery, and single-use reset link management.
        </p>
      </div>

      <section className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-volt">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold">Owner identity</h2>
            <p className="text-xs text-ink/45">{owner.email}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-paper p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink/40">User id</p>
            <p className="mt-1 break-all font-mono text-xs">{owner.userId}</p>
          </div>
          <div className="rounded-xl bg-paper p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink/40">Role</p>
            <p className="mt-1 text-xs font-bold">owner</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          The Owner role is bound to the MongoDB <code>system_config.owner</code> record.
          Redeploying will not overwrite the Owner password or identity.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <h2 className="font-bold">Immediate terminal recovery</h2>
        </div>
        <p className="mt-2 text-sm text-ink/55">
          If you are locked out, run this on the server hosting the app:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-4 text-xs text-volt">
          npm run owner:reset
        </pre>
        <p className="mt-2 text-xs text-ink/45">
          The password prompt is hidden, the new password is hashed, and all Owner
          sessions are revoked immediately.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/10 p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <KeyRound className="h-4 w-4" /> Reset link controls
          </h2>
          <p className="mt-1 text-xs text-ink/45">
            Revoke outstanding links for any admin. Generating a new link also revokes
            the previous one.
          </p>
        </div>
        {admins.length ? (
          <ul className="divide-y divide-ink/10">
            {admins.map(({ profile, user }) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-bold">{user.name || user.email}</p>
                  <p className="text-xs text-ink/45">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      profile.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {profile.status}
                  </span>
                  <RevokeLinksButton adminUserId={user.id} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-sm text-ink/45">
            No admin accounts yet.{" "}
            <Link href="/owner/admins/new" className="font-bold text-ink hover:text-coral">
              Create one
            </Link>
            .
          </p>
        )}
      </section>

      <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-800">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        Never share the Owner password. Send reset links only to the verified admin
        through a private channel. Links appear once in the Owner Panel.
      </div>
    </div>
  );
}
