import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/db/categories";
import { getProductById } from "@/lib/db/products";
import { actorHas } from "@/lib/server/authorization";
import { requireAnyPagePermission } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireAnyPagePermission(["products.view", "products.edit"]);
  const canEdit = actorHas(actor, "products.edit");
  const [product, categories] = await Promise.all([getProductById(id), getCategories()]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/50 hover:text-ink"
        >
          View on store <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mb-5">
        <p className="eyebrow">{canEdit ? "Edit product" : "Product details"}</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">{product.name}</h1>
      </div>
      <ProductForm
        product={product}
        categories={categories}
        uploadEnabled={Boolean(process.env.UPLOADTHING_TOKEN)}
        readOnly={!canEdit}
      />
    </div>
  );
}
