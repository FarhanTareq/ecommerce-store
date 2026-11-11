"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { completePasswordResetAction } from "@/app/admin/password-actions";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result = await completePasswordResetAction({
        token,
        password,
        confirmPassword,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setDone(true);
      toast.success("Password updated");
    } catch {
      toast.error("Could not update the password");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-7 text-center shadow-xl">
        <h1 className="display text-2xl font-bold">Invalid reset link.</h1>
        <p className="mt-2 text-sm text-ink/50">
          Ask the Owner for a new single-use reset link.
        </p>
        <Link href="/admin/login" className="btn-dark mt-5 justify-center">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-volt">
        {done ? <CheckCircle2 className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
      </span>
      <h1 className="display mt-4 text-3xl font-bold">
        {done ? "Password updated." : "Choose a new password."}
      </h1>
      <p className="mt-2 text-sm text-ink/50">
        {done
          ? "All previous sessions were signed out. Sign in with your new password."
          : "This Owner-issued link can be used once and expires after 30 minutes."}
      </p>

      {done ? (
        <Link href="/admin/login" className="btn-dark mt-5 w-full justify-center">
          Sign in
        </Link>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="reset-confirm">Confirm password</label>
            <input
              id="reset-confirm"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-dark w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Update password
          </button>
        </form>
      )}
    </div>
  );
}
