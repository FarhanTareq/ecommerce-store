import { getDb, isDbConfigured } from "./client";

const COLLECTION = "subscribers";

export async function subscribeEmail(email: string) {
  if (!isDbConfigured()) {
    throw new Error("Newsletter signup is not available yet");
  }
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { email },
    {
      $set: { email, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date(), source: "storefront" },
    },
    { upsert: true },
  );
}
