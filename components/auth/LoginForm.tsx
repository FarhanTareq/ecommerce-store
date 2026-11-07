"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get("next") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        toast.error(result.error.message || "Could not sign in");
        return;
      }
      toast.success("Welcome back");
      router.push(callback);
      router.refresh();
    } catch {
      toast.error("Could not sign in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: callback });
    } catch {
      toast.error("Google sign-in is not available right now");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
      <h1 className="display text-3xl font-bold">Welcome back.</h1>
      <p className="mt-2 text-sm text-ink/50">
        Sign in to see your orders. Checkout still works without an account.
      </p>

      {googleEnabled ? (
        <>
          <button type="button" onClick={google} disabled={loading} className="btn-outline mt-6 w-full">
            <GoogleIcon /> Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/30">
            <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Google sign-in will appear here after the admin adds Google OAuth keys. Email and
          password sign-in works now.
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input pl-9"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input pl-9"
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-dark w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink/50">
        New to Sporsify?{" "}
        <Link href="/register" className="font-bold text-ink underline decoration-volt decoration-2 underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.95l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
