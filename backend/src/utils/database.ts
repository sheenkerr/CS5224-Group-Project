import mongoose from 'mongoose';
import { Db } from 'mongodb';

let db: Db;

export async function connectToDatabase(uri: string): Promise<Db> {
  await mongoose.connect(uri);

  console.log("Mongoose connected successfully!");

  if (mongoose.connection.db) {
    db = mongoose.connection.db;
  } else {
    throw new Error("Mongoose connected, but native db object is missing.");
  }

  return db;
}