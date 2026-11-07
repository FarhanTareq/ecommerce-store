import type { ClientSession } from "mongodb";
import { getMongoClient } from "./client";

function isTransactionUnsupported(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set") ||
    message.includes("not supported")
  );
}

export async function withOptionalTransaction<T>(
  work: (session?: ClientSession) => Promise<T>,
): Promise<T> {
  const client = getMongoClient();
  let session: ClientSession | undefined;
  try {
    session = client.startSession();
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result as T;
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return work();
    }
    throw error;
  } finally {
    if (session) await session.endSession();
  }
}
