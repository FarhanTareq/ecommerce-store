import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Price } from "./Price";
import QuickAddButton from "./QuickAddButton";

export default function FeaturedProductCard({ product }: { product: Product }) {
  const totalStock = product.sizes.reduce((sum, size) => sum + size.stock, 0);
  const image = product.images[0];
  const hoverImage = product.images[1] ?? image;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white transition duration-300 hover:-translate-y-1.5 hover:border-ink/20 hover:shadow-[0_24px_60px_-28px_rgba(10,13,18,0.55)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-paper">
        {image ? (
          <>
            <Image
              src={image.url}
              alt={image.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition duration-700 group-hover:scale-110",
                hoverImage !== image && "group-hover:opacity-0",
              )}
            />
            {hoverImage !== image ? (
              <Image
                src={hoverImage.url}
                alt={hoverImage.alt || product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="scale-105 object-cover opacity-0 transition duration-700 group-hover:scale-100 group-hover:opacity-100"
              />
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <span className="display block text-6xl font-bold text-ink/15">
                {product.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">
                {product.category}
              </span>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-10"
          aria-label={`View ${product.name}`}
        >
          <span className="absolute inset-x-0 bottom-0 flex justify-center p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <span className="inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink shadow-lg transition-transform duration-300 group-hover:translate-y-0">
              View product <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </span>
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-1.5">
          {product.discountPercent > 0 ? (
            <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              -{product.discountPercent}%
            </span>
          ) : null}
          <span className="rounded-full bg-volt px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ink">
            Featured
          </span>
        </div>

        <div className="absolute right-3 top-3 z-20 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <QuickAddButton product={product} />
        </div>

        {totalStock === 0 ? (
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-paper/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 font-bold leading-snug">
          <Link href={`/product/${product.slug}`} className="hover:text-coral">
            {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Price price={product.price} discountPercent={product.discountPercent} size="sm" />
          <span className="text-[11px] font-medium text-ink/40">
            {totalStock > 0 ? `${totalStock} in stock` : "Sold out"}
          </span>
        </div>
        <div className="mt-auto pt-3">
          {totalStock > 0 ? (
            <QuickAddButton product={product} variant="full" />
          ) : (
            <span className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/15 text-xs font-bold text-ink/40">
              <ShoppingBag className="h-4 w-4" /> Sold out
            </span>
          )}
        </div>
      </div>

      <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-volt transition-transform duration-300 group-hover:scale-x-100" />
    </article>
  );
}
