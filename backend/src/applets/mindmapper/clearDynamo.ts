import dotenv from "dotenv";
dotenv.config();
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-southeast-1" })
);

async function main() {
  const result = await client.send(new ScanCommand({ TableName: "mindmapper-graphs" }));

  console.log(`Found ${result.Items?.length ?? 0} records`);

  for (const item of result.Items || []) {
    // Use whichever range key actually exists on the item
    const rangeKey = item.mindmapperDocId
      ? { userId: item.userId, mindmapperDocId: item.mindmapperDocId }
      : { userId: item.userId, documentId: item.documentId };

    await client.send(new DeleteCommand({ TableName: "mindmapper-graphs", Key: rangeKey }));
    console.log(`Deleted: ${JSON.stringify(rangeKey)}`);
  }

  console.log("✅ Done!");
}
main().catch(console.error);