import { google } from "googleapis";
import oauth2Client from "../../../middlewares/googleAuthMiddleware";
import { createLogger } from "../../../utils/logger";
import { processNewFiles } from "./fileProcessingController";
import { v4 as uuidv4 } from "uuid";
import {
  getMindmapperWatch,
  listExpiringMindmapperWatches,
  saveMindmapperWatch,
} from "../googleWatchStore";
import { notifyMindmapperConnected } from "../notifications";
import { MindmapperWatchRecord } from "../types";

const log = createLogger("Mindmapper");
const CHANNEL_SEPARATOR = "__";
const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

function getWebhookBaseUrl(): string {
  return (process.env.GOOGLE_WEBHOOK_BASE_URL || process.env.BACKEND_URL || "").replace(/\/$/, "");
}

function getMindmapperIdFromChannelId(channelId: string): string {
  const [mindmapperId] = channelId.split(CHANNEL_SEPARATOR);
  return mindmapperId ?? channelId;
}

function getChannelId(mindmapperId: string): string {
  return `${mindmapperId}${CHANNEL_SEPARATOR}${Date.now()}`;
}

function getExpirationTimestamp(expiration: string | null | undefined): number {
  if (!expiration) {
    throw new Error("Drive watch did not respond with an expiration timestamp");
  }

  return Number(expiration);
}

function getDriveWebhookAddress(): string {
  const webhookBaseUrl = getWebhookBaseUrl();
  if (!webhookBaseUrl) {
    throw new Error("GOOGLE_WEBHOOK_BASE_URL or BACKEND_URL is not defined");
  }

  return `${webhookBaseUrl}/api/mindmapper/google/drive-webhook`;
}

export function getGoogleAccessToken(): string | null | undefined {
  return oauth2Client.credentials?.access_token;
}

export function getGoogleClientId(): string | undefined {
  return process.env.GOOGLE_CLIENT_ID;
}

export function getGoogleLoginUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_DRIVE_SCOPES,
    prompt: "consent select_account",
  });
}

export async function getUserOAuthClient(refreshToken: string): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const userSpecificOAuthClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  userSpecificOAuthClient.setCredentials({
    refresh_token: refreshToken,
  });

  return userSpecificOAuthClient;
}

