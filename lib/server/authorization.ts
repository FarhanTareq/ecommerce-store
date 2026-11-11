import { headers } from "next/headers";
import type { OrderStatus } from "../types";
import {
  allPermissions,
  canEditOrderStatus,
  canViewOrderStatus,
  hasPermission,
  type PermissionAction,
} from "../permissions";
import {
  getAdminProfile,
  getOwnerConfig,
  type AdminProfileStatus,
} from "../db/admin";
import { getServerSession, sessionRole } from "./guard";

export type ActorRole = "owner" | "admin" | "user";

export type Actor = {
  userId: string;
  email: string;
  name: string;
  role: ActorRole;
  permissions: string[];
  profileStatus: AdminProfileStatus | "none";
  isOwner: boolean;
  isAdmin: boolean;
};

export class AuthorizationError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 403, code = "forbidden") {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
    this.code = code;
  }
}

function normalizeRole(role: string | undefined): ActorRole {
  if (role === "owner") return "owner";
  if (role === "admin") return "admin";
  return "user";
}

export async function getActor(): Promise<Actor | null> {
  const session = await getServerSession();
  if (!session?.user) return null;

  const role = normalizeRole(sessionRole(session));
  const userId = String(session.user.id);
  const base: Actor = {
    userId,
    email: String(session.user.email ?? ""),
    name: String(session.user.name ?? ""),
    role,
    permissions: [],
    profileStatus: "none",
    isOwner: false,
    isAdmin: false,
  };

  if (role === "owner") {
    const config = await getOwnerConfig();
    const isOwner = Boolean(config && config.userId === userId);
    return {
      ...base,
      isOwner,
      isAdmin: isOwner,
      permissions: isOwner ? [...allPermissions] : [],
    };
  }

  if (role === "admin") {
    const profile = await getAdminProfile(userId);
    if (!profile) {
      return { ...base, isAdmin: false, profileStatus: "none" };
    }
    return {
      ...base,
      permissions: profile.permissions,
      profileStatus: profile.status,
      isAdmin: profile.status === "active",
    };
  }

  return base;
}

export function actorHas(actor: Actor, permission: string): boolean {
  if (actor.isOwner) return true;
  if (!actor.isAdmin) return false;
  return hasPermission(actor.permissions, permission);
}

export function actorHasAny(actor: Actor, permissions: readonly string[]): boolean {
  if (actor.isOwner) return true;
  if (!actor.isAdmin) return false;
  return permissions.some((permission) => hasPermission(actor.permissions, permission));
}

export function actorCanViewOrderStatus(
  actor: Actor,
  status: OrderStatus,
): boolean {
  if (actor.isOwner) return true;
  if (!actor.isAdmin) return false;
  return canViewOrderStatus(actor.permissions, status);
}

export function actorCanEditOrderStatus(
  actor: Actor,
  status: OrderStatus,
): boolean {
  if (actor.isOwner) return true;
  if (!actor.isAdmin) return false;
  return canEditOrderStatus(actor.permissions, status);
}

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) {
    throw new AuthorizationError(
      "Please sign in to continue",
      401,
      "unauthenticated",
    );
  }
  return actor;
}

export async function requireAdminActor(): Promise<Actor> {
  const actor = await requireActor();
  if (!actor.isAdmin) {
    if (actor.role === "admin" && actor.profileStatus === "suspended") {
      throw new AuthorizationError(
        "This admin account is suspended",
        403,
        "suspended",
      );
    }
    throw new AuthorizationError(
      "Admin access required",
      403,
      "not_admin",
    );
  }
  return actor;
}

export async function requireOwnerActor(): Promise<Actor> {
  const actor = await requireAdminActor();
  if (!actor.isOwner) {
    throw new AuthorizationError(
      "Owner access required",
      403,
      "not_owner",
    );
  }
  return actor;
}

export async function requirePermission(permission: string): Promise<Actor> {
  const actor = await requireAdminActor();
  if (!actorHas(actor, permission)) {
    throw new AuthorizationError(
      "You do not have permission to perform this action",
      403,
      "missing_permission",
    );
  }
  return actor;
}

export async function requireAnyPermission(
  permissions: readonly string[],
): Promise<Actor> {
  const actor = await requireAdminActor();
  if (!actorHasAny(actor, permissions)) {
    throw new AuthorizationError(
      "You do not have permission to perform this action",
      403,
      "missing_permission",
    );
  }
  return actor;
}

export async function requireModuleAction(
  moduleKey: string,
  action: PermissionAction,
): Promise<Actor> {
  return requirePermission(`${moduleKey}.${action}`);
}

export function assertCanEditOrderStatus(actor: Actor, status: OrderStatus) {
  if (!actorCanEditOrderStatus(actor, status)) {
    throw new AuthorizationError(
      "You do not have permission to edit orders in this status",
      403,
      "missing_order_permission",
    );
  }
}

export async function getRequestMeta(): Promise<{ ip: string; userAgent: string }> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for") ?? "";
    const ip =
      forwarded.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "";
    return {
      ip,
      userAgent: headersList.get("user-agent") ?? "",
    };
  } catch {
    return { ip: "", userAgent: "" };
  }
}
