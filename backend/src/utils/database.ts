import { MongoClient, Db } from "mongodb";

let db: Db;

export async function connectToDatabase(uri: string): Promise<Db> {
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
