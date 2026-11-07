"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveProductAction } from "@/app/admin/actions";
import { getSalePrice } from "@/lib/pricing";
import type { Category, Product, ProductImage, ProductStatus } from "@/lib/types";
import { formatBDT, slugify } from "@/lib/utils";
import ImageUploader from "./ImageUploader";

type SizeRow = { size: string; stock: number };

type ProductFormProps = {
  product?: Product;
  categories: Category[];
  uploadEnabled: boolean;
};

export default function ProductForm({ product, categories, uploadEnabled }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [category, setCategory] = useState(product?.category ?? categories[0]?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "Sporsify");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [discountPercent, setDiscountPercent] = useState(String(product?.discountPercent ?? 0));
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [sizes, setSizes] = useState<SizeRow[]>(
    product?.sizes?.length ? product.sizes : [{ size: "One Size", stock: 10 }],
  );
  const [tags, setTags] = useState(product?.tags.join(", ") ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "active");
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? "");
  const [saving, setSaving] = useState(false);

  const numericPrice = Number(price) || 0;
  const numericDiscount = Number(discountPercent) || 0;
  const salePrice = getSalePrice(numericPrice, numericDiscount);

  function updateSize(index: number, field: keyof SizeRow, value: string) {
    setSizes((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [field]: field === "stock" ? Number(value) : value }
          : row,
      ),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveProductAction(
        {
          name,
          slug: slug || slugify(name),
          category,
          description,
          brand,
          price: numericPrice,
          discountPercent: numericDiscount,
          images,
          sizes: sizes
            .filter((size) => size.size.trim())
            .map((size) => ({ size: size.size.trim(), stock: Number(size.stock) || 0 })),
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          featured,
          status,
          seoTitle,
          seoDescription,
        },
        product?.id,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Could not save the product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Product basics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="name">Product name</label>
              <input
                id="name"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugTouched) setSlug(slugify(event.target.value));
                }}
                className="input"
                placeholder="e.g. Pro Grip Cricket Bat"
              />
            </div>
            <div>
              <label className="label" htmlFor="slug">URL slug</label>
              <input
                id="slug"
                required
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                className="input"
                placeholder="pro-grip-cricket-bat"
              />
            </div>
            <div>
              <label className="label" htmlFor="brand">Brand</label>
              <input
                id="brand"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className="input"
                placeholder="Sporsify"
              />
            </div>
            <div>
              <label className="label" htmlFor="category">Sport / category</label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="input"
              >
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as ProductStatus)}
                className="input"
              >
                <option value="active">Active — visible in store</option>
                <option value="draft">Draft — hidden</option>
                <option value="archived">Archived — hidden</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="description">Description</label>
              <textarea
                id="description"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="input min-h-36 resize-y"
                placeholder="Tell customers what makes this gear worth it…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="tags">Tags (comma separated)</label>
              <input
                id="tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="input"
                placeholder="lightweight, match-ready, beginner"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
                className="h-4 w-4 accent-black"
              />
              Feature on homepage
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Pricing</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="price">Original price (৳)</label>
              <input
                id="price"
                type="number"
                required
                min={1}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="input"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="label" htmlFor="discount">Discount (%)</label>
              <input
                id="discount"
                type="number"
                min={0}
                max={95}
                value={discountPercent}
                onChange={(event) => setDiscountPercent(event.target.value)}
                className="input"
                placeholder="0"
              />
            </div>
            <div>
              <span className="label">Selling price</span>
              <div className="rounded-xl bg-volt/30 px-4 py-3">
                <p className="text-xl font-extrabold">{formatBDT(salePrice)}</p>
                {numericDiscount > 0 ? (
                  <p className="text-xs text-ink/45 line-through">{formatBDT(numericPrice)}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Sizes & stock</h2>
          <p className="mt-1 text-xs text-ink/45">Stock is tracked separately for each size.</p>
          <div className="mt-4 space-y-2">
            {sizes.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={row.size}
                  onChange={(event) => updateSize(index, "size", event.target.value)}
                  className="input flex-1"
                  placeholder="Size label e.g. M, 42, One Size"
                />
                <input
                  type="number"
                  min={0}
                  value={row.stock}
                  onChange={(event) => updateSize(index, "stock", event.target.value)}
                  className="input w-28"
                  placeholder="Stock"
                />
                <button
                  type="button"
                  onClick={() => setSizes((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink/15 text-coral hover:border-coral"
                  aria-label="Remove size"
                  disabled={sizes.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSizes((current) => [...current, { size: "", stock: 0 }])}
            className="mt-3 flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
          >
            <Plus className="h-4 w-4" /> Add another size
          </button>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Product images</h2>
          <p className="mt-1 text-xs text-ink/45">
            The first image is used as the main photo and for social sharing.
          </p>
          <div className="mt-4">
            <ImageUploader images={images} onChange={setImages} enabled={uploadEnabled} />
          </div>
        </section>

        <details className="rounded-2xl border border-ink/10 bg-white p-5">
          <summary className="cursor-pointer font-bold">SEO settings</summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="seoTitle">SEO title</label>
              <input
                id="seoTitle"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                className="input"
                placeholder={name ? `${name} — Sporsify` : "Leave blank to use product name"}
                maxLength={70}
              />
            </div>
            <div>
              <label className="label" htmlFor="seoDescription">SEO description</label>
              <textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                className="input min-h-24 resize-y"
                placeholder="Short description for Google and social previews"
                maxLength={160}
              />
            </div>
          </div>
        </details>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-6">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="font-bold">Publish</h2>
          <p className="mt-1 text-xs text-ink/45">
            Changes go live on the storefront immediately after saving.
          </p>
          <button type="submit" disabled={saving} className="btn-volt mt-4 w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {product ? "Save changes" : "Create product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="btn-ghost mt-2 w-full"
          >
            Cancel
          </button>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="label">Live preview</p>
          <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-[#e8e6df] to-[#d5d2c8]">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0].url} alt={images[0].alt || name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">
                <span className="display text-4xl font-bold text-ink/20">
                  {(name || "SP").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink/40">{brand || "Sporsify"}</p>
          <p className="mt-1 font-bold">{name || "Product name"}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-extrabold">{formatBDT(salePrice)}</span>
            {numericDiscount > 0 ? (
              <span className="text-xs text-ink/40 line-through">{formatBDT(numericPrice)}</span>
            ) : null}
          </div>
        </div>
      </aside>
    </form>
  );
}
