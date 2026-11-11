import { promptHidden } from "./lib/prompt";
import { findUserById, promoteOwner, setupDb } from "./lib/owner";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { databaseName } = await setupDb();

  const { getOwnerConfig } = await import("../lib/db/admin");
  const owner = await getOwnerConfig();

  if (!owner?.userId) {
    console.error(
      "\nOwner is not initialized in MongoDB. Run npm run owner:init first.\n",
    );
    process.exitCode = 1;
    return;
  }

  const user = await findUserById(owner.userId);
  if (!user) {
    console.error(
      `\nOwner user ${owner.userId} was not found in the user collection.\n`,
    );
    process.exitCode = 1;
    return;
  }

  const email = String(user.email ?? "");
  console.log(`Database: ${databaseName}`);
  console.log(`Owner: ${email}`);
  console.log(`User id: ${owner.userId}`);

  if (dryRun) {
    console.log(
      "\nDry run — password would be replaced and all Owner sessions revoked.\n",
    );
    return;
  }

  const password = await promptHidden("New Owner password: ");
  const confirmation = await promptHidden("Confirm password: ");

  if (password !== confirmation) {
    console.error("\nPasswords do not match. Nothing was changed.\n");
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("\nPassword must be at least 8 characters. Nothing was changed.\n");
    process.exitCode = 1;
    return;
  }

  const { setUserPassword } = await import("../lib/server/credentials");
  await setUserPassword(owner.userId, password);
  await promoteOwner(owner.userId);

  const { recordAudit } = await import("../lib/server/audit");
  await recordAudit({
    actorId: owner.userId,
    actorEmail: email,
    action: "owner.reset",
    targetType: "user",
    targetId: owner.userId,
    summary: "Owner password reset from terminal recovery",
  });

  console.log(
    "\nOwner password updated. All Owner sessions were revoked.\n",
  );
}

main().catch((error) => {
  console.error(
    "\nOwner reset failed:",
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
