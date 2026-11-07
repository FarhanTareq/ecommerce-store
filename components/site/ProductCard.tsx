import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { Price } from "./Price";
import QuickAddButton from "./QuickAddButton";

export default function ProductCard({ product }: { product: Product }) {
  const totalStock = product.sizes.reduce((sum, size) => sum + size.stock, 0);
  const image = product.images[0];

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-[#e8e6df] to-[#d5d2c8]">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="text-center">
              <span className="display block text-5xl font-bold text-ink/15">
                {product.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">
                {product.category}
              </span>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.discountPercent > 0 ? (
            <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              -{product.discountPercent}%
            </span>
          ) : null}
          {product.featured ? (
            <span className="rounded-full bg-volt px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ink">
              Featured
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <QuickAddButton product={product} />
        </div>
        {totalStock === 0 ? (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
              {product.brand}
            </p>
            <h3 className="mt-1 font-bold leading-snug">
              <Link href={`/product/${product.slug}`} className="hover:text-coral">
                {product.name}
              </Link>
            </h3>
          </div>
          <Link
            href={`/product/${product.slug}`}
            className="mt-1 text-ink/30 transition hover:text-ink"
            aria-label={`View ${product.name}`}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Price price={product.price} discountPercent={product.discountPercent} size="sm" />
          <span className="text-[11px] font-medium text-ink/40">
            {totalStock > 0 ? `${totalStock} in stock` : "Sold out"}
          </span>
        </div>
      </div>
    </article>
  );
}
