import { createHash } from "node:crypto";
import { ObjectId, type Document, type Filter } from "mongodb";
import { getDb, isDbConfigured } from "./client";

const PROFILES = "admin_profiles";
const REQUESTS = "admin_requests";
const RESET_TOKENS = "admin_reset_tokens";
const SYSTEM_CONFIG = "system_config";

export type AdminProfileStatus = "active" | "suspended";

export type AdminProfile = {
  userId: string;
  permissions: string[];
  status: AdminProfileStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminRequestType =
  | "email_change"
  | "password_change"
  | "password_recovery";

export type AdminRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed";

export type AdminRequest = {
  id: string;
  adminUserId: string;
  adminEmail: string;
  type: AdminRequestType;
  proposedEmail: string;
  reason: string;
  status: AdminRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string;
};

export type AdminResetToken = {
  id: string;
  requestId: string;
  adminUserId: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdBy: string;
};

type AdminProfileDoc = {
  userId: string;
  permissions: string[];
  status: AdminProfileStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type AdminRequestDoc = {
  adminUserId: string;
  adminEmail: string;
  type: AdminRequestType;
  proposedEmail: string;
  reason: string;
  status: AdminRequestStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNote: string;
};

type AdminResetTokenDoc = {
  tokenHash: string;
  requestId: string;
  adminUserId: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdBy: string;
};

function iso(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function isoOrNull(value: unknown): string | null {
  if (!value) return null;
  return iso(value);
}

function mapProfile(doc: AdminProfileDoc): AdminProfile {
  return {
    userId: String(doc.userId),
    permissions: Array.isArray(doc.permissions) ? doc.permissions.map(String) : [],
    status: doc.status === "suspended" ? "suspended" : "active",
    createdBy: String(doc.createdBy ?? ""),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function mapRequest(doc: AdminRequestDoc & { _id: unknown }): AdminRequest {
  return {
    id: String(doc._id),
    adminUserId: String(doc.adminUserId ?? ""),
    adminEmail: String(doc.adminEmail ?? ""),
    type: doc.type,
    proposedEmail: String(doc.proposedEmail ?? ""),
    reason: String(doc.reason ?? ""),
    status: doc.status,
    createdAt: iso(doc.createdAt),
    resolvedAt: isoOrNull(doc.resolvedAt),
    resolvedBy: doc.resolvedBy ? String(doc.resolvedBy) : null,
    resolutionNote: String(doc.resolutionNote ?? ""),
  };
}

function mapToken(doc: AdminResetTokenDoc & { _id: unknown }): AdminResetToken {
  return {
    id: String(doc._id),
    requestId: String(doc.requestId ?? ""),
    adminUserId: String(doc.adminUserId ?? ""),
    createdAt: iso(doc.createdAt),
    expiresAt: iso(doc.expiresAt),
    usedAt: isoOrNull(doc.usedAt),
    revokedAt: isoOrNull(doc.revokedAt),
    createdBy: String(doc.createdBy ?? ""),
  };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getOwnerConfig() {
  if (!isDbConfigured()) return null;
  const db = await getDb();
  const doc = await db
    .collection(SYSTEM_CONFIG)
    .findOne({ _id: "owner" as never });
  if (!doc) return null;
  return {
    userId: String(doc.userId ?? ""),
    initializedAt: iso(doc.initializedAt),
  };
}

export async function setOwnerConfig(userId: string) {
  const db = await getDb();
  await db.collection(SYSTEM_CONFIG).updateOne(
    { _id: "owner" as never },
    {
      $set: { userId, updatedAt: new Date() },
      $setOnInsert: { initializedAt: new Date() },
    },
    { upsert: true },
  );
}

export async function getAdminProfile(userId: string): Promise<AdminProfile | null> {
  if (!isDbConfigured() || !userId) return null;
  const db = await getDb();
  const doc = await db
    .collection<AdminProfileDoc>(PROFILES)
    .findOne({ userId });
  return doc ? mapProfile(doc) : null;
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const docs = await db
    .collection<AdminProfileDoc>(PROFILES)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(mapProfile);
}

export async function createAdminProfile(input: {
  userId: string;
  permissions: string[];
  status?: AdminProfileStatus;
  createdBy: string;
}) {
  const db = await getDb();
  const now = new Date();
  const doc: AdminProfileDoc = {
    userId: input.userId,
    permissions: input.permissions,
    status: input.status ?? "active",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<AdminProfileDoc>(PROFILES).updateOne(
    { userId: input.userId },
    { $set: doc },
    { upsert: true },
  );
  return mapProfile(doc);
}

export async function updateAdminProfile(
  userId: string,
  input: {
    permissions?: string[];
    status?: AdminProfileStatus;
  },
) {
  const db = await getDb();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (input.permissions) update.permissions = input.permissions;
  if (input.status) update.status = input.status;
  const result = await db
    .collection<AdminProfileDoc>(PROFILES)
    .findOneAndUpdate(
      { userId },
      { $set: update },
      { returnDocument: "after" },
    );
  return result ? mapProfile(result) : null;
}

export async function deleteAdminProfile(userId: string) {
  const db = await getDb();
  await db.collection(PROFILES).deleteOne({ userId });
}

export async function findPendingAdminRequest(
  adminUserId: string,
  type: AdminRequestType,
): Promise<AdminRequest | null> {
  if (!isDbConfigured()) return null;
  const db = await getDb();
  const doc = await db
    .collection<AdminRequestDoc>(REQUESTS)
    .findOne(
      { adminUserId, type, status: "pending" },
      { sort: { createdAt: -1 } },
    );
  return doc ? mapRequest(doc as AdminRequestDoc & { _id: unknown }) : null;
}

export async function createAdminRequest(input: {
  adminUserId: string;
  adminEmail: string;
  type: AdminRequestType;
  proposedEmail?: string;
  reason?: string;
}) {
  const db = await getDb();
  const existing = await findPendingAdminRequest(input.adminUserId, input.type);
  if (existing) return existing;
  const now = new Date();
  const doc: AdminRequestDoc = {
    adminUserId: input.adminUserId,
    adminEmail: input.adminEmail,
    type: input.type,
    proposedEmail: input.proposedEmail?.trim().toLowerCase() ?? "",
    reason: input.reason?.trim() ?? "",
    status: "pending",
    createdAt: now,
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: "",
  };
  const result = await db.collection<AdminRequestDoc>(REQUESTS).insertOne(doc);
  return mapRequest({ ...doc, _id: result.insertedId });
}

export async function getAdminRequests(options: {
  status?: AdminRequestStatus | "all";
  adminUserId?: string;
  limit?: number;
} = {}): Promise<AdminRequest[]> {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const filter: Filter<Document> = {};
  if (options.status && options.status !== "all") filter.status = options.status;
  if (options.adminUserId) filter.adminUserId = options.adminUserId;
  const docs = await db
    .collection<AdminRequestDoc>(REQUESTS)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(200, Math.max(1, options.limit ?? 100)))
    .toArray();
  return docs.map((doc) => mapRequest(doc as AdminRequestDoc & { _id: unknown }));
}

export async function getAdminRequest(id: string): Promise<AdminRequest | null> {
  if (!isDbConfigured() || !ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db
    .collection<AdminRequestDoc>(REQUESTS)
    .findOne({ _id: new ObjectId(id) } as never);
  return doc ? mapRequest(doc as AdminRequestDoc & { _id: unknown }) : null;
}

export async function resolveAdminRequest(input: {
  id: string;
  status: AdminRequestStatus;
  resolvedBy: string;
  note?: string;
  expectedStatus?: AdminRequestStatus;
}) {
  if (!ObjectId.isValid(input.id)) throw new Error("Invalid request id");
  const db = await getDb();
  const resolvedAt = input.status === "pending" ? null : new Date();
  const resolvedBy = input.status === "pending" ? null : input.resolvedBy;
  const resolutionNote = input.status === "pending" ? "" : input.note?.trim() ?? "";
  const result = await db
    .collection<AdminRequestDoc>(REQUESTS)
    .findOneAndUpdate(
      {
        _id: new ObjectId(input.id),
        ...(input.expectedStatus ? { status: input.expectedStatus } : {}),
      } as never,
      {
        $set: {
          status: input.status,
          resolvedAt,
          resolvedBy,
          resolutionNote,
        },
      },
      { returnDocument: "after" },
    );
  return result
    ? mapRequest(result as AdminRequestDoc & { _id: unknown })
    : null;
}

export async function resolvePendingAdminRequests(
  adminUserId: string,
  input: {
    status: "rejected" | "completed";
    resolvedBy: string;
    note: string;
  },
) {
  const db = await getDb();
  await db.collection<AdminRequestDoc>(REQUESTS).updateMany(
    { adminUserId, status: "pending" },
    {
      $set: {
        status: input.status,
        resolvedAt: new Date(),
        resolvedBy: input.resolvedBy,
        resolutionNote: input.note,
      },
    },
  );
}

export async function createAdminResetToken(input: {
  requestId: string;
  adminUserId: string;
  token: string;
  createdBy: string;
  expiresInMs: number;
}) {
  const db = await getDb();
  await revokeAdminResetTokens(input.adminUserId);
  const now = new Date();
  const doc: AdminResetTokenDoc = {
    tokenHash: hashResetToken(input.token),
    requestId: input.requestId,
    adminUserId: input.adminUserId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + input.expiresInMs),
    usedAt: null,
    revokedAt: null,
    createdBy: input.createdBy,
  };
  const result = await db
    .collection<AdminResetTokenDoc>(RESET_TOKENS)
    .insertOne(doc);
  return mapToken({ ...doc, _id: result.insertedId });
}

export async function revokeAdminResetTokens(adminUserId: string) {
  const db = await getDb();
  await db.collection<AdminResetTokenDoc>(RESET_TOKENS).updateMany(
    { adminUserId, usedAt: null, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function findValidAdminResetToken(token: string) {
  if (!isDbConfigured() || !token) return null;
  const db = await getDb();
  const doc = await db
    .collection<AdminResetTokenDoc>(RESET_TOKENS)
    .findOne({
      tokenHash: hashResetToken(token),
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
  return doc ? mapToken(doc as AdminResetTokenDoc & { _id: unknown }) : null;
}

export async function consumeAdminResetToken(token: string) {
  if (!isDbConfigured() || !token) return null;
  const db = await getDb();
  const doc = await db
    .collection<AdminResetTokenDoc>(RESET_TOKENS)
    .findOneAndUpdate(
      {
        tokenHash: hashResetToken(token),
        usedAt: null,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
      { returnDocument: "after" },
    );
  return doc ? mapToken(doc as AdminResetTokenDoc & { _id: unknown }) : null;
}

export function parseUserId(value: string): ObjectId | null {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

export type AuthUserSummary = {
  id: string;
  email: string;
  name: string;
  role: string;
  banned: boolean;
  createdAt: string;
};

function mapAuthUser(doc: Record<string, unknown>): AuthUserSummary {
  return {
    id: String(doc._id ?? doc.id ?? ""),
    email: String(doc.email ?? ""),
    name: String(doc.name ?? ""),
    role: String(doc.role ?? "user"),
    banned: Boolean(doc.banned),
    createdAt: iso(doc.createdAt),
  };
}

export async function getAuthUserById(
  userId: string,
): Promise<AuthUserSummary | null> {
  if (!isDbConfigured() || !userId) return null;
  const db = await getDb();
  const objectId = parseUserId(userId);
  const doc = await db.collection("user").findOne(
    objectId ? ({ _id: objectId } as never) : ({ id: userId } as never),
  );
  return doc ? mapAuthUser(doc as Record<string, unknown>) : null;
}

export async function getAuthUserByEmail(
  email: string,
): Promise<AuthUserSummary | null> {
  if (!isDbConfigured() || !email) return null;
  const db = await getDb();
  const doc = await db
    .collection("user")
    .findOne({ email: email.trim().toLowerCase() });
  return doc ? mapAuthUser(doc as Record<string, unknown>) : null;
}

export async function listAdminAuthUsers(): Promise<AuthUserSummary[]> {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const docs = await db
    .collection("user")
    .find({ role: { $in: ["owner", "admin"] } })
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map((doc) => mapAuthUser(doc as Record<string, unknown>));
}
