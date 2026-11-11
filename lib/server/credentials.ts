import { ObjectId } from "mongodb";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { getDb } from "../db/client";

function userIdFilter(userId: string) {
  return ObjectId.isValid(userId)
    ? { _id: new ObjectId(userId) }
    : { id: userId };
}

function relatedUserId(userId: string) {
  return ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
}

function relatedUserFilter(userId: string) {
  return { userId: { $in: [relatedUserId(userId), userId] } };
}

export async function setUserPassword(userId: string, password: string) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const db = await getDb();
  const hashedPassword = await hashPassword(password);
  const users = db.collection("user");
  const user = await users.findOne(userIdFilter(userId) as never);
  if (!user) throw new Error("User not found");

  const accounts = db.collection("account");
  const existing = await accounts.findOne({
    userId: relatedUserFilter(userId).userId,
    providerId: "credential",
  });
  const now = new Date();

  if (existing) {
    await accounts.updateOne(
      { _id: existing._id },
      { $set: { password: hashedPassword, updatedAt: now } },
    );
  } else {
    await accounts.insertOne({
      userId: relatedUserId(userId),
      accountId: userId,
      providerId: "credential",
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
  }

  await users.updateOne(
    userIdFilter(userId) as never,
    { $set: { updatedAt: now } },
  );
  await deleteUserSessions(userId);
}

export async function setUserEmail(userId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("Enter a valid email address");
  }
  const db = await getDb();
  const conflict = await db.collection("user").findOne({
    email: normalized,
    ...(ObjectId.isValid(userId)
      ? { _id: { $ne: new ObjectId(userId) } }
      : { id: { $ne: userId } }),
  });
  if (conflict) throw new Error("That email is already in use");
  const result = await db.collection("user").updateOne(
    userIdFilter(userId) as never,
    { $set: { email: normalized, emailVerified: true, updatedAt: new Date() } },
  );
  if (result.matchedCount !== 1) throw new Error("User not found");
  await deleteUserSessions(userId);
}

export async function verifyUserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  if (!password) return false;
  const db = await getDb();
  const account = await db.collection("account").findOne({
    userId: relatedUserFilter(userId).userId,
    providerId: "credential",
  });
  return (
    typeof account?.password === "string" &&
    (await verifyPassword({ hash: account.password, password }))
  );
}

export async function deleteUserSessions(userId: string) {
  const db = await getDb();
  await db.collection("session").deleteMany(relatedUserFilter(userId) as never);
}

export async function hasPassword(userId: string): Promise<boolean> {
  const db = await getDb();
  const account = await db.collection("account").findOne({
    userId: relatedUserFilter(userId).userId,
    providerId: "credential",
  });
  return Boolean(account?.password);
}

export async function setUserBanned(
  userId: string,
  banned: boolean,
  reason = "",
) {
  const db = await getDb();
  await db.collection("user").updateOne(userIdFilter(userId) as never, {
    $set: {
      banned,
      banReason: banned ? reason || "Suspended by the Owner" : null,
      banExpires: null,
      updatedAt: new Date(),
    },
  });
  if (banned) await deleteUserSessions(userId);
}

export async function deleteAuthUser(userId: string) {
  const db = await getDb();
  const user = await db
    .collection("user")
    .findOne(userIdFilter(userId) as never);
  if (!user) return false;
  await Promise.all([
    db.collection("account").deleteMany(relatedUserFilter(userId) as never),
    db.collection("session").deleteMany(relatedUserFilter(userId) as never),
    db.collection("user").deleteOne(userIdFilter(userId) as never),
  ]);
  return true;
}

export async function setUserRole(userId: string, role: string) {
  const db = await getDb();
  await db.collection("user").updateOne(userIdFilter(userId) as never, {
    $set: { role, updatedAt: new Date() },
  });
}
