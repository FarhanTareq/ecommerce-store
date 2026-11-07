import type { Metadata } from "next";
import CartView from "@/components/site/CartView";
import { getSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review your Sporsify gear and checkout with cash on delivery, bKash or Nagad.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getSettings();
  return <CartView settings={settings} />;
}
