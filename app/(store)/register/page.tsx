import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterForm from "@/components/auth/RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Sporsify account to track orders and check out faster.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return (
    <section className="container-x py-12">
      <div className="mx-auto max-w-md">
        <Suspense>
          <RegisterForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
    </section>
  );
}
