"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordRecoveryAction } from "@/app/admin/password-actions";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await requestPasswordRecoveryAction({ email });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setSent(true);
      toast.success("Recovery request submitted");
    } catch {
      toast.error("Could not submit the request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-volt">
        <ShieldQuestion className="h-6 w-6" />
      </span>
      <h1 className="display mt-4 text-3xl font-bold">Forgot password.</h1>
      <p className="mt-2 text-sm text-ink/50">
        Send a recovery request to the Owner. If your admin account is active, the Owner
        will generate a single-use reset link and share it with you.
      </p>

      {sent ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
          Request received. Contact the Owner for your reset link. The link expires after
          30 minutes and can be used once.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="recovery-email">Admin email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <input
                id="recovery-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input pl-9"
                autoComplete="email"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-dark w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Request recovery
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-ink/45">
        <Link href="/admin/login" className="font-bold text-ink hover:text-coral">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
