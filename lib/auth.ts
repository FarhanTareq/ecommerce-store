import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
} from "better-auth/plugins/admin/access";
import { nextCookies } from "better-auth/next-js";
import { getDatabaseName, getMongoClient } from "./db/client";
import { getOwnerConfig } from "./db/admin";

const client = getMongoClient();

const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string }
> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

const ac = createAccessControl(defaultStatements);

const ownerRole = ac.newRole({
  user: [...defaultStatements.user],
  session: [...defaultStatements.session],
});

const adminRole = ac.newRole({
  user: [],
  session: [],
});

const userRole = ac.newRole({
  user: [],
  session: [],
});

const credentialPaths = new Set([
  "/change-password",
  "/change-email",
  "/delete-user",
  "/admin/set-user-password",
]);

const blockedPublicResetPaths = new Set([
  "/request-password-reset",
  "/reset-password",
]);

export const auth = betterAuth({
  database: mongodbAdapter(client.db(getDatabaseName()), { client }),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "sporsify-development-secret-change-me-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async () => {
      throw new APIError("FORBIDDEN", {
        message: "Password reset is managed by the Owner.",
        code: "PASSWORD_RESET_DISABLED",
      });
    },
  },
  socialProviders,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 600, max: 10 },
      "/sign-up/email": { window: 3600, max: 5 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const path = ctx.path;

      if (blockedPublicResetPaths.has(path)) {
        throw new APIError("FORBIDDEN", {
          message: "Password reset is managed by the Owner.",
          code: "PASSWORD_RESET_DISABLED",
        });
      }

      const isCredentialPath = credentialPaths.has(path);
      const isAdminApiPath = path.startsWith("/admin/");

      if (!isCredentialPath && !isAdminApiPath) return;

      const session = await getSessionFromCtx(ctx);
      if (!session?.user) {
        throw new APIError("UNAUTHORIZED", {
          message: "Sign in to continue",
          code: "UNAUTHORIZED",
        });
      }

      const role = (session.user as { role?: string }).role;
      const owner = role === "owner" ? await getOwnerConfig() : null;
      if (role !== "owner" || owner?.userId !== String(session.user.id)) {
        throw new APIError("FORBIDDEN", {
          message:
            "Only the initialized Owner can change credentials or manage admin accounts.",
          code: "OWNER_ONLY",
        });
      }

      if (isAdminApiPath) {
        const body = (ctx.body ?? {}) as Record<string, unknown>;
        const targetId =
          typeof body.userId === "string"
            ? body.userId
            : typeof body.id === "string"
              ? body.id
              : "";
        const targetRole =
          typeof body.role === "string"
            ? body.role
            : typeof body.data === "object" && body.data
              ? String((body.data as Record<string, unknown>).role ?? "")
              : "";

        if (
          targetId &&
          targetId === session.user.id &&
          (path === "/admin/remove-user" || path === "/admin/ban-user")
        ) {
          throw new APIError("FORBIDDEN", {
            message: "The Owner account cannot be removed or suspended.",
            code: "OWNER_SELF_PROTECTED",
          });
        }

        const requestedRoles = targetRole
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        if (requestedRoles.includes("owner")) {
          throw new APIError("FORBIDDEN", {
            message: "The Owner role cannot be assigned from this endpoint.",
            code: "OWNER_ROLE_PROTECTED",
          });
        }

        if (
          targetId === session.user.id &&
          requestedRoles.length &&
          !requestedRoles.includes("owner")
        ) {
          throw new APIError("FORBIDDEN", {
            message: "The Owner account cannot be demoted.",
            code: "OWNER_SELF_PROTECTED",
          });
        }
      }
    }),
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["owner"],
      roles: {
        owner: ownerRole,
        admin: adminRole,
        user: userRole,
      },
    }),
    nextCookies(),
  ],
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        defaultValue: "",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});
