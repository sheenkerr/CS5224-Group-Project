import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Router, Response } from "express";
import { requireAuth } from "../middlewares/auth";
import { DYNAMO_TABLES, dynamo } from "../utils/dynamo";

const router = Router();

type ActivityRecord = {
  _id?: string;
  user_id: string;
  action_type?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: number | string;
};

type NotificationRecord = {
  _id?: string;
  user_id: string;
  title?: string;
  message?: string;
  is_read?: boolean;
  type?: string;
  link?: string;
  created_at: number | string;
};

function getUserId(req: unknown): string | undefined {
  return (req as any).userId;
}

function withSyntheticId<T extends { _id?: string; user_id: string; created_at: number | string }>(
  record: T
): T & { _id: string } {
  return {
    _id: record._id ?? `${record.user_id}:${record.created_at}`,
    ...record,
  };
}

async function fetchRecentUserItems(tableName: string, userId: string): Promise<Record<string, unknown>[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      ScanIndexForward: false,
      Limit: 10,
    })
  );

  return result.Items ?? [];
}

router.get("/activities", requireAuth, async (req, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const activities = (await fetchRecentUserItems(
      DYNAMO_TABLES.userActivities,
      userId
    )) as ActivityRecord[];

    res.json(activities.map(withSyntheticId));
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/notifications", requireAuth, async (req, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notifications = (await fetchRecentUserItems(
      DYNAMO_TABLES.userNotifications,
      userId
    )) as NotificationRecord[];

    res.json(notifications.map(withSyntheticId));
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
