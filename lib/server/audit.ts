import { getDb, isDbConfigured } from "../db/client";

const AUDIT_LOGS = "audit_logs";

export type AuditAction =
  | "owner.initialized"
  | "owner.reset"
  | "admin.created"
  | "admin.updated"
  | "admin.suspended"
  | "admin.reactivated"
  | "admin.deleted"
  | "admin.permissions_changed"
  | "request.created"
  | "request.approved"
  | "request.rejected"
  | "request.completed"
  | "reset.link_generated"
  | "reset.link_revoked"
  | "reset.completed"
  | "auth.login"
  | "auth.logout"
  | "order.status_changed"
  | "order.payment_changed"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "coupon.created"
  | "coupon.updated"
  | "coupon.deleted"
  | "settings.updated";

export type AuditEntry = {
  actorId: string;
  actorEmail: string;
  action: AuditAction | string;
  targetType?: string;
  targetId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata: Record<string, unknown>;
  ip: string;
  userAgent: string;
  createdAt: string;
};

const REDACTED_KEYS =
  /password|secret|token|hash|credential|authorization|cookie/i;

function redact(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (REDACTED_KEYS.test(key)) {
      clean[key] = "[redacted]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      clean[key] = redact(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    const db = await getDb();
    await db.collection(AUDIT_LOGS).insertOne({
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      action: entry.action,
      targetType: entry.targetType ?? "",
      targetId: entry.targetId ?? "",
      summary: entry.summary,
      metadata: redact(entry.metadata),
      ip: entry.ip ?? "",
      userAgent: entry.userAgent ?? "",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to record audit log", error);
  }
}

export async function getAuditLogs(options: {
  limit?: number;
  action?: string;
  actorId?: string;
} = {}): Promise<AuditLog[]> {
  if (!isDbConfigured()) return [];
  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (options.action) filter.action = options.action;
  if (options.actorId) filter.actorId = options.actorId;
  const docs = await db
    .collection(AUDIT_LOGS)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(200, Math.max(1, options.limit ?? 100)))
    .toArray();
  return docs.map((doc) => ({
    id: String(doc._id),
    actorId: String(doc.actorId ?? ""),
    actorEmail: String(doc.actorEmail ?? ""),
    action: String(doc.action ?? ""),
    targetType: String(doc.targetType ?? ""),
    targetId: String(doc.targetId ?? ""),
    summary: String(doc.summary ?? ""),
    metadata:
      doc.metadata && typeof doc.metadata === "object"
        ? (doc.metadata as Record<string, unknown>)
        : {},
    ip: String(doc.ip ?? ""),
    userAgent: String(doc.userAgent ?? ""),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(String(doc.createdAt)).toISOString(),
  }));
}
