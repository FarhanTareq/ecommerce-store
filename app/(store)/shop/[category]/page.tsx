import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/site/JsonLd";
import ShopCatalog from "@/components/site/ShopCatalog";
import { getCategoryBySlug } from "@/lib/db/categories";
import { breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Sport not found" };
  return {
    title: `${category.name} gear in Bangladesh`,
    description: `${category.description} Shop ${category.name.toLowerCase()} equipment at Sporsify with cash on delivery, bKash and Nagad.`,
    alternates: { canonical: `/shop/${category.slug}` },
    openGraph: {
      title: `${category.name} gear | Sporsify`,
      description: category.description,
      url: `/shop/${category.slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const [{ category: slug }, filters] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/shop/${category.slug}` },
        ])}
      />
      <ShopCatalog
        title={`${category.name} gear`}
        description={category.description}
        category={category}
        searchParams={filters}
      />
    </>
  );
}
