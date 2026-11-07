import { headers } from "next/headers";
import { auth } from "../auth";

export type ServerSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export async function getServerSession(): Promise<ServerSession> {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export function sessionRole(
  session: ServerSession | null | undefined,
): string | undefined {
  if (!session?.user) return undefined;
  return (session.user as { role?: string }).role;
}

export async function requireAdmin() {
  const session = await getServerSession();
  if (!session?.user || sessionRole(session) !== "admin") {
    throw new Error("Unauthorized: admin access required");
  }
  return session;
}

export async function isAdmin() {
  const session = await getServerSession();
  return Boolean(session?.user && sessionRole(session) === "admin");
}
