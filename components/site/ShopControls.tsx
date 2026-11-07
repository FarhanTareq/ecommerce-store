"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type ShopControlsProps = {
  categories: Category[];
  basePath: string;
  activeCategory?: string;
  query: string;
  sort: string;
  total: number;
};

export default function ShopControls({
  categories,
  basePath,
  activeCategory,
  query,
  sort,
  total,
}: ShopControlsProps) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [currentSort, setCurrentSort] = useState(sort || "newest");

  function submit(nextSort = currentSort) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
    const suffix = params.toString();
    router.push(`${basePath}${suffix ? `?${suffix}` : ""}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/shop"
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            !activeCategory
              ? "border-ink bg-ink text-white"
              : "border-ink/15 bg-white hover:border-ink",
          )}
        >
          All gear
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/shop/${category.slug}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              activeCategory === category.slug
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white hover:border-ink",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-3 sm:flex-row sm:items-center">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="relative flex-1"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-ink/10 bg-paper py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ink"
            aria-label="Search products"
          />
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink/40" />
          <select
            value={currentSort}
            onChange={(event) => {
              setCurrentSort(event.target.value);
              submit(event.target.value);
            }}
            className="rounded-xl border border-ink/10 bg-paper px-3 py-2.5 text-sm font-semibold outline-none focus:border-ink"
            aria-label="Sort products"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="discount">Biggest discount</option>
            <option value="name">Name A–Z</option>
          </select>
          <span className="hidden rounded-xl bg-paper px-3 py-2.5 text-xs font-bold text-ink/50 sm:block">
            {total} items
          </span>
        </div>
      </div>
    </div>
  );
}
