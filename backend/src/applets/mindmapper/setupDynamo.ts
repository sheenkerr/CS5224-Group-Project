import dotenv from "dotenv";
dotenv.config();
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  DeleteTableCommand,
  waitUntilTableNotExists,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-southeast-1" });

async function recreateTable(params: any) {
  const tableName = params.TableName;

  // Delete if exists
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`🗑️  Deleting existing table "${tableName}"...`);
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    await waitUntilTableNotExists({ client, maxWaitTime: 60 }, { TableName: tableName });
    console.log(`✅ Table "${tableName}" deleted.`);
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`ℹ️  Table "${tableName}" does not exist, skipping delete.`);
    } else {
      throw err;
    }
  }

  // Recreate
  console.log(`🔨 Creating table "${tableName}"...`);
  await client.send(new CreateTableCommand(params));
  await waitUntilTableExists({ client, maxWaitTime: 60 }, { TableName: tableName });
  console.log(`✅ Table "${tableName}" created with correct schema!\n`);
}

async function main() {
  // Table 1: workspaces
  await recreateTable({
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

  // Table 2: graphs (composite SK: mindmapperId#documentId)
  await recreateTable({
    TableName: "mindmapper-graphs",
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
}

main().catch(console.error);