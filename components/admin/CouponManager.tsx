"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Plus, Save, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteCouponAction, saveCouponAction } from "@/app/admin/actions";
import type { Coupon, CouponType } from "@/lib/types";
import { formatBDT } from "@/lib/utils";

type FormState = {
  code: string;
  type: CouponType;
  value: string;
  minSubtotal: string;
  maxDiscount: string;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  perPhoneLimit: string;
  active: boolean;
};

const emptyForm: FormState = {
  code: "",
  type: "percent",
  value: "10",
  minSubtotal: "0",
  maxDiscount: "0",
  startsAt: "",
  expiresAt: "",
  usageLimit: "0",
  perPhoneLimit: "0",
  active: true,
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minSubtotal: String(coupon.minSubtotal),
      maxDiscount: String(coupon.maxDiscount),
      startsAt: toLocalInput(coupon.startsAt),
      expiresAt: toLocalInput(coupon.expiresAt),
      usageLimit: String(coupon.usageLimit ?? 0),
      perPhoneLimit: String(coupon.perPhoneLimit ?? 0),
      active: coupon.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditing(null);
    setForm(emptyForm);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveCouponAction(
        {
          code: form.code,
          type: form.type,
          value: Number(form.value),
          minSubtotal: Number(form.minSubtotal),
          maxDiscount: Number(form.maxDiscount),
          startsAt: toIso(form.startsAt),
          expiresAt: toIso(form.expiresAt),
          usageLimit: Number(form.usageLimit),
          perPhoneLimit: Number(form.perPhoneLimit),
          active: form.active,
        },
        editing?.id,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      reset();
      router.refresh();
    } catch {
      toast.error("Could not save the coupon");
    } finally {
      setSaving(false);
    }
  }

  async function remove(coupon: Coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    const result = await deleteCouponAction(coupon.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Coupon deleted");
    if (editing?.id === coupon.id) reset();
    router.refresh();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.3fr]">
      <form onSubmit={submit} className="h-fit rounded-2xl border border-ink/10 bg-white p-5 xl:sticky xl:top-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{editing ? "Edit coupon" : "Create a coupon"}</h2>
          {editing ? (
            <button type="button" onClick={reset} className="text-ink/40 hover:text-ink" aria-label="Cancel edit">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="coupon-code">Coupon code</label>
            <input
              id="coupon-code"
              required
              value={form.code}
              onChange={(event) => update("code", event.target.value.toUpperCase())}
              className="input"
              placeholder="PLAY10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="coupon-type">Type</label>
              <select
                id="coupon-type"
                value={form.type}
                onChange={(event) => update("type", event.target.value as CouponType)}
                className="input"
              >
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="coupon-value">
                {form.type === "percent" ? "Percent off" : "Taka off"}
              </label>
              <input
                id="coupon-value"
                type="number"
                min={1}
                max={form.type === "percent" ? 100 : undefined}
                required
                value={form.value}
                onChange={(event) => update("value", event.target.value)}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="coupon-min">Min order (৳)</label>
              <input
                id="coupon-min"
                type="number"
                min={0}
                value={form.minSubtotal}
                onChange={(event) => update("minSubtotal", event.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="coupon-max">Max discount (৳)</label>
              <input
                id="coupon-max"
                type="number"
                min={0}
                value={form.maxDiscount}
                onChange={(event) => update("maxDiscount", event.target.value)}
                className="input"
              />
              <p className="mt-1 text-[10px] text-ink/40">0 = no cap</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="coupon-start">Starts at</label>
              <input
                id="coupon-start"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => update("startsAt", event.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="coupon-expiry">Expires at</label>
              <input
                id="coupon-expiry"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => update("expiresAt", event.target.value)}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="coupon-limit">Usage limit</label>
              <input
                id="coupon-limit"
                type="number"
                min={0}
                value={form.usageLimit}
                onChange={(event) => update("usageLimit", event.target.value)}
                className="input"
              />
              <p className="mt-1 text-[10px] text-ink/40">0 = unlimited</p>
            </div>
            <div>
              <label className="label" htmlFor="coupon-phone">Per phone limit</label>
              <input
                id="coupon-phone"
                type="number"
                min={0}
                value={form.perPhoneLimit}
                onChange={(event) => update("perPhoneLimit", event.target.value)}
                className="input"
              />
              <p className="mt-1 text-[10px] text-ink/40">0 = unlimited</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => update("active", event.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Active
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-volt mt-4 w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Save coupon" : "Create coupon"}
        </button>
      </form>

      <div className="rounded-2xl border border-ink/10 bg-white">
        <div className="flex items-center justify-between border-b border-ink/10 p-5">
          <h2 className="font-bold">All coupons</h2>
          <span className="chip"><Tag className="h-3.5 w-3.5" /> {coupons.length}</span>
        </div>
        <div className="divide-y divide-ink/10">
          {coupons.map((coupon) => {
            return (
              <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-paper px-2.5 py-1 font-mono text-sm font-bold">
                      {coupon.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        !coupon.active
                          ? "bg-ink/10 text-ink/45"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {coupon.active ? "active" : "off"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink/50">
                    {coupon.type === "percent" ? `${coupon.value}% off` : `${formatBDT(coupon.value)} off`}
                    {coupon.minSubtotal > 0 ? ` · min ${formatBDT(coupon.minSubtotal)}` : ""}
                    {coupon.usageLimit ? ` · ${coupon.usedCount}/${coupon.usageLimit} used` : ` · ${coupon.usedCount} used`}
                  </p>
                  {coupon.expiresAt ? (
                    <p className="mt-0.5 text-[11px] text-ink/35">
                      Expires {new Date(coupon.expiresAt).toLocaleString("en-BD")}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(coupon)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink/50 hover:border-ink hover:text-ink"
                    aria-label={`Edit ${coupon.code}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(coupon)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink/40 hover:border-coral hover:text-coral"
                    aria-label={`Delete ${coupon.code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {!coupons.length ? (
          <div className="p-10 text-center text-sm text-ink/45">
            <Plus className="mx-auto mb-2 h-8 w-8 text-ink/25" />
            No coupons yet. Create your first offer.
          </div>
        ) : null}
      </div>
    </div>
  );
}
