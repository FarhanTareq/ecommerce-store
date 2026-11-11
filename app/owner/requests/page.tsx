import { KeyRound, Mail, ShieldQuestion } from "lucide-react";
import RequestActions from "@/components/owner/RequestActions";
import { getAdminRequests } from "@/lib/db/admin";
import { requireOwnerPage } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  email_change: "Email change",
  password_change: "Password change",
  password_recovery: "Password recovery",
};

function RequestCard({
  request,
}: {
  request: Awaited<ReturnType<typeof getAdminRequests>>[number];
}) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink/60">
              {typeLabels[request.type] ?? request.type}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                request.status === "pending"
                  ? "bg-amber-100 text-amber-800"
                  : request.status === "completed"
                    ? "bg-emerald-100 text-emerald-800"
                    : request.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-800"
              }`}
            >
              {request.status}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold">
            <Mail className="h-3.5 w-3.5 text-ink/35" /> {request.adminEmail}
          </p>
          {request.proposedEmail ? (
            <p className="mt-1 text-xs text-ink/55">
              Requested new email: <span className="font-semibold">{request.proposedEmail}</span>
            </p>
          ) : null}
          {request.reason ? (
            <p className="mt-2 rounded-lg bg-paper p-2 text-xs text-ink/55">
              {request.reason}
            </p>
          ) : null}
          <p className="mt-2 text-[10px] text-ink/35">
            Requested {new Date(request.createdAt).toLocaleString("en-BD")}
            {request.resolvedAt
              ? ` · Resolved ${new Date(request.resolvedAt).toLocaleString("en-BD")}`
              : ""}
          </p>
          {request.resolutionNote ? (
            <p className="mt-1 text-[10px] text-ink/40">Note: {request.resolutionNote}</p>
          ) : null}
        </div>
        <div className="w-full sm:w-auto">
          <RequestActions
            requestId={request.id}
            type={request.type}
            status={request.status}
          />
        </div>
      </div>
    </article>
  );
}

export default async function OwnerRequestsPage() {
  await requireOwnerPage();
  const requests = await getAdminRequests({ status: "all", limit: 200 });
  const pending = requests.filter((request) => request.status === "pending");
  const resolved = requests.filter((request) => request.status !== "pending");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <p className="eyebrow">Approvals</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Credential requests.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Approve email changes, or generate a single-use 30-minute reset link for
          password requests and show it to the admin privately.
        </p>
      </div>

      <section>
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <ShieldQuestion className="h-4 w-4" /> Pending
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">
            {pending.length}
          </span>
        </h2>
        <div className="mt-3 space-y-3">
          {pending.length ? (
            pending.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-ink/20 bg-white p-8 text-center text-sm text-ink/45">
              No pending requests.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <KeyRound className="h-4 w-4" /> History
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] text-ink/60">
            {resolved.length}
          </span>
        </h2>
        <div className="mt-3 space-y-3">
          {resolved.length ? (
            resolved.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-ink/20 bg-white p-8 text-center text-sm text-ink/45">
              No resolved requests yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
