"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  approveRequestAction,
  rejectRequestAction,
} from "@/app/owner/actions";

export default function RequestActions({
  requestId,
  type,
  status,
}: {
  requestId: string;
  type: string;
  status: string;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [resetLink, setResetLink] = useState("");

  if (status !== "pending" && !resetLink) {
    return (
      <span className="text-xs font-semibold capitalize text-ink/40">{status}</span>
    );
  }

  async function approve() {
    setApproving(true);
    try {
      const result = await approveRequestAction(requestId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (result.resetLink) setResetLink(result.resetLink);
      router.refresh();
    } catch {
      toast.error("Could not approve the request");
    } finally {
      setApproving(false);
    }
  }

  async function reject() {
    const note = window.prompt("Optional reason for rejecting this request:") ?? "";
    setRejecting(true);
    try {
      const result = await rejectRequestAction({ requestId, note });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Could not reject the request");
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="space-y-2">
      {status === "pending" ? (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={reject}
            disabled={rejecting || approving}
            className="btn-outline px-3 py-1.5 text-xs text-red-600"
          >
            {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Reject
          </button>
          <button
            type="button"
            onClick={approve}
            disabled={approving || rejecting}
            className="btn-dark px-3 py-1.5 text-xs"
          >
            {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {type === "email_change" ? "Approve & apply" : "Generate link"}
          </button>
        </div>
      ) : null}

      {resetLink ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
            <Link2 className="h-3.5 w-3.5" /> Reset link — shown once
          </p>
          <p className="mt-1 break-all font-mono text-[10px] text-emerald-900">
            {resetLink}
          </p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(resetLink);
              toast.success("Reset link copied");
            }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[10px] font-bold text-white"
          >
            <Copy className="h-3 w-3" /> Copy link
          </button>
        </div>
      ) : null}
    </div>
  );
}
