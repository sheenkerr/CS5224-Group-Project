import dotenv from "dotenv";
dotenv.config();
import {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { DYNAMO_TABLES } from "../../utils/dynamo";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-southeast-1" });

async function ensureTable(params: any) {
  const tableName = params.TableName;

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`ℹ️  Table "${tableName}" already exists.`);
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`🔨 Creating table "${tableName}"...`);
      await client.send(new CreateTableCommand(params));
      await waitUntilTableExists({ client, maxWaitTime: 60 }, { TableName: tableName });
      console.log(`✅ Table "${tableName}" created.\n`);
    } else {
      throw err;
    }
  }
}

async function main() {
  await ensureTable({
    TableName: DYNAMO_TABLES.mindmapperWorkspaces,
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

  await ensureTable({
    TableName: DYNAMO_TABLES.mindmapperGraphs,
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "mindmapperDocId", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "mindmapperDocId", KeyType: "RANGE" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

  await ensureTable({
    TableName: DYNAMO_TABLES.userActivities,
    AttributeDefinitions: [
      { AttributeName: "user_id", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "N" },
    ],
    KeySchema: [
      { AttributeName: "user_id", KeyType: "HASH" },
      { AttributeName: "created_at", KeyType: "RANGE" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

  await ensureTable({
    TableName: DYNAMO_TABLES.mindmapperWatches,
    AttributeDefinitions: [
      { AttributeName: "mindmapperId", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "mindmapperId", KeyType: "HASH" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

  await ensureTable({
    TableName: DYNAMO_TABLES.userNotifications,
    AttributeDefinitions: [
      { AttributeName: "user_id", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "N" },
    ],
    KeySchema: [
      { AttributeName: "user_id", KeyType: "HASH" },
      { AttributeName: "created_at", KeyType: "RANGE" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });
}

main().catch(console.error);
