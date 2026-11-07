import type { Metadata } from "next";
import CheckoutForm from "@/components/site/CheckoutForm";
import { getSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Place your Sporsify order with cash on delivery, bKash or Nagad.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getSettings();
  return <CheckoutForm settings={settings} />;
}
