import type { Settings } from "../types";
import type { SettingsInput } from "../validators";
import { getDb, isDbConfigured } from "./client";
import { defaultSettings, mapSettings } from "./mappers";

const COLLECTION = "settings";
const DOC_ID = "store";

export async function getSettings(): Promise<Settings> {
  if (!isDbConfigured()) return defaultSettings;
  try {
    const db = await getDb();
    const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID as never });
    return mapSettings(doc);
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(input: SettingsInput) {
  const db = await getDb();
  const next = {
    ...input,
    updatedAt: new Date(),
  };
  await db
    .collection(COLLECTION)
    .updateOne(
      { _id: DOC_ID as never },
      { $set: next, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  return mapSettings(next);
}
