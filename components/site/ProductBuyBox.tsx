"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/cart-store";
import { getSalePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { cn, formatBDT } from "@/lib/utils";

export default function ProductBuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const availableSizes = product.sizes.filter((size) => size.stock > 0);
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]?.size ?? "");
  const [quantity, setQuantity] = useState(1);

  const selected = useMemo(
    () => product.sizes.find((size) => size.size === selectedSize),
    [product.sizes, selectedSize],
  );
  const maxQuantity = Math.max(1, selected?.stock ?? 1);
  const salePrice = getSalePrice(product.price, product.discountPercent);

  function add() {
    if (!selected || selected.stock < 1) {
      toast.error("Select an available size first");
      return false;
    }
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url ?? "",
        brand: product.brand,
        price: product.price,
        discountPercent: product.discountPercent,
        size: selected.size,
        stock: selected.stock,
      },
      quantity,
    );
    toast.success(`${product.name} added to cart`, {
      description: `Size ${selected.size} · Qty ${quantity}`,
    });
    return true;
  }

  function buyNow() {
    if (add()) router.push("/checkout");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your price</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="display text-4xl font-bold">{formatBDT(salePrice)}</span>
              {product.discountPercent > 0 ? (
                <>
                  <span className="text-lg font-medium text-ink/35 line-through">
                    {formatBDT(product.price)}
                  </span>
                  <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white">
                    -{product.discountPercent}%
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className="text-right text-xs text-ink/50">
            <p className="font-bold text-ink">{selected?.stock ?? 0} in stock</p>
            <p>{selected ? `Size ${selected.size}` : "Choose a size"}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="label">Select size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const disabled = size.stock < 1;
              return (
                <button
                  key={size.size}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSelectedSize(size.size);
                    setQuantity(1);
                  }}
                  className={cn(
                    "min-w-14 rounded-xl border px-4 py-2.5 text-sm font-bold transition",
                    selectedSize === size.size
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 bg-white hover:border-ink",
                    disabled && "cursor-not-allowed border-dashed opacity-40 line-through",
                  )}
                >
                  {size.size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <p className="label">Quantity</p>
            <div className="flex items-center rounded-xl border border-ink/15">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid h-11 w-11 place-items-center hover:bg-paper"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                className="grid h-11 w-11 place-items-center hover:bg-paper"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!availableSizes.length}
            className="btn-dark h-[46px] flex-1"
          >
            <ShoppingBag className="h-4 w-4" /> Add to cart
          </button>
        </div>
        <button
          type="button"
          onClick={buyNow}
          disabled={!availableSizes.length}
          className="btn-volt mt-3 w-full"
        >
          Buy now — cash on delivery
        </button>

        <div className="mt-5 grid gap-3 border-t border-ink/10 pt-4 text-xs text-ink/55 sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-ink" /> Fast nationwide delivery
          </p>
          <p className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-ink" /> COD, bKash & Nagad
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5 text-sm leading-6 text-ink/65">
        <p className="mb-2 font-bold text-ink">How ordering works</p>
        <p>
          No account needed. Add your gear, enter your delivery details and choose cash on
          delivery or send payment via bKash/Nagad. We will call you to confirm the order.
        </p>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur-xl lg:hidden">
        <div className="container-x flex items-center gap-2 py-2.5">
          <div className="min-w-0 shrink-0">
            <p className="display text-lg font-bold leading-none">{formatBDT(salePrice)}</p>
            <p className="mt-1 text-[10px] font-semibold text-ink/45">
              {selected ? `Size ${selected.size}` : "Choose size"}
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!availableSizes.length}
            className="btn-dark h-11 flex-1 px-3 text-xs"
          >
            <ShoppingBag className="h-4 w-4" /> Add to cart
          </button>
          <button
            type="button"
            onClick={buyNow}
            disabled={!availableSizes.length}
            className="btn-volt h-11 shrink-0 px-4 text-xs"
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}
