import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { getAllProductsForAdmin, getProductCounts } from "@/lib/db/products";
import { getSalePrice } from "@/lib/pricing";
import { formatBDT } from "@/lib/utils";
import { requirePagePermission } from "@/lib/server/page-guards";
import { actorHas } from "@/lib/server/authorization";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const actor = await requirePagePermission("products.view");
  const canCreate = actorHas(actor, "products.create");
  const canEdit = actorHas(actor, "products.edit");
  const canDelete = actorHas(actor, "products.delete");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const [result, counts] = await Promise.all([
    getAllProductsForAdmin({ search: q, page, pageSize: 20, sort: "newest" }),
    getProductCounts(),
  ]);

  function pageHref(nextPage: number) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (nextPage > 1) search.set("page", String(nextPage));
    const suffix = search.toString();
    return `/admin/products${suffix ? `?${suffix}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Products.</h1>
          <p className="mt-1 text-sm text-ink/50">
            {counts.total} products · {counts.active} active · {counts.lowStock} low stock
          </p>
        </div>
        {canCreate ? (
          <Link href="/admin/products/new" className="btn-dark px-4 py-2.5">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        ) : null}
      </div>

      <form className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by product name, tag or description…"
            className="input pl-9"
          />
        </div>
        <button className="btn-outline px-5">Search</button>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-wide text-ink/45">
              <tr>
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Price</th>
                <th className="px-4 py-3 font-bold">Stock</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {result.items.map((product) => {
                const stock = product.sizes.reduce((sum, size) => sum + size.stock, 0);
                return (
                  <tr key={product.id} className="hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.images[0].alt || product.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="display grid h-full place-items-center text-[10px] font-bold text-ink/25">
                              {product.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{product.name}</p>
                          <p className="truncate text-xs text-ink/40">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-ink/60">{product.category}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{formatBDT(getSalePrice(product.price, product.discountPercent))}</p>
                      {product.discountPercent > 0 ? (
                        <p className="text-xs text-ink/35 line-through">{formatBDT(product.price)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={stock <= 3 ? "font-bold text-coral" : "font-semibold"}>
                        {stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          product.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-ink/10 text-ink/50"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit ? (
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink/50 transition hover:border-ink hover:text-ink"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        ) : null}
                        <DeleteProductButton
                          id={product.id}
                          name={product.name}
                          canDelete={canDelete}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!result.items.length ? (
          <div className="p-10 text-center text-sm text-ink/45">
            {q
              ? `No products match “${q}”.`
              : canCreate
                ? "No products yet. Add your first product."
                : "No products yet."}
          </div>
        ) : null}
      </div>

      {result.pages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm">
          <p className="text-xs text-ink/45">
            Page {result.page} of {result.pages}
          </p>
          <div className="flex gap-2">
            <Link
              href={pageHref(Math.max(1, page - 1))}
              className={`btn-outline px-3 py-2 ${page === 1 ? "pointer-events-none opacity-30" : ""}`}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Link>
            <Link
              href={pageHref(Math.min(result.pages, page + 1))}
              className={`btn-outline px-3 py-2 ${page === result.pages ? "pointer-events-none opacity-30" : ""}`}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
