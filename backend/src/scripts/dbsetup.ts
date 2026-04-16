import dotenv from "dotenv";
import path from "path";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DYNAMO_TABLES, dynamo } from "../utils/dynamo";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

type ActivitySeed = {
  _id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: number;
};

type NotificationSeed = {
  _id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  link: string;
  created_at: number;
};

async function seedDatabase() {
  const mainUserId =
    process.env.TEST_CLERK_USER_ID ?? "user_2aBxY9ZqH8mWvP3KtRsT4LnC1jF";

  const mockActivities: ActivitySeed[] = [
    {
      _id: "act_101",
      user_id: mainUserId,
      action_type: "CREATED_DOCUMENT",
      entity_type: "DOCUMENT",
      entity_id: "doc_101",
      metadata: { title: "Project Alpha Requirements" },
      created_at: Date.parse("2024-03-01T08:00:00Z"),
    },
    {
      _id: "act_102",
      user_id: "user_2bCyZ0XwJ7nPcQ4LuUvA2MnD3kE",
      action_type: "FAVORITED_MINDMAP",
      entity_type: "MINDMAP",
      entity_id: "mm_505",
      metadata: { previous_state: "unfavorited" },
      created_at: Date.parse("2024-03-05T11:20:00Z"),
    },
    {
      _id: "act_103",
      user_id: mainUserId,
      action_type: "UPDATED_TASK",
      entity_type: "TASK",
      entity_id: "task_882",
      metadata: { old_status: "TODO", new_status: "IN_PROGRESS" },
      created_at: Date.parse("2024-03-10T09:45:00Z"),
    },
    {
      _id: "act_104",
      user_id: "user_2cDaW1YmK9rTdM5VxRsB9LpV8sT",
      action_type: "UPDATED_DOCUMENT",
      entity_type: "DOCUMENT",
      entity_id: "doc_101",
      metadata: {
        old_name: "Project Alpha Requirements",
        new_name: "Project Alpha - Final Requirements",
      },
      created_at: Date.parse("2024-03-12T16:00:00Z"),
    },
  ];

  const mockNotifications: NotificationSeed[] = [
    {
      _id: "notif_101",
      user_id: mainUserId,
      title: "Mindmap Created",
      message: "Flowfox has finished creating the mindmap",
      is_read: false,
      type: "SYSTEM_UPDATE",
      link: "/documents/doc_101",
      created_at: Date.parse("2024-03-12T16:05:00Z"),
    },
    {
      _id: "notif_102",
      user_id: "user_2bCyZ0XwJ7nPcQ4LuUvA2MnD3kE",
      title: "Mindmap Output",
      message: "Flowfox has finished exporting the mindmap",
      is_read: true,
      type: "SYSTEM_UPDATE",
      link: "/mindmaps/mm_102",
      created_at: Date.parse("2024-03-14T10:00:00Z"),
    },
    {
      _id: "notif_103",
      user_id: "user_2cDaW1YmK9rTdM5VxRsB9LpV8sT",
      title: "Task Reminder",
      message: 'Your task "Review design comps" is due tomorrow.',
      is_read: false,
      type: "REMINDER",
      link: "/tasks/task_905",
      created_at: Date.parse("2024-03-15T08:00:00Z"),
    },
  ];

  console.log(`Seeding ${DYNAMO_TABLES.userActivities}...`);
  for (const activity of mockActivities) {
    await dynamo.send(
      new PutCommand({
        TableName: DYNAMO_TABLES.userActivities,
        Item: activity,
      })
    );
  }

  console.log(`Seeding ${DYNAMO_TABLES.userNotifications}...`);
  for (const notification of mockNotifications) {
    await dynamo.send(
      new PutCommand({
        TableName: DYNAMO_TABLES.userNotifications,
        Item: notification,
      })
    );
  }

  console.log("DynamoDB seed completed successfully.");
}

seedDatabase().catch((error) => {
  console.error("Error seeding DynamoDB tables:", error);
  process.exit(1);
});
