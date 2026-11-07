import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import JsonLd from "@/components/site/JsonLd";
import ProductBuyBox from "@/components/site/ProductBuyBox";
import ProductCard from "@/components/site/ProductCard";
import ProductGallery from "@/components/site/ProductGallery";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getProductBySlug, getRelatedProducts } from "@/lib/db/products";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const title = product.seoTitle || `${product.name} — ${product.brand}`;
  const description =
    product.seoDescription ||
    product.description.replace(/\s+/g, " ").slice(0, 158);
  const image = product.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | Sporsify`,
      description,
      url: `/product/${product.slug}`,
      images: image ? [{ url: image, alt: product.name }] : ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Sporsify`,
      description,
      images: image ? [image] : ["/opengraph-image"],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategoryBySlug(product.category),
    getRelatedProducts(product.category, product.id, 4),
  ]);

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product, category ?? undefined),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            ...(category
              ? [{ name: category.name, path: `/shop/${category.slug}` }]
              : []),
            { name: product.name, path: `/product/${product.slug}` },
          ]),
        ]}
      />

      <section className="container-x pt-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/40" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          {category ? (
            <>
              <span>/</span>
              <Link href={`/shop/${category.slug}`} className="hover:text-ink">
                {category.name}
              </Link>
            </>
          ) : null}
          <span>/</span>
          <span className="line-clamp-1 text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="chip">{product.brand}</span>
              {category ? (
                <Link href={`/shop/${category.slug}`} className="chip hover:border-ink">
                  {category.name}
                </Link>
              ) : null}
              {product.featured ? (
                <span className="chip border-volt bg-volt/30">Featured</span>
              ) : null}
            </div>
            <h1 className="display text-4xl font-bold leading-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink/55">
              {product.description.split("\n")[0]}
            </p>

            <div className="mt-6">
              <ProductBuyBox product={product} />
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-xs text-ink/55 sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-ink" /> Delivery in 1–4 business days
              </p>
              <p className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-ink" /> Checked before dispatch
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-ink" /> Authentic product guarantee
              </p>
              <p className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-ink" /> 7-day easy return
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
            <h2 className="display text-2xl font-bold">Product details</h2>
            <div className="prose-store mt-4 whitespace-pre-line text-sm">
              {product.description}
            </div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
            <h2 className="display text-2xl font-bold">Specs & stock</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-ink/10 pb-3">
                <dt className="text-ink/45">Brand</dt>
                <dd className="font-semibold">{product.brand}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-ink/10 pb-3">
                <dt className="text-ink/45">Sport</dt>
                <dd className="font-semibold">{category?.name ?? product.category}</dd>
              </div>
              <div className="border-b border-ink/10 pb-3">
                <dt className="mb-2 text-ink/45">Sizes</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <span
                      key={size.size}
                      className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                        size.stock > 0
                          ? "border-ink/15 text-ink"
                          : "border-dashed border-ink/15 text-ink/35 line-through"
                      }`}
                    >
                      {size.size}
                    </span>
                  ))}
                </dd>
              </div>
              {product.tags.length ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.tags.map((tag) => (
                    <span key={tag} className="chip">{tag}</span>
                  ))}
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        {related.length ? (
          <div className="mt-20">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Complete your kit</p>
                <h2 className="display mt-2 text-3xl font-bold">You might also like.</h2>
              </div>
              <Link href={`/shop/${product.category}`} className="text-sm font-bold hover:text-coral">
                More {category?.name ?? "gear"}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        ) : null}

      </section>
    </>
  );
}
