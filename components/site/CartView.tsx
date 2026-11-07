"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cartSubtotal, useCartStore } from "@/lib/cart-store";
import { getSalePrice, getShippingFee } from "@/lib/pricing";
import type { Settings } from "@/lib/types";
import { formatBDT } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";

type CouponState = {
  code: string;
  discount: number;
  description: string;
};

export default function CartView({ settings }: { settings: Settings }) {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const mounted = useMounted();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<CouponState | null>(null);
  const [applying, setApplying] = useState(false);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const productDiscount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (item.price - getSalePrice(item.price, item.discountPercent)) * item.quantity,
        0,
      ),
    [items],
  );
  const afterDiscount = subtotal - productDiscount;
  const couponDiscount = coupon ? Math.min(coupon.discount, afterDiscount) : 0;
  const payable = afterDiscount - couponDiscount;
  const shipping = getShippingFee(settings, "Dhaka", payable);
  const total = payable + shipping;

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
          district: "Dhaka",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.message || "Coupon could not be applied");
        return;
      }
      setCoupon(data.coupon);
      toast.success(`Coupon ${data.coupon.code} applied`, {
        description: data.coupon.description,
      });
    } catch {
      toast.error("Could not validate the coupon. Try again.");
    } finally {
      setApplying(false);
    }
  }

  if (!mounted) {
    return (
      <div className="container-x py-16">
        <div className="h-40 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <section className="container-x py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-ink/10 bg-white p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-volt">
            <ShoppingBag className="h-7 w-7" />
          </span>
          <h1 className="display mt-5 text-3xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-ink/50">
            Add some gear and it will show up here. No account needed to order.
          </p>
          <Link href="/shop" className="btn-dark mt-6">
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-x py-10">
      <div className="mb-7">
        <p className="eyebrow">Almost game time</p>
        <h1 className="display mt-2 text-4xl font-bold">Your cart.</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-3">
          {items.map((item) => {
            const sale = getSalePrice(item.price, item.discountPercent);
            return (
              <article
                key={`${item.productId}-${item.size}`}
                className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-3 sm:p-4"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#e8e6df] to-[#d5d2c8] sm:h-28 sm:w-28"
                >
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                  ) : (
                    <span className="display grid h-full place-items-center text-2xl font-bold text-ink/20">
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
                        {item.brand}
                      </p>
                      <h2 className="truncate font-bold">
                        <Link href={`/product/${item.slug}`} className="hover:text-coral">
                          {item.name}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-xs text-ink/45">Size: {item.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.size)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/35 transition hover:bg-coral/10 hover:text-coral"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-ink/15">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.productId, item.size, item.quantity - 1)
                        }
                        className="grid h-8 w-8 place-items-center hover:bg-paper"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.productId, item.size, item.quantity + 1)
                        }
                        className="grid h-8 w-8 place-items-center hover:bg-paper"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold">{formatBDT(sale * item.quantity)}</p>
                      {item.discountPercent > 0 ? (
                        <p className="text-xs text-ink/35 line-through">
                          {formatBDT(item.price * item.quantity)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold hover:text-coral">
            ← Continue shopping
          </Link>
        </div>

        <aside className="h-fit rounded-2xl border border-ink/10 bg-white p-5 lg:sticky lg:top-28">
          <h2 className="display text-xl font-bold">Order summary</h2>

          <div className="mt-4 space-y-2.5 text-sm">
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
            {coupon ? (
              <div className="flex items-center justify-between text-coral">
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> {coupon.code}
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      setCode("");
                    }}
                    className="text-ink/35 hover:text-ink"
                    aria-label="Remove coupon"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
                <span className="font-semibold">−{formatBDT(couponDiscount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-ink/50">Delivery (Dhaka estimate)</span>
              <span className="font-semibold">
                {shipping === 0 ? "Free" : formatBDT(shipping)}
              </span>
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

          {!coupon ? (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="input py-2.5"
                  aria-label="Coupon code"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applying}
                  className="btn-outline shrink-0 px-4 py-2.5"
                >
                  {applying ? "…" : "Apply"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-ink/40">
                Coupon discount is rechecked securely at checkout.
              </p>
            </div>
          ) : null}

          <Link href="/checkout" className="btn-volt mt-5 w-full">
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-center text-[11px] text-ink/40">
            No account required · COD, bKash & Nagad
          </p>

          <div className="mt-4 rounded-xl bg-paper p-3 text-[11px] leading-5 text-ink/50">
            {settings.freeShippingThreshold > 0 &&
            payable >= settings.freeShippingThreshold ? (
              <span className="font-semibold text-ink">You unlocked free delivery.</span>
            ) : settings.freeShippingThreshold > 0 ? (
              <span>
                Add {formatBDT(settings.freeShippingThreshold - payable)} more for free delivery.
              </span>
            ) : (
              <span>Delivery is calculated by district at checkout.</span>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
