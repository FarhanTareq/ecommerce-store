import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck, Truck, Wallet } from "lucide-react";
import type { Category, Settings } from "@/lib/types";
import { siteConfig } from "@/lib/site";

type FooterProps = {
  categories: Category[];
  settings: Settings;
};

export default function Footer({ categories, settings }: FooterProps) {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container-x py-14">
        <div className="mb-12 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-5 w-5 text-volt" />
            <div>
              <p className="font-bold">Nationwide delivery</p>
              <p className="text-sm text-white/55">Inside Dhaka 1–2 days · outside 2–4 days</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 h-5 w-5 text-volt" />
            <div>
              <p className="font-bold">COD, bKash & Nagad</p>
              <p className="text-sm text-white/55">Pay in the way that works for you</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-volt" />
            <div>
              <p className="font-bold">Authentic gear</p>
              <p className="text-sm text-white/55">Performance equipment worth trusting</p>
            </div>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="display text-3xl font-bold">
              Sporsify<span className="text-volt">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/55">
              {siteConfig.tagline} Performance sports gear, delivered across Bangladesh.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/65">
              {settings.contactPhone ? (
                <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 hover:text-volt">
                  <Phone className="h-4 w-4" /> {settings.contactPhone}
                </a>
              ) : null}
              {settings.contactEmail ? (
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 hover:text-volt">
                  <Mail className="h-4 w-4" /> {settings.contactEmail}
                </a>
              ) : null}
              {settings.address ? (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {settings.address}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Shop</p>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li><Link href="/shop" className="hover:text-volt">All products</Link></li>
              {categories.slice(0, 6).map((category) => (
                <li key={category.slug}>
                  <Link href={`/shop/${category.slug}`} className="hover:text-volt">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Help</p>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li><Link href="/track-order" className="hover:text-volt">Track your order</Link></li>
              <li><Link href="/account" className="hover:text-volt">My account</Link></li>
              <li><Link href="/cart" className="hover:text-volt">Your cart</Link></li>
              <li><Link href="/login" className="hover:text-volt">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Payment</p>
            <div className="flex flex-wrap gap-2">
              {["Cash on delivery", "bKash", "Nagad"].map((method) => (
                <span key={method} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70">
                  {method}
                </span>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-white/40">
              Mobile payments are verified manually by our team. Keep your transaction ID safe.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Sporsify. All rights reserved.</p>
          <p>Made for the love of the game.</p>
        </div>
      </div>
    </footer>
  );
}
