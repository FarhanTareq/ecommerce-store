import { getSalePrice } from "./pricing";
import type { Category, Product, Settings } from "./types";
import { absoluteUrl } from "./utils";
import { siteConfig } from "./site";

export function organizationJsonLd(settings: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "SportingGoodsStore",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    image: absoluteUrl("/opengraph-image"),
    priceRange: "৳৳",
    currenciesAccepted: "BDT",
    paymentAccepted: "Cash, bKash, Nagad",
    telephone: settings.contactPhone || undefined,
    email: settings.contactEmail || undefined,
    address: settings.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.address,
          addressLocality: "Dhaka",
          addressCountry: "BD",
        }
      : undefined,
    sameAs: [settings.facebookUrl, settings.instagramUrl].filter(Boolean),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(product: Product, category?: Category) {
  const sale = getSalePrice(product.price, product.discountPercent);
  const inStock = product.sizes.some((size) => size.stock > 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription || product.description,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || siteConfig.name,
    },
    image: product.images.map((image) => image.url),
    category: category?.name ?? product.category,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "BDT",
      price: sale,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: siteConfig.name,
      },
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(products: Product[], name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/product/${product.slug}`),
      name: product.name,
    })),
  };
}
