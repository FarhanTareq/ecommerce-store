import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/db/categories";
import { requirePagePermission } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requirePagePermission("products.create");
  const categories = await getCategories();
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <div className="mb-5">
        <p className="eyebrow">New product</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Add gear to the store.</h1>
      </div>
      <ProductForm categories={categories} uploadEnabled={Boolean(process.env.UPLOADTHING_TOKEN)} />
    </div>
  );
}
