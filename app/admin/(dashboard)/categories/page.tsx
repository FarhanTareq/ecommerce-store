import CategoryManager from "@/components/admin/CategoryManager";
import { getAllCategories, getCategoryProductCounts } from "@/lib/db/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, counts] = await Promise.all([
    getAllCategories(),
    getCategoryProductCounts(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <p className="eyebrow">Catalog</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Categories.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Add a new sport, change its picture, reorder it, or hide it from the storefront.
        </p>
      </div>
      <CategoryManager
        categories={categories}
        counts={counts}
        uploadEnabled={Boolean(process.env.UPLOADTHING_TOKEN)}
      />
    </div>
  );
}
