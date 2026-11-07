"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  ChevronDown,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useCartStore, cartCount } from "@/lib/cart-store";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";

type HeaderProps = {
  categories: Category[];
  announcement: string;
};

export default function Header({ categories, announcement }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const count = mounted ? cartCount(items) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
      {announcement ? (
        <div className="overflow-hidden bg-ink py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
          <div className="flex w-max animate-ticker gap-12 whitespace-nowrap pl-4">
            <span>{announcement}</span>
            <span>{announcement}</span>
            <span>{announcement}</span>
            <span>{announcement}</span>
          </div>
        </div>
      ) : null}

      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2" aria-label="Sporsify home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-volt">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M6 20 12 4h4.2l-2.4 6H19l-1.2 3.2h-6.3L10 17h7.7L17 20H6Z" />
            </svg>
          </span>
          <span className="display text-xl font-bold tracking-tight">
            Sporsify<span className="text-coral">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <Link
            href="/shop"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-ink/5",
              pathname === "/shop" && "bg-ink text-white hover:bg-ink",
            )}
          >
            Shop all
          </Link>
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-ink/5">
              Sports <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-2 rounded-2xl border border-ink/10 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop/${category.slug}`}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-paper"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/shop?sort=discount"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-ink/5",
              pathname === "/shop" && "hover:bg-ink/5",
            )}
          >
            Deals
          </Link>
          <Link
            href="/track-order"
            className="rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-ink/5"
          >
            Track order
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/5"
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </button>
          {role === "admin" ? (
            <Link
              href="/admin"
              className="hidden rounded-full border border-ink/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-ink hover:text-white sm:block"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href={session ? "/account" : "/login"}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/5"
            aria-label={session ? "My account" : "Sign in"}
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/5"
            aria-label={`Cart with ${count} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-ink/10 bg-paper">
          <form action="/shop" className="container-x flex gap-2 py-3">
            <input
              autoFocus
              name="q"
              placeholder="Search cricket bats, running shoes, gym gloves…"
              className="input"
            />
            <button className="btn-dark">Search</button>
          </form>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto bg-paper p-5 shadow-2xl"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="display text-2xl font-bold">
                Sporsify<span className="text-coral">.</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action="/shop" className="mb-6 flex gap-2">
              <input name="q" placeholder="Search gear" className="input" />
              <button className="btn-dark px-4">Go</button>
            </form>
            <div className="space-y-1">
              <Link href="/shop" className="block rounded-xl px-3 py-3 text-lg font-bold hover:bg-white">
                Shop all
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop/${category.slug}`}
                  className="block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-white"
                >
                  {category.name}
                </Link>
              ))}
              <Link href="/shop?sort=discount" className="block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-white">
                Deals
              </Link>
              <Link href="/track-order" className="block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-white">
                Track order
              </Link>
              <Link href={session ? "/account" : "/login"} className="block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-white">
                {session ? "My account" : "Sign in"}
              </Link>
              {role === "admin" ? (
                <Link href="/admin" className="block rounded-xl px-3 py-3 text-lg font-semibold text-coral hover:bg-white">
                  Admin panel
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
