"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

export default function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-[#e8e6df] to-[#d5d2c8]">
        <div className="grid h-full place-items-center">
          <div className="text-center">
            <span className="display block text-8xl font-bold text-ink/15">
              {name.slice(0, 2).toUpperCase()}
            </span>
            <span className="mt-3 block text-xs font-bold uppercase tracking-[0.2em] text-ink/30">
              Sporsify
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-3xl bg-[#edebe5]">
        <Image
          src={images[active]?.url ?? images[0].url}
          alt={images[active]?.alt || name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      {images.length > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#edebe5]",
                index === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image src={image.url} alt={image.alt || name} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
