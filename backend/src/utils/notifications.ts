import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DYNAMO_TABLES, dynamo } from "./dynamo";

export type UserNotificationRecord = {
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  link?: string;
  created_at: number;
};

type CreateUserNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
};

let lastNotificationTimestamp = 0;

function nextNotificationTimestamp(): number {
  const now = Date.now() * 1000;
  lastNotificationTimestamp = Math.max(now, lastNotificationTimestamp + 1);
  return lastNotificationTimestamp;
}

function buildUserNotificationRecord(
  input: CreateUserNotificationInput
): UserNotificationRecord {
  return {
    user_id: input.userId,
    title: input.title,
    message: input.message,
    is_read: false,
    type: input.type,
    link: input.link,
    created_at: nextNotificationTimestamp(),
  };
}

export async function createUserNotification(
  input: CreateUserNotificationInput
): Promise<UserNotificationRecord> {
  const notification = buildUserNotificationRecord(input);

  await dynamo.send(
    new PutCommand({
      TableName: DYNAMO_TABLES.userNotifications,
      Item: notification,
    })
  );

  return notification;
}
