import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DYNAMO_TABLES, dynamo } from "./dynamo";

type CreatedAtValue = string;

type UserNotificationRecord = {
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  link?: string;
  created_at: CreatedAtValue;
};

type UserActivityRecord = {
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: CreatedAtValue;
};

type CreateUserNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
};

type CreateUserActivityInput = {
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

function getCreatedAtValue(): CreatedAtValue {
  return new Date().toISOString();
}

export async function createUserNotification(
  input: CreateUserNotificationInput
): Promise<UserNotificationRecord> {
  const notification: UserNotificationRecord = {
    user_id: input.userId,
    title: input.title,
    message: input.message,
    is_read: false,
    type: input.type,
    link: input.link,
    created_at: getCreatedAtValue(),
  };

  await dynamo.send(
    new PutCommand({
      TableName: DYNAMO_TABLES.userNotifications,
      Item: notification,
    })
  );

  return notification;
}

export async function createUserActivity(
  input: CreateUserActivityInput
): Promise<UserActivityRecord> {
  const activity: UserActivityRecord = {
    user_id: input.userId,
    action_type: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata,
    created_at: getCreatedAtValue(),
  };

  await dynamo.send(
    new PutCommand({
      TableName: DYNAMO_TABLES.userActivities,
      Item: activity,
    })
  );

  return activity;
}
