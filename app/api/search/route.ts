import { NextResponse } from "next/server";
import {
  searchProductSuggestions,
  type ProductSuggestion,
} from "@/lib/db/products";

export const dynamic = "force-dynamic";

type CacheEntry = { at: number; products: ProductSuggestion[] };

const cache = new Map<string, CacheEntry>();
const TTL = 60_000;
const MAX_ENTRIES = 80;

function readCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > TTL) {
    cache.delete(key);
    return null;
  }
  return entry.products;
}

function writeCache(key: string, products: ProductSuggestion[]) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), products });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);

  if (!query) {
    return NextResponse.json(
      { products: [] },
      { headers: { "Cache-Control": "public, max-age=30" } },
    );
  }

  const key = query.toLowerCase();
  const cached = readCache(key);
  if (cached) {
    return NextResponse.json(
      { products: cached },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
    );
  }

  try {
    const products = await searchProductSuggestions(query, 6);
    writeCache(key, products);
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
