"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createAdminRequest,
  findPendingAdminRequest,
} from "@/lib/db/admin";
import {
  getRequestMeta,
  requireOwnerActor,
  requirePermission,
} from "@/lib/server/authorization";
import { checkRateLimit, rateLimits } from "@/lib/server/rate-limit";
import { recordAudit } from "@/lib/server/audit";
import { setUserEmail, verifyUserPassword } from "@/lib/server/credentials";

export type RequestActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function fail(error: unknown): RequestActionResult {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Something went wrong",
  };
}

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  reason: z.string().trim().max(500).optional().default(""),
});

const ownerEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  currentPassword: z.string().min(8, "Enter your current password"),
});

export async function changeOwnerEmailAction(
  raw: unknown,
): Promise<RequestActionResult> {
  try {
    const actor = await requireOwnerActor();
    const parsed = ownerEmailSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Invalid email change",
      };
    }

    const limit = await checkRateLimit({
      key: `owner:credential:${actor.userId}`,
      ...rateLimits.ownerAction,
    });
    if (!limit.allowed) {
      return { ok: false, message: "Too many changes. Try again later." };
    }

    const email = parsed.data.email.toLowerCase();
    if (email === actor.email.toLowerCase()) {
      return { ok: false, message: "That is already your Owner email." };
    }
    if (!(await verifyUserPassword(actor.userId, parsed.data.currentPassword))) {
      return { ok: false, message: "Current password is incorrect." };
    }

    await setUserEmail(actor.userId, email);
    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "owner.email_changed",
      targetType: "user",
      targetId: actor.userId,
      summary: "Owner login email changed",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/admin/account");
    revalidatePath("/owner/security");
    return {
      ok: true,
      message: "Owner email updated. Sign in again with the new email.",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function requestEmailChangeAction(
  raw: unknown,
): Promise<RequestActionResult> {
  try {
    const actor = await requirePermission("account.view");
    if (actor.isOwner) {
      return {
        ok: false,
        message: "The Owner can manage email changes from the Owner Panel.",
      };
    }
    const parsed = emailSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Invalid request",
      };
    }

    const limit = await checkRateLimit({
      key: `admin-request:${actor.userId}`,
      ...rateLimits.adminRequest,
    });
    if (!limit.allowed) {
      return { ok: false, message: "Too many requests. Try again later." };
    }

    const existing = await findPendingAdminRequest(actor.userId, "email_change");
    if (existing) {
      return {
        ok: false,
        message: "You already have a pending email change request.",
      };
    }

    await createAdminRequest({
      adminUserId: actor.userId,
      adminEmail: actor.email,
      type: "email_change",
      proposedEmail: parsed.data.email,
      reason: parsed.data.reason,
    });

    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "request.created",
      targetType: "admin_request",
      summary: `Requested an email change to ${parsed.data.email}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/admin/account");
    revalidatePath("/owner/requests");
    return { ok: true, message: "Email change request sent to the Owner." };
  } catch (error) {
    return fail(error);
  }
}

export async function requestPasswordChangeAction(
  reason: string,
): Promise<RequestActionResult> {
  try {
    const actor = await requirePermission("account.view");
    if (actor.isOwner) {
      return {
        ok: false,
        message: "Use the password form or npm run owner:reset.",
      };
    }

    const limit = await checkRateLimit({
      key: `admin-request:${actor.userId}`,
      ...rateLimits.adminRequest,
    });
    if (!limit.allowed) {
      return { ok: false, message: "Too many requests. Try again later." };
    }

    const existing = await findPendingAdminRequest(
      actor.userId,
      "password_change",
    );
    if (existing) {
      return {
        ok: false,
        message: "You already have a pending password change request.",
      };
    }

    await createAdminRequest({
      adminUserId: actor.userId,
      adminEmail: actor.email,
      type: "password_change",
      reason: reason.trim().slice(0, 500),
    });

    const meta = await getRequestMeta();
    await recordAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "request.created",
      targetType: "admin_request",
      summary: "Requested a password change",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/admin/account");
    revalidatePath("/owner/requests");
    return { ok: true, message: "Password change request sent to the Owner." };
  } catch (error) {
    return fail(error);
  }
}
