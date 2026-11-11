"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  setOrderStatusAction,
  setPaymentStatusAction,
} from "@/app/admin/actions";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderStatusForm({
  orderId,
  status,
  paymentStatus,
  canEdit,
  availableStatuses = [],
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  canEdit: boolean;
  availableStatuses?: OrderStatus[];
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<OrderStatus>(status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);

  async function saveStatus() {
    setSaving(true);
    try {
      const result = await setOrderStatusAction(orderId, nextStatus, note);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Order status updated");
      setNote("");
      router.refresh();
    } catch {
      toast.error("Could not update status");
    } finally {
      setSaving(false);
    }
  }

  async function savePayment(next: "verified" | "failed") {
    setPaymentSaving(true);
    try {
      const result = await setPaymentStatusAction(orderId, next);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(next === "verified" ? "Payment verified" : "Payment marked failed");
      router.refresh();
    } catch {
      toast.error("Could not update payment status");
    } finally {
      setPaymentSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white p-5 text-sm text-ink/50">
        You have view-only access to this order status. Contact the Owner if you need edit access.
      </div>
    );
  }

  const statuses = availableStatuses.map((value) => ({
    value,
    label: statusLabels[value],
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <h2 className="font-bold">Update order status</h2>
        <div className="mt-3 space-y-3">
          <select
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
            className="input"
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note for the status history"
            className="input"
          />
          <button type="button" onClick={saveStatus} disabled={saving} className="btn-dark w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save status
          </button>
        </div>
      </div>

      {paymentStatus === "pending_verification" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-900">Verify mobile payment</h2>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Check the transaction ID and sender number against your bKash/Nagad statement
            before verifying.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => savePayment("verified")}
              disabled={paymentSaving}
              className="btn-dark flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <ShieldCheck className="h-4 w-4" /> Verify
            </button>
            <button
              type="button"
              onClick={() => savePayment("failed")}
              disabled={paymentSaving}
              className="btn-outline flex-1 border-red-200 text-red-600 hover:border-red-600 hover:bg-red-600"
            >
              <X className="h-4 w-4" /> Mark failed
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
