import { MongoClient, type Db } from "mongodb";

const rawUri = process.env.MONGODB_URI?.trim() ?? "";
const dbName = process.env.MONGODB_DB?.trim() || "sporsify";

const globalForMongo = globalThis as unknown as {
  _sporsifyMongoClient?: MongoClient;
};

export function isDbConfigured() {
  return (
    rawUri.startsWith("mongodb") &&
    !rawUri.includes("USER:PASSWORD") &&
    !rawUri.includes("cluster.mongodb.net/?")
  );
}

export function getMongoClient() {
  if (!globalForMongo._sporsifyMongoClient) {
    globalForMongo._sporsifyMongoClient = new MongoClient(
      rawUri || "mongodb://127.0.0.1:27017",
      {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
      },
    );
  }
  return globalForMongo._sporsifyMongoClient;
}

export async function getDb(): Promise<Db> {
  if (!isDbConfigured()) {
    throw new Error(
      "MongoDB is not configured. Add MONGODB_URI to .env.local and restart the server.",
    );
  }
  const client = getMongoClient();
  await client.connect();
  return client.db(dbName);
}

export function getDatabaseName() {
  return dbName;
}
