import { redirect } from "next/navigation";
import type { OrderStatus } from "../types";
import { firstAllowedAdminPath } from "../permissions";
import {
  actorCanViewOrderStatus,
  actorHas,
  actorHasAny,
  getActor,
  type Actor,
} from "./authorization";

export async function getAdminPageActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/admin/login");
  if (!actor.isAdmin) redirect("/admin/forbidden");
  return actor;
}

export async function requirePagePermission(permission: string): Promise<Actor> {
  const actor = await getAdminPageActor();
  if (!actorHas(actor, permission)) {
    redirect(firstAllowedAdminPath(actor.permissions));
  }
  return actor;
}

export async function requireAnyPagePermission(
  permissions: readonly string[],
): Promise<Actor> {
  const actor = await getAdminPageActor();
  if (!actorHasAny(actor, permissions)) {
    redirect(firstAllowedAdminPath(actor.permissions));
  }
  return actor;
}

export async function requirePageOrderStatus(
  status: OrderStatus,
): Promise<Actor> {
  const actor = await getAdminPageActor();
  if (!actorCanViewOrderStatus(actor, status)) {
    redirect(firstAllowedAdminPath(actor.permissions));
  }
  return actor;
}

export async function requireOwnerPage(): Promise<Actor> {
  const actor = await getAdminPageActor();
  if (!actor.isOwner) redirect("/admin/forbidden");
  return actor;
}
