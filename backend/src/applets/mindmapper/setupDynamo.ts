// ─────────────────────────────────────────────
// setup-dynamo.ts
// Creates the DynamoDB table for mindmapper.
// Run ONCE before first use.
//
// Usage:
//   cd backend
//   npx ts-node src/applets/mindmapper/setup-dynamo.ts
// ─────────────────────────────────────────────

import dotenv from "dotenv";
dotenv.config();
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-southeast-1" });

async function createTable(params: any) {
  const tableName = params.TableName;
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`✅ Table "${tableName}" already exists.`);
  } catch {
    console.log(`Creating table "${tableName}"...`);
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Table "${tableName}" created!`);
  }
}

async function main() {
  // Table 1: workspaces
  await createTable({
    TableName: "mindmapper-workspaces",
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "mindmapperId", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "mindmapperId", KeyType: "RANGE" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

  // Table 2: graphs (composite SK)
  await createTable({
    TableName: "mindmapper-graphs",
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "mindmapperDocId", AttributeType: "S" }, // mindmapperId#documentId
    ],
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "mindmapperDocId", KeyType: "RANGE" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });
}

main().catch(console.error);