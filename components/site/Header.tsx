"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Home,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cartCount, useCartStore } from "@/lib/cart-store";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import SearchAutocomplete from "./SearchAutocomplete";

type HeaderProps = {
  categories: Category[];
};

export default function Header({ categories }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const count = mounted ? cartCount(items) : 0;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function goToSearch(query: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const suffix = params.toString();
    setSearchOpen(false);
    setOpen(false);
    router.push(`/shop${suffix ? `?${suffix}` : ""}`);
  }

  function goToProduct(slug: string) {
    setSearchOpen(false);
    setOpen(false);
    router.push(`/product/${slug}`);
  }

  const drawer = open ? (
    <div
      className="fixed inset-0 z-[100] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
    >
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className="absolute right-0 top-0 flex h-[100dvh] w-[min(88vw,22rem)] flex-col bg-paper shadow-2xl"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <span className="display text-2xl font-bold">
            Sporsify<span className="text-coral">.</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <SearchAutocomplete
            placeholder="Search all products…"
            showButton={false}
            onSubmit={goToSearch}
            onSelect={(product) => goToProduct(product.slug)}
          />

          <nav className="mt-4 space-y-1" aria-label="Mobile navigation">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-bold hover:bg-white"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink/5">
                <Home className="h-4 w-4" />
              </span>
              Home
            </Link>
            <Link
              href="/shop"
              className="block rounded-xl px-3 py-3 text-lg font-bold hover:bg-white"
            >
              Shop all
            </Link>
            <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
              Shop by sport
            </p>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop/${category.slug}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-semibold hover:bg-white"
              >
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="display grid h-full place-items-center text-[10px] font-bold text-ink/25">
                      {category.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                {category.name}
              </Link>
            ))}
            <div className="mt-2 border-t border-ink/10 pt-2">
              <Link
                href="/shop?sort=discount"
                className="block rounded-xl px-3 py-3 text-base font-semibold hover:bg-white"
              >
                Deals
              </Link>
              <Link
                href="/track-order"
                className="block rounded-xl px-3 py-3 text-base font-semibold hover:bg-white"
              >
                Track order
              </Link>
              <Link
                href={session ? "/account" : "/login"}
                className="block rounded-xl px-3 py-3 text-base font-semibold hover:bg-white"
              >
                {session ? "My account" : "Sign in"}
              </Link>
              {role === "admin" ? (
                <Link
                  href="/admin"
                  className="block rounded-xl px-3 py-3 text-base font-semibold text-coral hover:bg-white"
                >
                  Admin panel
                </Link>
              ) : null}
            </div>
          </nav>
        </div>

        <div className="safe-bottom border-t border-ink/10 px-4 pt-3">
          <Link
            href="/cart"
            className="flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white"
          >
            View cart
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" /> {count}
            </span>
          </Link>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/95 backdrop-blur-xl">
      <div className="container-x flex h-[68px] items-center justify-between gap-3 sm:h-[72px] sm:gap-4">
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
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-paper"
                >
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt=""
                      width={28}
                      height={28}
                      sizes="28px"
                      className="h-7 w-7 rounded-md object-cover"
                    />
                  ) : null}
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/shop?sort=discount"
            className="rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-ink/5"
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

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/5"
            aria-label="Search products"
            aria-expanded={searchOpen}
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
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-ink/10 bg-paper">
          <div className="container-x py-3">
            <SearchAutocomplete
              autoFocus
              placeholder="Search all products…"
              onSubmit={goToSearch}
              onSelect={(product) => goToProduct(product.slug)}
            />
          </div>
        </div>
      ) : null}

      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </header>
  );
}
