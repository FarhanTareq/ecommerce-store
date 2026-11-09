"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, SearchX } from "lucide-react";
import type { ProductSuggestion } from "@/lib/db/products";
import { getSalePrice } from "@/lib/pricing";
import { cn, formatBDT } from "@/lib/utils";

type SearchAutocompleteProps = {
  initialQuery?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  showButton?: boolean;
  buttonLabel?: string;
  onQueryChange?: (query: string) => void;
  onSubmit?: (query: string) => void;
  onSelect?: (product: ProductSuggestion) => void;
};

export default function SearchAutocomplete({
  initialQuery = "",
  placeholder = "Search cricket bats, running shoes, gym gloves…",
  autoFocus = false,
  className,
  inputClassName,
  showButton = true,
  buttonLabel = "Search",
  onQueryChange,
  onSubmit,
  onSelect,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const clientCache = useRef(new Map<string, ProductSuggestion[]>());
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ProductSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const term = query.trim();
    if (!term) return;

    const cacheKey = term.toLowerCase();
    const cached = clientCache.current.get(cacheKey);
    if (cached) {
      const cachedTimer = window.setTimeout(() => {
        setResults(cached);
        setOpen(true);
        setActive(-1);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(cachedTimer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { products?: ProductSuggestion[] };
        const next = data.products ?? [];
        clientCache.current.set(cacheKey, next);
        setResults(next);
        setOpen(true);
        setActive(-1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function change(next: string) {
    setQuery(next);
    onQueryChange?.(next);
  }

  function submit() {
    const term = query.trim();
    if (onSubmit) {
      onSubmit(term);
    } else {
      const params = new URLSearchParams();
      if (term) params.set("q", term);
      const suffix = params.toString();
      router.push(`/shop${suffix ? `?${suffix}` : ""}`);
    }
    setOpen(false);
    inputRef.current?.blur();
  }

  function choose(product: ProductSuggestion) {
    setOpen(false);
    if (onSelect) {
      onSelect(product);
    } else {
      router.push(`/product/${product.slug}`);
    }
    inputRef.current?.blur();
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && active >= 0 && results[active]) {
        choose(results[active]);
      } else {
        submit();
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const showPanel = open && query.trim().length > 0;

  return (
    <div className={cn("relative", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex gap-2"
        role="search"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => change(event.target.value)}
            onFocus={() => {
              if (query.trim()) setOpen(true);
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={keyDown}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-xl border border-ink/15 bg-white py-3 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-ink focus:ring-2 focus:ring-volt/60",
              inputClassName,
            )}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 ? `${listId}-${results[active]?.id}` : undefined
            }
            autoComplete="off"
          />
          {loading && query.trim() ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink/35" />
          ) : null}
        </div>
        {showButton ? (
          <button type="submit" className="btn-dark shrink-0 px-4">
            {buttonLabel}
          </button>
        ) : null}
      </form>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl"
        >
          {results.length ? (
            <ul className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain">
              {results.map((product, index) => {
                const sale = getSalePrice(product.price, product.discountPercent);
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(product)}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
                        active === index ? "bg-paper" : "hover:bg-paper",
                      )}
                      role="option"
                      aria-selected={active === index}
                      id={`${listId}-${product.id}`}
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#e8e6df] to-[#d5d2c8]">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="display grid h-full place-items-center text-xs font-bold text-ink/25">
                            {product.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {product.name}
                        </span>
                        <span className="block truncate text-[11px] capitalize text-ink/45">
                          {product.brand} · {product.category}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-extrabold">
                        {formatBDT(sale)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex items-center gap-3 px-4 py-5 text-sm text-ink/50">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </>
              ) : (
                <>
                  <SearchX className="h-4 w-4" /> No products match “{query.trim()}”.
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={submit}
            className="flex w-full items-center justify-between gap-2 border-t border-ink/10 bg-paper px-4 py-3 text-xs font-bold text-ink/60 transition hover:text-ink"
          >
            View all results for “{query.trim()}”
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
