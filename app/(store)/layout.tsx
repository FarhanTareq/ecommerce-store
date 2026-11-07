import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { getCategories } from "@/lib/db/categories";
import { getSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header categories={categories} announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} settings={settings} />
    </div>
  );
}
