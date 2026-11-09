import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Flame,
  MoveRight,
  RotateCcw,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import AnimatedGrid from "@/components/site/AnimatedGrid";
import FeaturedProductCard from "@/components/site/FeaturedProductCard";
import JsonLd from "@/components/site/JsonLd";
import NewsletterForm from "@/components/site/NewsletterForm";
import ProductCard from "@/components/site/ProductCard";
import { getCategories } from "@/lib/db/categories";
import { getFeaturedProducts, getProducts } from "@/lib/db/products";
import { getSettings } from "@/lib/db/settings";
import { getSalePrice } from "@/lib/pricing";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { trustPoints } from "@/lib/site";
import type { Category } from "@/lib/types";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

const categoryAccents = [
  "from-[#d9f2a2] to-[#b9e46a]",
  "from-[#ffd9c9] to-[#ffb397]",
  "from-[#d7dfe8] to-[#b6c5d6]",
  "from-[#efe0b8] to-[#e2c98c]",
  "from-[#e3d6f0] to-[#c9b2e2]",
  "from-[#d4e9e1] to-[#a9d3c3]",
];

function CategoryTile({ category, index }: { category: Category; index: number }) {
  return (
    <Link
      href={`/shop/${category.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-ink/10 transition hover:-translate-y-1 hover:shadow-xl sm:p-4"
    >
      <div
        className={`relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br ${categoryAccents[index % categoryAccents.length]}`}
      >
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(max-width: 640px) 50vw, 16vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="display text-4xl font-bold text-ink/25">
              {category.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-ink backdrop-blur">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-bold">{category.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink/45">{category.description}</p>
        </div>
        <MoveRight className="h-4 w-4 shrink-0 text-ink/30 transition group-hover:translate-x-1 group-hover:text-ink" />
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [categories, featured, latest, deals, settings] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getProducts({ pageSize: 8, sort: "newest" }),
    getProducts({ pageSize: 3, sort: "discount" }),
    getSettings(),
  ]);

  const flagship = featured[0] ?? latest.items[0];
  const heroImage = flagship?.images[0];
  const heroPrice = flagship
    ? getSalePrice(flagship.price, flagship.discountPercent)
    : 0;
  const deal = deals.items[0];

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd()]} />

      <section className="container-x pt-6 sm:pt-10">
        <div className="grid overflow-hidden rounded-3xl border border-ink/10 bg-white lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10 flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <h1 className="display max-w-xl text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
              Gear up.
              <br />
              <span className="relative inline-block">
                Play harder.
                <span className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-volt" />
              </span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-ink/60">
              Cricket bats, football boots, running shoes and gym essentials — picked for
              performance, priced for Bangladesh. Order without an account, pay on delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-dark">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop?sort=discount" className="btn-outline">
                <Flame className="h-4 w-4" /> See today&apos;s deals
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-ink/10 pt-6">
              <div>
                <p className="display text-2xl font-bold">500+</p>
                <p className="text-xs text-ink/45">Athletes geared up</p>
              </div>
              <div>
                <p className="display text-2xl font-bold">64</p>
                <p className="text-xs text-ink/45">Districts delivered</p>
              </div>
              <div>
                <p className="display text-2xl font-bold">7-day</p>
                <p className="text-xs text-ink/45">Easy returns</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[380px] overflow-hidden bg-ink p-6 sm:min-h-[480px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(201,242,39,0.28),transparent_45%)]" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-volt/10 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-white">
                <span className="display text-lg font-bold">SPORSIFY<span className="text-volt">.</span></span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                  New season
                </span>
              </div>

              {heroImage && flagship ? (
                <Link
                  href={`/product/${flagship.slug}`}
                  aria-label={`View ${flagship.name}`}
                  className="group/hero relative mx-auto my-6 block h-64 w-64 sm:h-80 sm:w-80"
                >
                  <div className="absolute inset-6 rotate-6 rounded-full bg-volt transition duration-500 group-hover/hero:rotate-12" />
                  <Image
                    src={heroImage.url}
                    alt={heroImage.alt || flagship.name}
                    fill
                    priority
                    sizes="(max-width: 640px) 256px, 320px"
                    className="relative z-10 rotate-[-4deg] rounded-2xl object-cover shadow-2xl transition duration-700 group-hover/hero:rotate-0 group-hover/hero:scale-105"
                  />
                  <span className="absolute bottom-1 right-1 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-ink opacity-0 shadow-lg transition duration-300 group-hover/hero:opacity-100">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              ) : (
                <div className="relative mx-auto my-6 grid h-64 w-64 place-items-center rounded-full bg-volt sm:h-80 sm:w-80">
                  <span className="display -rotate-6 text-center text-5xl font-bold text-ink">
                    PLAY
                    <br />
                    HARDER
                  </span>
                </div>
              )}

              {flagship ? (
                <Link
                  href={`/product/${flagship.slug}`}
                  className="relative rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">
                        Featured gear
                      </p>
                      <p className="mt-1 font-bold">{flagship.name}</p>
                      <p className="mt-1 text-sm text-white/60">{formatBDT(heroPrice)}</p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-volt text-ink">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="relative rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">
                    Store setup
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    Add products from the admin panel to feature them here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-x mt-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Shop by sport</p>
            <h2 className="display mt-2 text-3xl font-bold sm:text-4xl">Find your game.</h2>
          </div>
          <Link href="/shop" className="flex shrink-0 items-center gap-2 text-xs font-bold hover:text-coral sm:text-sm">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, index) => (
            <CategoryTile key={category.slug} category={category} index={index} />
          ))}
        </div>
      </section>

      <section className="container-x mt-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Handpicked for performance</p>
            <h2 className="display mt-2 text-3xl font-bold sm:text-4xl">Featured gear.</h2>
          </div>
          <Link href="/shop" className="flex items-center gap-2 text-sm font-bold hover:text-coral">
            Shop all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featured.length ? (
          <AnimatedGrid className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <FeaturedProductCard key={product.id} product={product} />
            ))}
          </AnimatedGrid>
        ) : (
          <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-ink/30" />
            <h3 className="display mt-3 text-2xl font-bold">Your shelves are empty</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/55">
              Add products from the admin panel to start showing your gear here.
            </p>
            <Link href="/admin" className="btn-dark mt-6">Open admin panel</Link>
          </div>
        )}
      </section>

      {deal ? (
        <section className="container-x mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-12">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-coral/30 blur-3xl" />
            <div className="absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-volt/15 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.55fr]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-coral px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]">
                  <Flame className="h-3 w-3" /> Deal of the week
                </p>
                <h2 className="display mt-5 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
                  Up to {deal.discountPercent}% off gear that&apos;s built to perform.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/60">
                  Limited stock, real discounts. Apply a coupon at checkout for even more off.
                </p>
                <Link href={`/product/${deal.slug}`} className="btn-volt mt-7">
                  Grab the deal <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <Link
                href={`/product/${deal.slug}`}
                className="group relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-white/10"
              >
                {deal.images[0] ? (
                  <Image
                    src={deal.images[0].url}
                    alt={deal.images[0].alt || deal.name}
                    fill
                    sizes="320px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <span className="display text-6xl font-bold text-white/20">
                      {deal.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-volt px-2.5 py-1 text-[10px] font-extrabold text-ink">
                  -{deal.discountPercent}%
                </span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-x mt-20">
        <div className="mb-7">
          <p className="eyebrow">Fresh off the shelf</p>
          <h2 className="display mt-2 text-3xl font-bold sm:text-4xl">Latest drops.</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {latest.items.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-x mt-20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point, index) => {
            const icons = [
              <Wallet key="wallet" className="h-5 w-5" />,
              <Truck key="truck" className="h-5 w-5" />,
              <BadgeCheck key="badge" className="h-5 w-5" />,
              <RotateCcw key="return" className="h-5 w-5" />,
            ];
            return (
              <div key={point.title} className="rounded-2xl border border-ink/10 bg-white p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-volt text-ink">
                  {icons[index % icons.length]}
                </span>
                <h3 className="mt-4 font-bold">{point.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink/50">{point.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-x mt-20">
        <div className="rounded-3xl bg-ink p-8 text-white sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow !text-volt">Join the Sporsify club</p>
              <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
                First access to drops, deals and restocks.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                No spam. Just the good stuff — new gear alerts and members-only coupons.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <NewsletterForm />
              <p className="mt-3 text-xs text-white/35">By joining you agree to our friendly emails.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
