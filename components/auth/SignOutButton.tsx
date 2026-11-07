"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut();
        toast.success("Signed out");
        router.push("/");
        router.refresh();
      }}
      className="btn-outline px-4 py-2"
    >
      <LogOut className="h-4 w-4" /> {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
