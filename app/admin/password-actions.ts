"use server";

import { z } from "zod";
import {
  createAdminRequest,
  consumeAdminResetToken,
  findValidAdminResetToken,
  getAdminProfile,
  getAuthUserByEmail,
  getAuthUserById,
  resolveAdminRequest,
} from "@/lib/db/admin";
import { getRequestMeta } from "@/lib/server/authorization";
import { checkRateLimit, rateLimits } from "@/lib/server/rate-limit";
import { recordAudit } from "@/lib/server/audit";
import { setUserPassword } from "@/lib/server/credentials";

export type PasswordActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function fail(error: unknown): PasswordActionResult {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Something went wrong",
  };
}

const recoverySchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export async function requestPasswordRecoveryAction(
  raw: unknown,
): Promise<PasswordActionResult> {
  try {
    const parsed = recoverySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Enter a valid email",
      };
    }

    const meta = await getRequestMeta();
    const email = parsed.data.email.toLowerCase();
    const limit = await checkRateLimit({
      key: `recovery:${meta.ip}:${email}`,
      ...rateLimits.passwordReset,
    });
    if (!limit.allowed) {
      return { ok: false, message: "Too many requests. Try again later." };
    }

    const user = await getAuthUserByEmail(email);
    if (user && user.role === "admin" && !user.banned) {
      const profile = await getAdminProfile(user.id);
      if (profile?.status === "active") {
        await createAdminRequest({
          adminUserId: user.id,
          adminEmail: user.email,
          type: "password_recovery",
          reason: "Password recovery requested from the admin sign-in page",
        });
        await recordAudit({
          actorId: "anonymous",
          actorEmail: email,
          action: "request.created",
          targetType: "admin_request",
          targetId: user.id,
          summary: "Admin password recovery requested",
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
      }
    }

    return {
      ok: true,
      message:
        "If that admin account exists, the Owner will see a recovery request. Contact the Owner to receive your reset link.",
    };
  } catch (error) {
    return fail(error);
  }
}

const completeSchema = z.object({
  token: z.string().trim().min(20, "Reset link is invalid"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
});

export async function completePasswordResetAction(
  raw: unknown,
): Promise<PasswordActionResult> {
  try {
    const parsed = completeSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Invalid reset request",
      };
    }
    if (parsed.data.password !== parsed.data.confirmPassword) {
      return { ok: false, message: "Passwords do not match" };
    }

    const meta = await getRequestMeta();
    const limit = await checkRateLimit({
      key: `reset-complete:${meta.ip}`,
      ...rateLimits.passwordReset,
    });
    if (!limit.allowed) {
      return {
        ok: false,
        message: "Too many attempts. Request a new link from the Owner.",
      };
    }

    const valid = await findValidAdminResetToken(parsed.data.token);
    if (!valid) {
      return {
        ok: false,
        message: "This reset link is invalid, expired, or has already been used.",
      };
    }

    const user = await getAuthUserById(valid.adminUserId);
    const profile = await getAdminProfile(valid.adminUserId);
    if (
      !user ||
      user.role !== "admin" ||
      user.banned ||
      profile?.status !== "active"
    ) {
      return {
        ok: false,
        message: "This admin account is no longer active. Contact the Owner.",
      };
    }

    const consumed = await consumeAdminResetToken(parsed.data.token);
    if (!consumed || consumed.adminUserId !== valid.adminUserId) {
      return {
        ok: false,
        message: "This reset link is invalid, expired, or has already been used.",
      };
    }

    await setUserPassword(consumed.adminUserId, parsed.data.password);

    if (consumed.requestId) {
      await resolveAdminRequest({
        id: consumed.requestId,
        status: "completed",
        resolvedBy: consumed.createdBy || "owner",
        expectedStatus: "approved",
        note: "Reset link used; password updated.",
      });
    }

    await recordAudit({
      actorId: consumed.adminUserId,
      actorEmail: user.email,
      action: "reset.completed",
      targetType: "user",
      targetId: consumed.adminUserId,
      summary: "Admin completed a password reset with an Owner-issued link",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return {
      ok: true,
      message: "Password updated. You can now sign in with your new password.",
    };
  } catch (error) {
    return fail(error);
  }
}
