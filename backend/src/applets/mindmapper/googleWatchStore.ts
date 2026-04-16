import {
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { DYNAMO_TABLES, dynamo } from "../../utils/dynamo";
import { MindmapperWatchRecord } from "./types";

const WATCHES_TABLE = DYNAMO_TABLES.mindmapperWatches;

export async function saveMindmapperWatch(
  record: MindmapperWatchRecord
): Promise<void> {
  await dynamo.send(
    new PutCommand({
      TableName: WATCHES_TABLE,
      Item: record,
    })
  );
}

export async function getMindmapperWatch(
  mindmapperId: string
): Promise<MindmapperWatchRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: WATCHES_TABLE,
      Key: { mindmapperId },
    })
  );

  return (result.Item as MindmapperWatchRecord) ?? null;
}

export async function listExpiringMindmapperWatches(
  cutoffTimestamp: number
): Promise<MindmapperWatchRecord[]> {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: WATCHES_TABLE,
      FilterExpression: "#status = :active AND #expiration <= :cutoff",
      ExpressionAttributeNames: {
        "#status": "status",
        "#expiration": "expiration",
      },
      ExpressionAttributeValues: {
        ":active": "active",
        ":cutoff": cutoffTimestamp,
      },
    })
  );

  return (result.Items as MindmapperWatchRecord[]) ?? [];
}
