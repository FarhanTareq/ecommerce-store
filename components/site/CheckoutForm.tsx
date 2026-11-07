"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Check,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { cartSubtotal, useCartStore } from "@/lib/cart-store";
import { getSalePrice, getShippingFee } from "@/lib/pricing";
import type { PaymentMethod, Settings } from "@/lib/types";
import { districts } from "@/lib/site";
import { cn, formatBDT } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";

type CouponState = {
  code: string;
  discount: number;
  description: string;
};

const paymentOptions: {
  value: PaymentMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "cod",
    title: "Cash on delivery",
    description: "Pay the rider when your order arrives.",
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    value: "bkash",
    title: "bKash",
    description: "Send money, then submit the transaction ID.",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    value: "nagad",
    title: "Nagad",
    description: "Send money, then submit the transaction ID.",
    icon: <Smartphone className="h-5 w-5" />,
  },
];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  area: "",
  district: "Dhaka",
  notes: "",
  transactionId: "",
  senderNumber: "",
};

function getInitialForm() {
  if (typeof window === "undefined") return emptyForm;
  try {
    const saved = window.localStorage.getItem("sporsify-customer");
    if (!saved) return emptyForm;
    const data = JSON.parse(saved) as Partial<typeof emptyForm>;
    return { ...emptyForm, ...data, transactionId: "", senderNumber: "" };
  } catch {
    return emptyForm;
  }
}

