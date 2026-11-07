import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Sporsify account with Google or email.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return (
    <section className="container-x py-12">
      <div className="mx-auto max-w-md">
        <Suspense>
          <LoginForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
    </section>
  );
}
