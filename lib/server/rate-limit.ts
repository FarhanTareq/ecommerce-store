import { getDb, isDbConfigured } from "../db/client";

const RATE_LIMITS = "rate_limits";

type RateLimitDoc = {
  _id: string;
  count: number;
  expiresAt: Date;
};

let indexPromise: Promise<unknown> | null = null;

async function ensureIndex() {
  if (!isDbConfigured()) {
    throw new Error("Security rate limiting is unavailable because MongoDB is not configured.");
  }
  if (!indexPromise) {
    indexPromise = getDb().then((db) =>
      db
        .collection(RATE_LIMITS)
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    );
  }
  try {
    await indexPromise;
  } catch (error) {
    indexPromise = null;
    console.error("Could not initialize rate-limit storage", error);
    throw error;
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
};

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const limit = Math.max(1, input.limit);
  const windowMs = Math.max(1000, input.windowMs);
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStart + windowMs;
  const retryAfterMs = Math.max(0, resetAt - now);

  if (!isDbConfigured()) {
    throw new Error("Security rate limiting is unavailable because MongoDB is not configured.");
  }

  await ensureIndex();
  const db = await getDb();
  const id = `${input.key}:${windowStart}`;
  const doc = await db
    .collection<RateLimitDoc>(RATE_LIMITS)
    .findOneAndUpdate(
      { _id: id },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          expiresAt: new Date(resetAt + windowMs),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  const count = doc?.count ?? 1;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterMs,
    limit,
  };
}

export const rateLimits = {
  login: { limit: 8, windowMs: 10 * 60 * 1000 },
  passwordReset: { limit: 5, windowMs: 15 * 60 * 1000 },
  adminRequest: { limit: 5, windowMs: 60 * 60 * 1000 },
  ownerAction: { limit: 30, windowMs: 10 * 60 * 1000 },
} as const;
