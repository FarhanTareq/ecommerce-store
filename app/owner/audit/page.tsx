import { ScrollText } from "lucide-react";
import { getAuditLogs } from "@/lib/server/audit";
import { requireOwnerPage } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export default async function OwnerAuditPage() {
  await requireOwnerPage();
  const logs = await getAuditLogs({ limit: 200 });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <p className="eyebrow">Accountability</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Audit log.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Recent security and admin actions. Passwords, tokens, and secrets are never
          stored here.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-wide text-ink/45">
              <tr>
                <th className="px-4 py-3 font-bold">When</th>
                <th className="px-4 py-3 font-bold">Actor</th>
                <th className="px-4 py-3 font-bold">Action</th>
                <th className="px-4 py-3 font-bold">Summary</th>
                <th className="px-4 py-3 font-bold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {logs.map((entry) => (
                <tr key={entry.id} className="hover:bg-paper/60">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink/55">
                    {new Date(entry.createdAt).toLocaleString("en-BD")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold">{entry.actorEmail || "system"}</p>
                    <p className="text-[10px] text-ink/35">{entry.actorId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-paper px-2.5 py-1 font-mono text-[10px] font-bold text-ink/60">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/60">{entry.summary}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-ink/40">
                    {entry.ip || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs.length ? (
          <div className="p-10 text-center text-sm text-ink/45">
            <ScrollText className="mx-auto mb-2 h-8 w-8 text-ink/25" />
            No audit events recorded yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
