import { config } from "dotenv";
import { ObjectId } from "mongodb";

config({ path: ".env.local" });
config();

export async function setupDb() {
  const { getDb, getMongoClient, getDatabaseName, isDbConfigured } =
    await import("../../lib/db/client");
  if (!isDbConfigured()) {
    throw new Error(
      "MongoDB is not configured. Add MONGODB_URI to .env.local first.",
    );
  }
  const db = await getDb();
  const client = getMongoClient();
  return { db, client, databaseName: getDatabaseName() };
}

export async function ensureOwnerIndexes() {
  const { db } = await setupDb();
  await Promise.all([
    db.collection("system_config").createIndex({ userId: 1 }),
    db
      .collection("admin_profiles")
      .createIndex({ userId: 1 }, { unique: true }),
    db.collection("admin_profiles").createIndex({ status: 1 }),
    db.collection("admin_requests").createIndex({ status: 1, createdAt: -1 }),
    db.collection("admin_requests").createIndex({ adminUserId: 1, type: 1 }),
    db
      .collection("admin_reset_tokens")
      .createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("admin_reset_tokens").createIndex({ expiresAt: 1 }),
    db.collection("rate_limits").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    ),
    db.collection("audit_logs").createIndex({ createdAt: -1 }),
    db.collection("audit_logs").createIndex({ actorId: 1, createdAt: -1 }),
    db.collection("audit_logs").createIndex({ action: 1, createdAt: -1 }),
  ]);
}

export async function findUserByEmail(email: string) {
  const { db } = await setupDb();
  return db
    .collection("user")
    .findOne({ email: email.trim().toLowerCase() }) as Promise<
    Record<string, unknown> | null
  >;
}

export async function findUserById(userId: string) {
  const { db } = await setupDb();
  const filter = ObjectId.isValid(userId)
    ? { _id: new ObjectId(userId) }
    : { id: userId };
  return db.collection("user").findOne(filter as never) as Promise<
    Record<string, unknown> | null
  >;
}

export async function createCredentialUser(input: {
  email: string;
  password: string;
  name: string;
}) {
  const { client, databaseName } = await setupDb();
  const { betterAuth } = await import("better-auth");
  const { mongodbAdapter } = await import("@better-auth/mongo-adapter");
  const seedAuth = betterAuth({
    database: mongodbAdapter(client.db(databaseName), { client }),
    secret:
      process.env.BETTER_AUTH_SECRET ||
      "sporsify-development-secret-change-me-in-production",
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    user: {
      additionalFields: {
        phone: { type: "string", required: false, defaultValue: "" },
      },
    },
  });
  await seedAuth.api.signUpEmail({
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      name: input.name,
    },
  });
  const user = await findUserByEmail(input.email);
  if (!user) throw new Error("Failed to create owner account");
  return user;
}

export async function promoteOwner(userId: string, name?: string) {
  const { db } = await setupDb();
  const filter = ObjectId.isValid(userId)
    ? { _id: new ObjectId(userId) }
    : { id: userId };
  const existing = await findUserById(userId);
  const nextName =
    typeof existing?.name === "string" && existing.name.trim()
      ? existing.name
      : name || "Sporsify Owner";
  await db.collection("user").updateOne(filter as never, {
    $set: {
      role: "owner",
      emailVerified: true,
      name: nextName,
      updatedAt: new Date(),
    },
  });
}

export async function ensureCredentialPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const { hasPassword, setUserPassword } = await import(
    "../../lib/server/credentials"
  );
  if (await hasPassword(userId)) return false;
  await setUserPassword(userId, password);
  return true;
}

export function getOwnerEnv() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Sporsify Owner").trim();
  return { email, password, name };
}
