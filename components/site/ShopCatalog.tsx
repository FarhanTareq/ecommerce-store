import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { getCategories } from "@/lib/db/categories";
import { getProducts } from "@/lib/db/products";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import JsonLd from "./JsonLd";

import ProductCard from "./ProductCard";
import ShopControls from "./ShopControls";
import { itemListJsonLd } from "@/lib/seo";

type ShopCatalogProps = {
  title: string;
  description: string;
  category?: Category;
  searchParams: { q?: string; sort?: string; page?: string };
};

function pageHref(
  basePath: string,
  page: number,
  query: string,
  sort: string,
) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (sort && sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `${basePath}${suffix ? `?${suffix}` : ""}`;
}

export default async function ShopCatalog({
  title,
  description,
  category,
  searchParams,
}: ShopCatalogProps) {
  const query = searchParams.q?.trim() ?? "";
  const sort = searchParams.sort ?? "newest";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({
      category: category?.slug,
      search: query,
      sort,
      page,
      pageSize: 12,
    }),
  ]);
  const basePath = category ? `/shop/${category.slug}` : "/shop";

  return (
    <>
      <JsonLd data={itemListJsonLd(result.items, title)} />
      <section className="container-x pt-10">
        <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-ink/40" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          {category ? (
            <>
              <span>/</span>
              <span className="text-ink">{category.name}</span>
            </>
          ) : null}
        </nav>
        <div className="mb-7 max-w-3xl">
          <p className="eyebrow">{category ? "Shop by sport" : "The full collection"}</p>
          <h1 className="display mt-2 text-4xl font-bold sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/55">{description}</p>
        </div>

        <ShopControls
          categories={categories}
          basePath={basePath}
          activeCategory={category?.slug}
          query={query}
          sort={sort}
          total={result.total}
        />

        <div className="mt-8">
          {result.items.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {result.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-12 text-center">
              <PackageSearch className="mx-auto h-9 w-9 text-ink/30" />
              <h2 className="display mt-3 text-2xl font-bold">No gear found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink/50">
                Try a different search or browse another sport. New stock drops every week.
              </p>
              <Link href="/shop" className="btn-dark mt-5">Browse all gear</Link>
            </div>
          )}
        </div>

        {result.pages > 1 ? (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Link
              href={pageHref(basePath, Math.max(1, page - 1), query, sort)}
              aria-disabled={page === 1}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-white hover:border-ink",
                page === 1 && "pointer-events-none opacity-30",
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            {Array.from({ length: result.pages }, (_, index) => index + 1)
              .filter((item) => Math.abs(item - page) < 3 || item === 1 || item === result.pages)
              .map((item, index, list) => (
                <span key={item} className="flex items-center gap-2">
                  {index > 0 && item - list[index - 1] > 1 ? (
                    <span className="text-xs text-ink/30">…</span>
                  ) : null}
                  <Link
                    href={pageHref(basePath, item, query, sort)}
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full border text-sm font-bold",
                      item === page
                        ? "border-ink bg-ink text-white"
                        : "border-ink/15 bg-white hover:border-ink",
                    )}
                  >
                    {item}
                  </Link>
                </span>
              ))}
            <Link
              href={pageHref(basePath, Math.min(result.pages, page + 1), query, sort)}
              aria-disabled={page === result.pages}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-white hover:border-ink",
                page === result.pages && "pointer-events-none opacity-30",
              )}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </section>
    </>
  );
}
