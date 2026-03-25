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

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-1" });
const TABLE_NAME = "mindmapper-graphs";

async function main() {
  // Check if table already exists
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`✅ Table "${TABLE_NAME}" already exists.`);
    return;
  } catch {
    // Table doesn't exist, create it
  }

  console.log(`Creating table "${TABLE_NAME}"...`);

  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: "userId",     AttributeType: "S" },
        { AttributeName: "documentId", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "userId",     KeyType: "HASH"  }, // partition key
        { AttributeName: "documentId", KeyType: "RANGE" }, // sort key
      ],
      BillingMode: "PAY_PER_REQUEST", // free tier friendly
    })
  );

  console.log(`✅ Table "${TABLE_NAME}" created successfully!`);
}

main().catch(console.error);