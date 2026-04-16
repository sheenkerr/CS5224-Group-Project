import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const awsRegion = process.env.AWS_REGION ?? "ap-southeast-1";

const client = new DynamoDBClient({ region: awsRegion });

export const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const DYNAMO_TABLES = {
  mindmapperGraphs: process.env.MINDMAPPER_TABLE ?? "mindmapper-graphs",
  mindmapperWorkspaces: process.env.MINDMAPPER_WORKSPACES_TABLE ?? "mindmapper-workspaces",
  mindmapperWatches: process.env.MINDMAPPER_WATCHES_TABLE ?? "mindmapper-google-watches",
  userActivities: process.env.USER_ACTIVITIES_TABLE ?? "flowfox-user-activities",
  userNotifications: process.env.USER_NOTIFICATIONS_TABLE ?? "flowfox-user-notifications",
};