export default function CheckoutForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const { data: session } = useSession();
  const mounted = useMounted();
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<CouponState | null>(null);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(getInitialForm);

  const sessionEmail = session?.user?.email ?? "";
  const sessionName = session?.user?.name ?? "";

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const productDiscount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (item.price - getSalePrice(item.price, item.discountPercent)) * item.quantity,
        0,
      ),
    [items],
  );
  const afterDiscount = subtotal - productDiscount;
  const couponDiscount = coupon ? Math.min(coupon.discount, afterDiscount) : 0;
  const payable = afterDiscount - couponDiscount;
  const shipping = getShippingFee(settings, form.district, payable);
  const total = payable + shipping;
  const isMobile = method !== "cod";
  const paymentNumber =
    method === "bkash" ? settings.bkashNumber : settings.nagadNumber;

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function applyCoupon() {
    if (!code.trim()) {
      toast.error("Enter a coupon code");
      return;
    }
    setApplying(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
          district: form.district,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.message || "Coupon could not be applied");
        return;
      }
      setCoupon(data.coupon);
      toast.success(`Coupon ${data.coupon.code} applied`);
    } catch {
      toast.error("Could not validate the coupon. Try again.");
    } finally {
      setApplying(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }
    if (isMobile && !form.transactionId.trim()) {
      toast.error("Enter the transaction ID from your payment");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name || sessionName,
            phone: form.phone,
            email: form.email || sessionEmail,
            address: form.address,
            area: form.area,
            district: form.district,
            notes: form.notes,
          },
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
          couponCode: coupon?.code ?? "",
          payment: {
            method,
            transactionId: form.transactionId,
            senderNumber: form.senderNumber,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.message || "Could not place the order");
        return;
      }
      window.localStorage.setItem(
        "sporsify-customer",
        JSON.stringify({
          name: form.name || sessionName,
          phone: form.phone,
          email: form.email || sessionEmail,
          address: form.address,
          area: form.area,
          district: form.district,
        }),
      );
      clear();
      router.push(`/orders/${data.token}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="container-x py-10">
        <div className="h-64 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <section className="container-x py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-ink/10 bg-white p-10 text-center">
          <h1 className="display text-3xl font-bold">Nothing to check out</h1>
          <p className="mt-2 text-sm text-ink/50">Your cart is empty right now.</p>
          <Link href="/shop" className="btn-dark mt-6">Browse gear</Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="container-x py-10">
      <div className="mb-7">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="display mt-2 text-4xl font-bold">Where should we send it?</h1>
        <p className="mt-2 text-sm text-ink/50">
          No account needed. We will call to confirm your order before dispatch.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
            <h2 className="display text-xl font-bold">Delivery details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  required
                  value={form.name || sessionName}
                  onChange={(event) => update("name", event.target.value)}
                  className="input"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  required
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  className="input"
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="label" htmlFor="email">Email (optional)</label>
                <input
                  id="email"
                  type="email"
                  value={form.email || sessionEmail}
                  onChange={(event) => update("email", event.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">Street address</label>
                <textarea
                  id="address"
                  required
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  className="input min-h-20 resize-y"
                  placeholder="House, road, landmark"
                  autoComplete="street-address"
                />
              </div>
              <div>
                <label className="label" htmlFor="area">Area / thana</label>
                <input
                  id="area"
                  required
                  value={form.area}
                  onChange={(event) => update("area", event.target.value)}
                  className="input"
                  placeholder="e.g. Dhanmondi"
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label className="label" htmlFor="district">District</label>
                <select
                  id="district"
                  value={form.district}
                  onChange={(event) => update("district", event.target.value)}
                  className="input"
                >
                  {districts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">Order notes (optional)</label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  className="input min-h-16 resize-y"
                  placeholder="Delivery instructions, preferred time, etc."
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
            <h2 className="display text-xl font-bold">Payment method</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {paymentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMethod(option.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    method === option.value
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 hover:border-ink",
                  )}
                >
                  <span className={cn("mb-3 inline-grid h-9 w-9 place-items-center rounded-lg", method === option.value ? "bg-volt text-ink" : "bg-paper")}>
                    {option.icon}
                  </span>
                  <span className="block font-bold">{option.title}</span>
                  <span className={cn("mt-1 block text-[11px] leading-4", method === option.value ? "text-white/55" : "text-ink/45")}>
                    {option.description}
                  </span>
                </button>
              ))}
            </div>

            {isMobile ? (
              <div className="mt-4 rounded-xl border border-ink/10 bg-paper p-4">
                {paymentNumber ? (
                  <>
                    <p className="text-sm font-bold">
                      Send {formatBDT(total)} to {method === "bkash" ? "bKash" : "Nagad"}: <span className="text-coral">{paymentNumber}</span>
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink/50">
                      Use the “Send Money” option, then enter your transaction ID below. Our team
                      verifies payments manually before dispatch.
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-coral">
                    The {method === "bkash" ? "bKash" : "Nagad"} number has not been added by the
                    admin yet. Please choose cash on delivery or contact us.
                  </p>
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="transactionId">Transaction ID</label>
                    <input
                      id="transactionId"
                      value={form.transactionId}
                      onChange={(event) => update("transactionId", event.target.value)}
                      className="input"
                      placeholder="e.g. 9A7B2C1D4E"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="senderNumber">Sender number (optional)</label>
                    <input
                      id="senderNumber"
                      value={form.senderNumber}
                      onChange={(event) => update("senderNumber", event.target.value)}
                      className="input"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-paper p-4 text-sm text-ink/55">
                Keep {formatBDT(total)} ready. You can pay the delivery rider in cash.
              </p>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-ink/10 bg-white p-5 lg:sticky lg:top-28">
          <h2 className="display text-xl font-bold">Your order</h2>
          <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => {
              const sale = getSalePrice(item.price, item.discountPercent);
              return (
                <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="display grid h-full place-items-center text-[10px] font-bold text-ink/25">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    <p className="text-[11px] text-ink/45">{item.size} · Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatBDT(sale * item.quantity)}</p>
                </div>
              );
            })}
          </div>

          {!coupon ? (
            <div className="mt-4 flex gap-2">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="input py-2.5"
                aria-label="Coupon code"
              />
              <button type="button" onClick={applyCoupon} disabled={applying} className="btn-outline shrink-0 px-4 py-2.5">
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-volt bg-volt/20 px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 font-bold">
                <Tag className="h-3.5 w-3.5" /> {coupon.code}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCoupon(null);
                  setCode("");
                }}
                className="text-ink/40 hover:text-ink"
                aria-label="Remove coupon"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-4 space-y-2.5 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/50">Subtotal</span>
              <span className="font-semibold">{formatBDT(subtotal)}</span>
            </div>
            {productDiscount > 0 ? (
              <div className="flex justify-between text-coral">
                <span>Product discount</span>
                <span className="font-semibold">−{formatBDT(productDiscount)}</span>
              </div>
            ) : null}
            {couponDiscount > 0 ? (
              <div className="flex justify-between text-coral">
                <span>Coupon discount</span>
                <span className="font-semibold">−{formatBDT(couponDiscount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-ink/50">Delivery ({form.district})</span>
              <span className="font-semibold">{shipping === 0 ? "Free" : formatBDT(shipping)}</span>
            </div>
            <p className="text-[11px] leading-5 text-ink/40">
              Inside Dhaka {formatBDT(settings.insideDhakaFee)} · Outside Dhaka{" "}
              {formatBDT(settings.outsideDhakaFee)}
              {settings.freeShippingThreshold > 0
                ? ` · Free over ${formatBDT(settings.freeShippingThreshold)}`
                : ""}
            </p>
            <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
              <span className="font-bold">Total</span>
              <span className="display text-2xl font-bold">{formatBDT(total)}</span>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-volt mt-5 w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Placing order…
              </>
            ) : (
              <>
                Place order <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-ink/40">
            <span className="flex items-center gap-1"><LockKeyhole className="h-3 w-3" /> Secure</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified store</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> No account needed</span>
          </div>
        </aside>
      </div>
    </form>
  );
}
