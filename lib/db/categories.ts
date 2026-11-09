import { cache } from "react";
import { ObjectId, type Document } from "mongodb";
import type { Category } from "../types";
import type { CategoryInput } from "../validators";
import { getDb, isDbConfigured } from "./client";
import { mapCategory } from "./mappers";

const COLLECTION = "categories";
const PRODUCTS = "products";

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`;

export const fallbackCategories: Category[] = [
  {
    id: "cricket",
    name: "Cricket",
    slug: "cricket",
    description: "Bats, balls, pads and match-day gear.",
    image: image("photo-1531415074968-036ba1b575da"),
    sortOrder: 1,
    active: true,
  },
  {
    id: "football",
    name: "Football",
    slug: "football",
    description: "Boots, balls, kits and training essentials.",
    image: image("photo-1579952363873-27f3bade9f55"),
    sortOrder: 2,
    active: true,
  },
  {
    id: "basketball",
    name: "Basketball",
    slug: "basketball",
    description: "Indoor and outdoor basketball gear.",
    image: image("photo-1546519638-68e109498ffc"),
    sortOrder: 3,
    active: true,
  },
  {
    id: "running",
    name: "Running",
    slug: "running",
    description: "Shoes and apparel built for the long run.",
    image: image("photo-1552674605-db6ffd4facb5"),
    sortOrder: 4,
    active: true,
  },
  {
    id: "fitness",
    name: "Gym & Fitness",
    slug: "fitness",
    description: "Strength, recovery and home workout gear.",
    image: image("photo-1534438327276-14e5300c3a48"),
    sortOrder: 5,
    active: true,
  },
  {
    id: "badminton",
    name: "Badminton",
    slug: "badminton",
    description: "Rackets, shuttles and court accessories.",
    image: image("photo-1626224583764-f87db24ac4ea"),
    sortOrder: 6,
    active: true,
  },
];

function withDefaultImage(category: Category): Category {
  if (category.image) return category;
  const fallback = fallbackCategories.find((item) => item.slug === category.slug);
  return fallback?.image ? { ...category, image: fallback.image } : category;
}

function normalizeCategory(input: CategoryInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    image: input.image,
    sortOrder: Math.round(input.sortOrder),
    active: input.active,
  };
}

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isDbConfigured()) return fallbackCategories;
  try {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTION)
      .find({ active: { $ne: false } })
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    if (!docs.length) return fallbackCategories;
    return docs.map(mapCategory).map(withDefaultImage);
  } catch {
    return fallbackCategories;
  }
});

export const getAllCategories = cache(async (): Promise<Category[]> => {
  if (!isDbConfigured()) return fallbackCategories;
  try {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTION)
      .find({})
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    if (!docs.length) return fallbackCategories;
    return docs.map(mapCategory).map(withDefaultImage);
  } catch {
    return fallbackCategories;
  }
});

export const getCategoryBySlug = cache(async (slug: string) => {
  if (!isDbConfigured()) {
    return fallbackCategories.find((category) => category.slug === slug) ?? null;
  }
  try {
    const db = await getDb();
    const doc = await db.collection(COLLECTION).findOne({ slug });
    if (!doc) return fallbackCategories.find((category) => category.slug === slug) ?? null;
    return withDefaultImage(mapCategory(doc));
  } catch {
    return fallbackCategories.find((category) => category.slug === slug) ?? null;
  }
});

export async function getCategoryById(id: string) {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  return doc ? withDefaultImage(mapCategory(doc)) : null;
}

export async function createCategory(input: CategoryInput) {
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const normalized = normalizeCategory(input);
  const duplicate = await collection.findOne({ slug: normalized.slug });
  if (duplicate) throw new Error("A category with this slug already exists");
  const now = new Date();
  const doc = { ...normalized, createdAt: now, updatedAt: now };
  const result = await collection.insertOne(doc);
  return mapCategory({ ...doc, _id: result.insertedId });
}

export async function updateCategory(id: string, input: CategoryInput) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid category id");
  const db = await getDb();
  const collection = db.collection(COLLECTION);
  const normalized = normalizeCategory(input);
  const duplicate = await collection.findOne({
    slug: normalized.slug,
    _id: { $ne: new ObjectId(id) },
  });
  if (duplicate) throw new Error("A category with this slug already exists");
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...normalized, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) throw new Error("Category not found");
  return mapCategory(result);
}

export async function countProductsByCategory(slug: string) {
  if (!isDbConfigured()) return 0;
  const db = await getDb();
  return db.collection(PRODUCTS).countDocuments({ category: slug });
}

export async function deleteCategory(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid category id");
  const category = await getCategoryById(id);
  if (!category) throw new Error("Category not found");
  const used = await countProductsByCategory(category.slug);
  if (used > 0) {
    throw new Error(
      `Move or delete the ${used} product${used === 1 ? "" : "s"} in this category first`,
    );
  }
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return category;
}

export async function getCategoryProductCounts() {
  if (!isDbConfigured()) {
    return {} as Record<string, number>;
  }
  const db = await getDb();
  const rows = await db
    .collection(PRODUCTS)
    .aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])
    .toArray();
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[String(row._id)] = Number(row.count ?? 0);
    return acc;
  }, {});
}

export async function getCategoryDocBySlug(slug: string) {
  if (!isDbConfigured()) return null;
  const db = await getDb();
  return db.collection(COLLECTION).findOne({ slug }) as Promise<
    (Document & { _id: ObjectId }) | null
  >;
}
