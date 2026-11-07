"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction } from "@/app/admin/actions";

export default function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete “${name}”? This also removes its uploaded images.`)) {
      return;
    }
    setLoading(true);
    try {
      const result = await deleteProductAction(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Product deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete the product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={loading}
      className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink/40 transition hover:border-coral hover:text-coral"
      aria-label={`Delete ${name}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
