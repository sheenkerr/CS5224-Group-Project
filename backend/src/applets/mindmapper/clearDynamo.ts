import dotenv from "dotenv";
dotenv.config();
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-southeast-1" })
);

async function main() {
  const result = await client.send(new QueryCommand({
    TableName: "mindmapper-graphs",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": "test-user" },
  }));

  for (const item of result.Items || []) {
    await client.send(new DeleteCommand({
      TableName: "mindmapper-graphs",
      Key: { userId: item.userId, documentId: item.documentId },
    }));
    console.log(`Deleted: ${item.documentId}`);
  }
  console.log("✅ Done!");
}
main().catch(console.error);