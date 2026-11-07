"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/admin/actions";
import type { Settings } from "@/lib/types";

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    insideDhakaFee: String(settings.insideDhakaFee),
    outsideDhakaFee: String(settings.outsideDhakaFee),
    freeShippingThreshold: String(settings.freeShippingThreshold),
    bkashNumber: settings.bkashNumber,
    nagadNumber: settings.nagadNumber,
    contactPhone: settings.contactPhone,
    contactEmail: settings.contactEmail,
    address: settings.address,
    announcement: settings.announcement,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
  });
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveSettingsAction({
        ...form,
        insideDhakaFee: Number(form.insideDhakaFee),
        outsideDhakaFee: Number(form.outsideDhakaFee),
        freeShippingThreshold: Number(form.freeShippingThreshold),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Store settings saved");
      router.refresh();
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1.4fr_0.7fr]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Delivery & shipping</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="insideDhakaFee">Inside Dhaka (৳)</label>
              <input
                id="insideDhakaFee"
                type="number"
                min={0}
                value={form.insideDhakaFee}
                onChange={(event) => update("insideDhakaFee", event.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="outsideDhakaFee">Outside Dhaka (৳)</label>
              <input
                id="outsideDhakaFee"
                type="number"
                min={0}
                value={form.outsideDhakaFee}
                onChange={(event) => update("outsideDhakaFee", event.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="freeShippingThreshold">Free delivery over (৳)</label>
              <input
                id="freeShippingThreshold"
                type="number"
                min={0}
                value={form.freeShippingThreshold}
                onChange={(event) => update("freeShippingThreshold", event.target.value)}
                className="input"
              />
              <p className="mt-1 text-[10px] text-ink/40">Set 0 to disable free delivery</p>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-paper p-3 text-xs leading-5 text-ink/50">
            Shipping is charged by district after product and coupon discounts. Orders at or above
            the free-delivery threshold are delivered free.
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Mobile payment numbers</h2>
          <p className="mt-1 text-xs text-ink/45">
            These numbers are shown to customers who choose bKash or Nagad at checkout.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bkashNumber">bKash number</label>
              <input
                id="bkashNumber"
                value={form.bkashNumber}
                onChange={(event) => update("bkashNumber", event.target.value)}
                className="input"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="label" htmlFor="nagadNumber">Nagad number</label>
              <input
                id="nagadNumber"
                value={form.nagadNumber}
                onChange={(event) => update("nagadNumber", event.target.value)}
                className="input"
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Contact & brand</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="contactPhone">Contact phone</label>
              <input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(event) => update("contactPhone", event.target.value)}
                className="input"
                placeholder="+8801XXXXXXXXX"
              />
            </div>
            <div>
              <label className="label" htmlFor="contactEmail">Contact email</label>
              <input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(event) => update("contactEmail", event.target.value)}
                className="input"
                placeholder="hello@sporsify.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">Store address</label>
              <input
                id="address"
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                className="input"
                placeholder="Shop address, Dhaka"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="announcement">Ticker announcement</label>
              <input
                id="announcement"
                value={form.announcement}
                onChange={(event) => update("announcement", event.target.value)}
                className="input"
                placeholder="Inside Dhaka ৳70 · Outside Dhaka ৳150 · Free over ৳3,000"
              />
            </div>
            <div>
              <label className="label" htmlFor="facebookUrl">Facebook URL</label>
              <input
                id="facebookUrl"
                value={form.facebookUrl}
                onChange={(event) => update("facebookUrl", event.target.value)}
                className="input"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="label" htmlFor="instagramUrl">Instagram URL</label>
              <input
                id="instagramUrl"
                value={form.instagramUrl}
                onChange={(event) => update("instagramUrl", event.target.value)}
                className="input"
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-6">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Save settings</h2>
          <p className="mt-1 text-xs leading-5 text-ink/45">
            Changes apply to the storefront, cart, checkout and footer immediately.
          </p>
          <button type="submit" disabled={saving} className="btn-volt mt-4 w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-5 text-xs leading-6 text-ink/55">
          <p className="font-bold text-ink">Tip</p>
          <p className="mt-1">
            Keep the announcement short — it scrolls across the top of the store. Add your real
            bKash/Nagad numbers so customers can pay manually.
          </p>
        </div>
      </aside>
    </form>
  );
}
