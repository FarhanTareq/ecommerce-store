"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  createAdminProfile,
  createAdminResetToken,
  deleteAdminProfile,
  getAdminProfile,
  getAdminRequest,
  getAuthUserByEmail,
  getAuthUserById,
  resolveAdminRequest,
  resolvePendingAdminRequests,
  revokeAdminResetTokens,
  updateAdminProfile,
} from "@/lib/db/admin";
import { sanitizePermissions } from "@/lib/permissions";
import {
  getRequestMeta,
  requireOwnerActor,
} from "@/lib/server/authorization";
import { checkRateLimit, rateLimits } from "@/lib/server/rate-limit";
import { recordAudit } from "@/lib/server/audit";
import {
  deleteAuthUser,
  setUserBanned,
  setUserEmail,
  setUserRole,
} from "@/lib/server/credentials";

export type OwnerActionResult =
  | { ok: true; message: string; resetLink?: string }
  | { ok: false; message: string };

function fail(error: unknown): OwnerActionResult {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Something went wrong",
  };
}

async function requireOwnerActionActor() {
  const actor = await requireOwnerActor();
  const limit = await checkRateLimit({
    key: `owner:actions:${actor.userId}`,
    ...rateLimits.ownerAction,
  });
  if (!limit.allowed) {
    throw new Error("Too many Owner actions. Try again later.");
  }
  return actor;
}

const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  permissions: z.array(z.string()).min(1, "Choose at least one permission"),
});

export async function createAdminAction(raw: unknown): Promise<OwnerActionResult> {
  try {
    const actor = await requireOwnerActionActor();
    const parsed = createAdminSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Invalid admin details",
      };
    }

    const permissions = sanitizePermissions(parsed.data.permissions);
    if (!permissions.length) {
      return { ok: false, message: "Choose at least one valid permission" };
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await getAuthUserByEmail(email);
    if (existing) {
      return { ok: false, message: "An account with that email already exists" };
    }

    const requestHeaders = await headers();
    const created = await auth.api.createUser({
      body: {
        email,
        password: parsed.data.password,
        name: parsed.data.name,
        role: "admin",
      },
      headers: requestHeaders,
    });

    const userId = String(
      (created as { user?: { id?: string } } | undefined)?.user?.id ?? "",
    );
    const user = userId
      ? await getAuthUserById(userId)
      : await getAuthUserByEmail(email);
    if (!user) {
      return { ok: false, message: "Admin account was created but could not be loaded" };
    }

    if (user.role !== "admin") {
      await setUserRole(user.id, "admin");
    }

    await createAdminProfile({
      userId: user.id,
      permissions,
      status: "active",
      createdBy: actor.userId,
    });

    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "admin.created",
      targetType: "user",
      targetId: user.id,
      summary: `Created admin ${email}`,
      metadata: { permissions },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/owner");
    revalidatePath("/owner/admins");
    return { ok: true, message: `Admin created: ${email}` };
  } catch (error) {
    return fail(error);
  }
}

const updateAdminSchema = z.object({
  userId: z.string().min(1),
  permissions: z.array(z.string()),
  status: z.enum(["active", "suspended"]),
});

