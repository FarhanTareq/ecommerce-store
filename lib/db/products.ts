import { cache } from "react";
import { ObjectId, type Document, type Filter, type Sort } from "mongodb";
import type { Product, ProductStatus } from "../types";
import { escapeRegex } from "../utils";
import type { ProductInput } from "../validators";
import { getDb, isDbConfigured } from "./client";
import { mapProduct } from "./mappers";

const COLLECTION = "products";

type ProductListOptions = {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
  featured?: boolean;
};

function productSort(sort?: string): Sort {
  switch (sort) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "discount":
      return { discountPercent: -1 };
    case "name":
      return { name: 1 };
    default:
      return { createdAt: -1 };
  }
}

function statusFilter(includeInactive?: boolean): Filter<Document> {
  return includeInactive ? {} : { status: "active" };
}

function normalize(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    category: input.category,
    description: input.description,
    brand: input.brand || "Sporsify",
    price: Math.round(input.price),
    discountPercent: Math.round(input.discountPercent),
    images: input.images.map((image) => ({
      key: image.key,
      url: image.url,
      alt: image.alt || input.name,
    })),
    sizes: input.sizes.map((size) => ({
      size: size.size,
      stock: Math.round(size.stock),
    })),
    tags: input.tags,
    featured: input.featured,
    status: input.status,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };
}

export async function getProducts(options: ProductListOptions = {}) {
  const empty = { items: [] as Product[], total: 0, page: 1, pages: 1 };
  if (!isDbConfigured()) return empty;

  const db = await getDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, options.pageSize ?? 12));
  const filter: Filter<Document> = { ...statusFilter(options.includeInactive) };

  if (options.category && options.category !== "all") {
    filter.category = options.category;
  }
  if (options.featured) filter.featured = true;
  if (options.search?.trim()) {
    const pattern = new RegExp(escapeRegex(options.search.trim()), "i");
    filter.$or = [{ name: pattern }, { description: pattern }, { tags: pattern }];
  }

  const collection = db.collection(COLLECTION);
  const [items, total] = await Promise.all([
    collection
      .find(filter)
      .sort(productSort(options.sort))
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    items: items.map(mapProduct),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getProductBySlug = cache(
  async (slug: string, includeInactive = false) => {
    if (!isDbConfigured()) return null;
    const db = await getDb();
    const filter: Filter<Document> = { slug };
    if (!includeInactive) filter.status = "active";
    const doc = await db.collection(COLLECTION).findOne(filter);
    return doc ? mapProduct(doc) : null;
  },
);

export async function getProductById(id: string, includeInactive = true) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  const product = mapProduct(doc);
  if (!includeInactive && product.status !== "active") return null;
  return product;
}

export async function getFeaturedProducts(limit = 8) {
  const result = await getProducts({ featured: true, pageSize: limit });
  if (result.items.length >= limit) return result.items;
  const fallback = await getProducts({ pageSize: limit });
  const seen = new Set(result.items.map((item) => item.id));
  return [...result.items, ...fallback.items.filter((item) => !seen.has(item.id))].slice(
    0,
    limit,
  );
}

export async function getRelatedProducts(category: string, excludeId: string, limit = 4) {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const docs = await db
    .collection(COLLECTION)
    .find({ category, status: "active", _id: { $ne: new ObjectId(excludeId) } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(mapProduct);
}

export async function getProductSlugs() {
  if (!isDbConfigured()) return [] as { slug: string; updatedAt: string }[];
  const db = await getDb();
  const docs = await db
    .collection(COLLECTION)
    .find({ status: "active" })
    .project({ slug: 1, updatedAt: 1 })
    .toArray();
  return docs.map((doc) => ({
    slug: String(doc.slug),
    updatedAt: new Date(doc.updatedAt ?? Date.now()).toISOString(),
  }));
}

export type ProductSuggestion = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  discountPercent: number;
  image: string;
};

export async function searchProductSuggestions(
  query: string,
  limit = 6,
): Promise<ProductSuggestion[]> {
  const term = query.trim();
  if (!isDbConfigured() || term.length < 1) return [];
  const db = await getDb();
  const pattern = new RegExp(escapeRegex(term), "i");
  const docs = await db
    .collection(COLLECTION)
    .find({
      status: "active",
      $or: [
        { name: pattern },
        { brand: pattern },
        { category: pattern },
        { tags: pattern },
      ],
    })
    .sort({ featured: -1, createdAt: -1 })
    .limit(Math.min(10, Math.max(1, limit)))
    .project({
      name: 1,
      slug: 1,
      brand: 1,
      category: 1,
      price: 1,
      discountPercent: 1,
      images: { $slice: 1 },
    })
    .toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    brand: String(doc.brand ?? "Sporsify"),
    category: String(doc.category ?? ""),
    price: Number(doc.price ?? 0),
    discountPercent: Number(doc.discountPercent ?? 0),
    image: String(doc.images?.[0]?.url ?? ""),
  }));
}

export async function getAllProductsForAdmin(options: ProductListOptions = {}) {
  return getProducts({ ...options, includeInactive: true });
}

export async function createProduct(input: ProductInput) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const duplicate = await collection.findOne({ slug: input.slug });
  if (duplicate) throw new Error("A product with this slug already exists");
  const now = new Date();
  const doc = {
    ...normalize(input),
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc);
  return mapProduct({ ...doc, _id: result.insertedId });
}

export async function updateProduct(id: string, input: ProductInput) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid product id");
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const duplicate = await collection.findOne({
    slug: input.slug,
    _id: { $ne: new ObjectId(id) },
  });
  if (duplicate) throw new Error("A product with this slug already exists");
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...normalize(input), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) throw new Error("Product not found");
  return mapProduct(result);
}

export async function deleteProduct(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid product id");
  const db = await getDb();
  const result = await db
    .collection(COLLECTION)
    .findOneAndDelete({ _id: new ObjectId(id) });
  return result ? mapProduct(result) : null;
}

export async function getProductCounts() {
  if (!isDbConfigured()) {
    return { total: 0, active: 0, draft: 0, lowStock: 0 };
  }
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const [total, active, draft, lowStock] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ status: "active" }),
    collection.countDocuments({ status: "draft" }),
    collection.countDocuments({
      status: "active",
      sizes: { $elemMatch: { stock: { $lte: 3 } } },
    }),
  ]);
  return { total, active, draft, lowStock };
}

export async function getProductStatusCounts() {
  if (!isDbConfigured()) return {} as Record<ProductStatus, number>;
  const db = await getDb();
  const rows = await db
    .collection(COLLECTION)
    .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
    .toArray();
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[String(row._id)] = row.count;
    return acc;
  }, {});
}
