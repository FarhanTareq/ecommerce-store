import {
  createCredentialUser,
  ensureCredentialPassword,
  ensureOwnerIndexes,
  findUserByEmail,
  findUserById,
  getOwnerEnv,
  promoteOwner,
  setupDb,
} from "./lib/owner";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { email, password, name } = getOwnerEnv();

  const { databaseName } = await setupDb();
  const { getOwnerConfig, setOwnerConfig } = await import("../lib/db/admin");
  const existingOwner = await getOwnerConfig();

  console.log(`Database: ${databaseName}`);
  console.log(`Bootstrap email: ${email || "(not set)"}`);

  if (existingOwner?.userId) {
    const configuredOwner = await findUserById(existingOwner.userId);
    if (configuredOwner) {
      const isOwner = configuredOwner.role === "owner";
      if (dryRun) {
        console.log(
          `\nOwner is already initialized (user ${existingOwner.userId}).${
            isOwner ? "" : " The Owner role would be restored."
          }`,
        );
        console.log("No changes will be written.\n");
        return;
      }

      await ensureOwnerIndexes();
      if (!isOwner) {
        await promoteOwner(existingOwner.userId, name);
        console.log("\nRestored the Owner role for the configured Owner account.");
      }
      console.log(
        `\nOwner is already initialized (user ${existingOwner.userId}). Nothing else was changed.`,
      );
      console.log("Use npm run owner:reset to recover the Owner password.\n");
      return;
    }

    console.log(
      `\nConfigured Owner user ${existingOwner.userId} no longer exists. A replacement will be created from the environment.\n`,
    );
  }

  if (!email || !password) {
    console.error(
      "\nSet ADMIN_EMAIL and ADMIN_PASSWORD in .env.local before running owner:init.\n",
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("\nADMIN_PASSWORD must be at least 8 characters.\n");
    process.exitCode = 1;
    return;
  }

  if (!dryRun) await ensureOwnerIndexes();

  const existingUser = await findUserByEmail(email);

  if (dryRun) {
    console.log("\nDry run — no changes will be written.");
    console.log(
      existingUser
        ? `User exists: ${String(existingUser._id)}`
        : "User will be created.",
    );
    if (existingUser) {
      const { hasPassword } = await import("../lib/server/credentials");
      console.log(
        (await hasPassword(String(existingUser._id)))
          ? "A credential password already exists; it will not be overwritten."
          : "A credential password will be created from ADMIN_PASSWORD.",
      );
    }
    console.log("Owner role and system_config.owner will be set.");
    return;
  }

  let user = existingUser;
  if (!user) {
    console.log("Creating owner account…");
    user = await createCredentialUser({ email, password, name });
  }

  const userId = String(user._id ?? user.id ?? "");
  if (!userId) throw new Error("Could not resolve owner user id");

  const credentialCreated = await ensureCredentialPassword(userId, password);
  await promoteOwner(userId, name);
  await setOwnerConfig(userId);

  const { recordAudit } = await import("../lib/server/audit");
  await recordAudit({
    actorId: userId,
    actorEmail: email,
    action: "owner.initialized",
    targetType: "system_config",
    targetId: "owner",
    summary: existingOwner
      ? "Owner configuration repaired from environment bootstrap"
      : "Owner account initialized from environment bootstrap",
    metadata: { credentialCreated, existingUser: Boolean(existingUser) },
  });

  console.log(`\nOwner ready: ${email}`);
  console.log(`User id: ${userId}`);
  console.log(
    credentialCreated
      ? "Credential password created from ADMIN_PASSWORD."
      : "Existing credential password was left unchanged.",
  );
  console.log(
    "MongoDB is now the source of truth. Redeploys will not overwrite Owner credentials.\n",
  );
}

main()
  .catch((error) => {
    console.error(
      "\nOwner initialization failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const { getMongoClient } = await import("../lib/db/client");
      await getMongoClient().close();
    } catch {
      // ignore shutdown errors
    }
  });