export async function updateAdminAction(
  raw: unknown,
): Promise<OwnerActionResult> {
  try {
    const actor = await requireOwnerActionActor();
    const parsed = updateAdminSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Invalid admin update",
      };
    }

    const user = await getAuthUserById(parsed.data.userId);
    if (!user || user.role !== "admin") {
      return { ok: false, message: "Admin not found" };
    }

    const permissions = sanitizePermissions(parsed.data.permissions);
    if (!permissions.length) {
      return { ok: false, message: "Choose at least one valid permission" };
    }

    const previousProfile = await getAdminProfile(parsed.data.userId);
    if (previousProfile) {
      await updateAdminProfile(parsed.data.userId, {
        permissions,
        status: parsed.data.status,
      });
    } else {
      await createAdminProfile({
        userId: parsed.data.userId,
        permissions,
        status: parsed.data.status,
        createdBy: actor.userId,
      });
    }
    await setUserBanned(
      parsed.data.userId,
      parsed.data.status === "suspended",
      "Suspended by the Owner",
    );
    if (parsed.data.status === "suspended") {
      await revokeAdminResetTokens(parsed.data.userId);
      await resolvePendingAdminRequests(parsed.data.userId, {
        status: "rejected",
        resolvedBy: actor.userId,
        note: "Admin suspended by the Owner.",
      });
    }

    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: parsed.data.status === "suspended"
        ? "admin.suspended"
        : previousProfile?.status === "suspended"
          ? "admin.reactivated"
          : "admin.permissions_changed",
      targetType: "user",
      targetId: parsed.data.userId,
      summary: `Updated admin ${user.email}`,
      metadata: { permissions, status: parsed.data.status },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/owner");
    revalidatePath("/owner/admins");
    revalidatePath(`/owner/admins/${parsed.data.userId}`);
    return {
      ok: true,
      message:
        parsed.data.status === "suspended"
          ? "Admin suspended and sessions revoked"
          : "Admin permissions updated",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAdminAction(
  userId: string,
): Promise<OwnerActionResult> {
  try {
    const actor = await requireOwnerActionActor();
    const user = await getAuthUserById(userId);
    if (!user || user.role !== "admin") {
      return { ok: false, message: "Admin not found" };
    }

    await revokeAdminResetTokens(userId);
    await resolvePendingAdminRequests(userId, {
      status: "rejected",
      resolvedBy: actor.userId,
      note: "Admin account deleted by the Owner.",
    });
    await deleteAdminProfile(userId);
    await deleteAuthUser(userId);

    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "admin.deleted",
      targetType: "user",
      targetId: userId,
      summary: `Deleted admin ${user.email}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/owner");
    revalidatePath("/owner/admins");
    return { ok: true, message: `Admin deleted: ${user.email}` };
  } catch (error) {
    return fail(error);
  }
}

export async function approveRequestAction(
  requestId: string,
): Promise<OwnerActionResult> {
  try {
    const actor = await requireOwnerActionActor();
    const request = await getAdminRequest(requestId);
    if (!request) return { ok: false, message: "Request not found" };
    if (request.status !== "pending") {
      return { ok: false, message: "This request is no longer pending" };
    }

    if (request.type === "email_change") {
      if (!request.proposedEmail) {
        return { ok: false, message: "This request has no proposed email" };
      }
      const user = await getAuthUserById(request.adminUserId);
      if (!user || user.role !== "admin") {
        return { ok: false, message: "This admin account no longer exists" };
      }
      await setUserEmail(request.adminUserId, request.proposedEmail);
      const resolved = await resolveAdminRequest({
        id: request.id,
        status: "completed",
        resolvedBy: actor.userId,
        expectedStatus: "pending",
        note: "Email change approved and applied.",
      });
      if (!resolved) {
        return { ok: false, message: "This request is no longer pending" };
      }

      const meta = await getRequestMeta();
      await recordAudit({
        actorId: actor.userId,
        actorEmail: actor.email,
        action: "request.approved",
        targetType: "admin_request",
        targetId: request.id,
        summary: `Approved email change to ${request.proposedEmail}`,
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
      revalidatePath("/owner/requests");
      revalidatePath("/owner/admins");
      return { ok: true, message: "Email change approved and applied." };
    }

    const user = await getAuthUserById(request.adminUserId);
    const profile = await getAdminProfile(request.adminUserId);
    if (
      !user ||
      user.role !== "admin" ||
      user.banned ||
      profile?.status !== "active"
    ) {
      return {
        ok: false,
        message: "Only an active admin can receive a password reset link.",
      };
    }

    const claimed = await resolveAdminRequest({
      id: request.id,
      status: "approved",
      resolvedBy: actor.userId,
      expectedStatus: "pending",
      note: "Reset link is being generated by the Owner.",
    });
    if (!claimed) {
      return { ok: false, message: "This request is no longer pending" };
    }

    const token = randomBytes(32).toString("base64url");
    try {
      await createAdminResetToken({
        requestId: request.id,
        adminUserId: request.adminUserId,
        token,
        createdBy: actor.userId,
        expiresInMs: 30 * 60 * 1000,
      });
    } catch (error) {
      await revokeAdminResetTokens(request.adminUserId);
      await resolveAdminRequest({
        id: request.id,
        status: "pending",
        resolvedBy: actor.userId,
        expectedStatus: "approved",
        note: "",
      });
      throw error;
    }

    const baseUrl =
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const resetLink = `${baseUrl.replace(/\/$/, "")}/admin/reset-password?token=${token}`;

    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "reset.link_generated",
      targetType: "admin_request",
      targetId: request.id,
      summary: `Generated a reset link for ${request.adminEmail}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/owner/requests");
    return {
      ok: true,
      message:
        "Reset link generated. Copy it now — it is shown once and expires in 30 minutes.",
      resetLink,
    };
  } catch (error) {
    return fail(error);
  }
}

const rejectSchema = z.object({
  requestId: z.string().min(1),
  note: z.string().trim().max(500).optional().default(""),
});

export async function rejectRequestAction(
  raw: unknown,
): Promise<OwnerActionResult> {
  try {
    const actor = await requireOwnerActionActor();
    const parsed = rejectSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: "Invalid rejection details" };
    }
    const request = await getAdminRequest(parsed.data.requestId);
    if (!request) return { ok: false, message: "Request not found" };
    if (request.status !== "pending") {
      return { ok: false, message: "This request is no longer pending" };
    }

    const resolved = await resolveAdminRequest({
      id: request.id,
      status: "rejected",
      resolvedBy: actor.userId,
      expectedStatus: "pending",
      note: parsed.data.note,
    });
    if (!resolved) {
      return { ok: false, message: "This request is no longer pending" };
    }

    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "request.rejected",
      targetType: "admin_request",
      targetId: request.id,
      summary: `Rejected ${request.type} request from ${request.adminEmail}`,
      metadata: { note: parsed.data.note },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/owner/requests");
    return { ok: true, message: "Request rejected." };
  } catch (error) {
    return fail(error);
  }
}

export async function revokeResetLinksAction(
  adminUserId: string,
): Promise<OwnerActionResult> {
  try {
    const actor = await requireOwnerActionActor();
    await revokeAdminResetTokens(adminUserId);
    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "reset.link_revoked",
      targetType: "user",
      targetId: adminUserId,
      summary: "Revoked outstanding reset links",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    revalidatePath("/owner/security");
    return { ok: true, message: "Outstanding reset links revoked." };
  } catch (error) {
    return fail(error);
  }
}
