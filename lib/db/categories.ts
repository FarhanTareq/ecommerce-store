import type { Category } from "../types";
import { getDb, isDbConfigured } from "./client";
import { mapCategory } from "./mappers";

const COLLECTION = "categories";

export const fallbackCategories: Category[] = [
  {
    id: "cricket",
    name: "Cricket",
    slug: "cricket",
    description: "Bats, balls, pads and match-day gear.",
    image: "",
    sortOrder: 1,
    active: true,
  },
  {
    id: "football",
    name: "Football",
    slug: "football",
    description: "Boots, balls, kits and training essentials.",
    image: "",
    sortOrder: 2,
    active: true,
  },
  {
    id: "basketball",
    name: "Basketball",
    slug: "basketball",
    description: "Indoor and outdoor basketball gear.",
    image: "",
    sortOrder: 3,
    active: true,
  },
  {
    id: "running",
    name: "Running",
    slug: "running",
    description: "Shoes and apparel built for the long run.",
    image: "",
    sortOrder: 4,
    active: true,
  },
  {
    id: "fitness",
    name: "Gym & Fitness",
    slug: "fitness",
    description: "Strength, recovery and home workout gear.",
    image: "",
    sortOrder: 5,
    active: true,
  },
  {
    id: "badminton",
    name: "Badminton",
    slug: "badminton",
    description: "Rackets, shuttles and court accessories.",
    image: "",
    sortOrder: 6,
    active: true,
  },
];

export async function getCategories(): Promise<Category[]> {
  if (!isDbConfigured()) return fallbackCategories;
  try {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTION)
      .find({ active: { $ne: false } })
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    if (!docs.length) return fallbackCategories;
    return docs.map(mapCategory);
  } catch {
    return fallbackCategories;
  }
}

export async function getCategoryBySlug(slug: string) {
  if (!isDbConfigured()) {
    return fallbackCategories.find((category) => category.slug === slug) ?? null;
  }
  try {
    const db = await getDb();
    const doc = await db.collection(COLLECTION).findOne({ slug });
    if (!doc) return fallbackCategories.find((category) => category.slug === slug) ?? null;
    return mapCategory(doc);
  } catch {
    return fallbackCategories.find((category) => category.slug === slug) ?? null;
  }
}
