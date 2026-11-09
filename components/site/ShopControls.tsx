"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import SearchAutocomplete from "./SearchAutocomplete";

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

  function submit(nextSort = currentSort, term = search) {
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
    const suffix = params.toString();
    router.push(`${basePath}${suffix ? `?${suffix}` : ""}`);
  }

  return (
    <div className="space-y-5">
      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
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
              "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
              activeCategory === category.slug
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white hover:border-ink",
            )}
          >
            {category.image ? (
              <Image
                src={category.image}
                alt=""
                width={22}
                height={22}
                sizes="22px"
                className="h-[22px] w-[22px] rounded-full object-cover"
              />
            ) : null}
            {category.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchAutocomplete
            initialQuery={query}
            placeholder="Search products…"
            showButton={false}
            inputClassName="bg-paper py-2.5"
            onQueryChange={setSearch}
            onSubmit={(term) => submit(currentSort, term)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink/40" />
          <select
            value={currentSort}
            onChange={(event) => {
              setCurrentSort(event.target.value);
              submit(event.target.value, search);
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
