"use client";

import { useState } from "react";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/types";
import { getSalePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type QuickAddButtonProps = {
  product: Product;
  variant?: "icon" | "full";
};

export default function QuickAddButton({
  product,
  variant = "icon",
}: QuickAddButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const size = product.sizes.find((entry) => entry.stock > 0);

  function handleAdd() {
    if (!size) {
      toast.error("This product is out of stock");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.url ?? "",
      brand: product.brand,
      price: product.price,
      discountPercent: product.discountPercent,
      size: size.size,
      stock: size.stock,
    });
    setAdded(true);
    toast.success(`${product.name} added to cart`, {
      description: `Size ${size.size} · ৳${getSalePrice(product.price, product.discountPercent).toLocaleString("en-BD")}`,
    });
    window.setTimeout(() => setAdded(false), 1400);
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={!size}
        className={cn(
          "mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-bold text-white transition active:scale-[0.98] hover:bg-volt hover:text-ink disabled:cursor-not-allowed disabled:opacity-35",
          added && "bg-volt text-ink",
        )}
        aria-label={`Add ${product.name} to cart`}
      >
        {added ? (
          <>
            <Check className="h-4 w-4" /> Added
          </>
        ) : size ? (
          <>
            <ShoppingBag className="h-4 w-4" /> Add to cart
          </>
        ) : (
          "Sold out"
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!size}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full bg-ink text-white shadow-lg transition hover:bg-volt hover:text-ink disabled:cursor-not-allowed disabled:opacity-30",
        added && "bg-volt text-ink",
      )}
      aria-label={`Add ${product.name} to cart`}
    >
      {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </button>
  );
}