export async function handleGoogleCallback(req: any): Promise<boolean> {
  const error = req.query.error as string | undefined;
  if (error) {
    return false;
  }

  const code = req.query.code as string | undefined;
  if (!code) {
    return false;
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return true;
}

/**
 * Register a Google Drive changes watch channel for the given folder.
 * Google will POST to our webhook endpoint whenever anything changes.
 */
export async function setupDriveWatch(
  folderId: string,
  folderName: string,
  userId: string,
  email: string
): Promise<string> {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const tokenRes = await drive.changes.getStartPageToken({});
  const pageToken = tokenRes.data.startPageToken;

  if (!pageToken) {
    throw new Error("Could not retrieve a start page token from Drive API");
  }

  const refreshToken = oauth2Client.credentials.refresh_token;
  if (!refreshToken) {
    throw new Error("No Google refresh token available");
  }

  const mindmapperId = uuidv4();
  const channelId = getChannelId(mindmapperId);
  const watchRes = await drive.changes.watch({
    pageToken,
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: getDriveWebhookAddress(),
    },
  });
  const { resourceId, expiration } = watchRes.data;

  if (!resourceId) {
    throw new Error("Drive watch did not respond with a resource ID");
  }

  const expirationTimestamp = getExpirationTimestamp(expiration);
  const watchRecord: MindmapperWatchRecord = {
    mindmapperId,
    userId,
    email,
    refreshToken,
    folderId,
    folderName,
    pageToken,
    channelId,
    resourceId,
    expiration: expirationTimestamp,
    status: "active",
    createdAt: Date.now(),
  };

  await saveMindmapperWatch(watchRecord);
  try {
    await notifyMindmapperConnected(userId, mindmapperId, folderName);
  } catch (error) {
    log.warn(
      `Drive watch registered for ${mindmapperId}, but notification creation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  log.info(
    `Drive watch registered, channel: ${channelId}, expires: ${new Date(expirationTimestamp).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}`
  );

  return mindmapperId;
}

/**
 * Handle an incoming Drive push-notification webhook.
 * Google always expects a 200 response quickly, so do the heavy lifting async.
 */
export async function handleDriveWebhook(
  headers: Record<string, string | string[] | undefined>
): Promise<void> {
  const googleChannelId = headers["x-goog-channel-id"];
  const fullChannelId = Array.isArray(googleChannelId) ? googleChannelId[0] : googleChannelId;
  const resourceState = headers["x-goog-resource-state"] as string;
  const resourceId = headers["x-goog-resource-id"] as string;

  if (resourceState === "sync") {
    console.log(`Drive webhook: sync ping received for channel ${fullChannelId}, ignored`);
    return;
  }

  if (!fullChannelId) {
    console.warn("Drive webhook: missing channel ID in headers");
    return;
  }

  try {
    const mindmapperId = getMindmapperIdFromChannelId(fullChannelId);
    const activeChannel = await getMindmapperWatch(mindmapperId);

    if (!activeChannel) {
      console.warn(`Drive webhook: received notification for unknown channel ${fullChannelId}`);
      return;
    }

    if (activeChannel.channelId !== fullChannelId) {
      console.warn(`Drive webhook: channel ID mismatch for ${fullChannelId}.`);
      return;
    }

    if (activeChannel.resourceId && activeChannel.resourceId !== resourceId) {
      console.warn(`Drive webhook: resource ID mismatch for channel ${fullChannelId}. Possible spoofing attempt.`);
      return;
    }

    console.log(`Drive webhook: change detected (state: ${resourceState}) for folder: ${activeChannel.folderName}`);
    await processNewFiles(activeChannel);
  } catch (error) {
    console.error(`Drive webhook: Error querying database for channel ${fullChannelId}`, error);
  }
}

/**
 * Finds all Drive webhooks expiring within the next hour and refreshes them.
 * Returns a summary of the operation.
 */
export async function processWebhookRefreshes(): Promise<
  | string
  | {
      processed: number;
      successes: number;
      failures: number;
    }
> {
  const oneHourFromNow = Date.now() + 60 * 60 * 1000;
  const expiringWatches = await listExpiringMindmapperWatches(oneHourFromNow);

  if (expiringWatches.length === 0) {
    return "No webhooks need refreshing right now.";
  }

  let successCount = 0;
  let failCount = 0;

  for (const mindmapperWatch of expiringWatches) {
    try {
      const userOAuthClient = await getUserOAuthClient(mindmapperWatch.refreshToken);
      await refreshDriveWatch(mindmapperWatch, userOAuthClient);
      successCount++;
    } catch (refreshError) {
      console.error(
        `[Webhook Cron] Failed to refresh webhook for ID ${mindmapperWatch.mindmapperId}:`,
        refreshError
      );
      failCount++;
    }
  }

  return {
    processed: expiringWatches.length,
    successes: successCount,
    failures: failCount,
  };
}

export async function refreshDriveWatch(
  mindmapperWatch: MindmapperWatchRecord,
  userOAuthClient: InstanceType<typeof google.auth.OAuth2>
): Promise<void> {
  const drive = google.drive({ version: "v3", auth: userOAuthClient });
  const oldChannelId = mindmapperWatch.channelId;

  try {
    await drive.channels.stop({
      requestBody: {
        id: oldChannelId,
        resourceId: mindmapperWatch.resourceId,
      },
    });
  } catch {
    console.log(`Old channel ${oldChannelId} could not be stopped (likely already expired).`);
  }

  const newChannelId = getChannelId(mindmapperWatch.mindmapperId);
  const watchRes = await drive.changes.watch({
    pageToken: mindmapperWatch.pageToken,
    requestBody: {
      id: newChannelId,
      type: "web_hook",
      address: getDriveWebhookAddress(),
    },
  });
  const { resourceId, expiration } = watchRes.data;

  if (!resourceId) {
    throw new Error("Drive watch did not respond with a resource ID during refresh");
  }

  const expirationTimestamp = getExpirationTimestamp(expiration);
  await saveMindmapperWatch({
    ...mindmapperWatch,
    channelId: newChannelId,
    resourceId,
    expiration: expirationTimestamp,
    status: "active",
  });

  log.info(
    `Drive watch refreshed, channel: ${newChannelId}, expires: ${new Date(expirationTimestamp).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}`
  );
}
