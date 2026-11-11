"use client";

import { useState } from "react";
import { Loader2, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { revokeResetLinksAction } from "@/app/owner/actions";

export default function RevokeLinksButton({ adminUserId }: { adminUserId: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        setLoading(true);
        try {
          const result = await revokeResetLinksAction(adminUserId);
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          toast.success(result.message);
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className="btn-outline px-3 py-1.5 text-xs"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
      Revoke reset links
    </button>
  );
}
