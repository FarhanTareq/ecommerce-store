"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  LayoutGrid,
  ReceiptText,
  Settings,
  Tag,
  LogOut,
  Store,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
  { href: "/admin/account", label: "Admin account", icon: UserCog },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex w-full flex-col border-b border-ink/10 bg-ink text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between p-5">
        <Link href="/admin" className="display text-2xl font-bold">
          Sporsify<span className="text-volt">.</span>
          <span className="ml-2 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
            Admin
          </span>
        </Link>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white",
                active && "bg-volt text-ink hover:bg-volt hover:text-ink",
              )}
            >
              <link.icon className="h-4 w-4" /> {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-white/10 p-3 lg:block">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
          Signed in as
        </p>
        <p className="truncate px-3 pb-3 text-sm font-semibold">{adminName}</p>
        <Link
          href="/"
          className="mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <Store className="h-4 w-4" /> View storefront
        </Link>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            toast.success("Signed out");
            router.push("/admin/login");
            router.refresh();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="flex gap-2 border-t border-white/10 p-3 lg:hidden">
        <Link href="/" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold">
          <Store className="h-3.5 w-3.5" /> Store
        </Link>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/admin/login");
            router.refresh();
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </aside>
  );
}
