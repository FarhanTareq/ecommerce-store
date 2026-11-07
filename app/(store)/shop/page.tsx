import type { Metadata } from "next";
import ShopCatalog from "@/components/site/ShopCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop all sports gear",
  description:
    "Browse cricket, football, running, gym, badminton and basketball gear at Sporsify. Cash on delivery, bKash and Nagad accepted across Bangladesh.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop all sports gear | Sporsify",
    description:
      "Performance sports gear delivered across Bangladesh. Pay with cash on delivery, bKash or Nagad.",
    url: "/shop",
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  return (
    <ShopCatalog
      title="All gear, one place."
      description="Performance equipment for every sport and every level. Filter by sport, search for your next upgrade, and order without creating an account."
      searchParams={params}
    />
  );
}
