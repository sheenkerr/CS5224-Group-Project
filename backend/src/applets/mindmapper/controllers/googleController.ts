import { google } from "googleapis";
import oauth2Client from "../../../middlewares/googleAuthMiddleware";
import { createLogger } from "../../../utils/logger";
import { processNewFiles } from "./fileProcessingController";
import { IMindmapper } from "../../../models/mindmapper_model";
import Mindmapper from "../../../models/mindmapper_model";

const log = createLogger("Mindmapper");

export function getGoogleAccessToken() {
    return oauth2Client.credentials?.access_token;
}

export function getGoogleClientId() {
    return process.env.GOOGLE_CLIENT_ID;
}

export function getGoogleLoginUrl() {
    const SCOPE = [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPE,
        prompt: "consent select_account",
    });

    return authUrl;
}

export async function getUserOAuthClient(refresh_token: string) {
    const userSpecificOAuthClient = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    userSpecificOAuthClient.setCredentials({
        refresh_token: refresh_token,
    });

    return userSpecificOAuthClient;
}

export async function handleGoogleCallback(req: any) {
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
    const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
    });

    // try {
    //     const { data } = await oauth2.userinfo.get();
    //     (global as any).googleUserEmail = data.email;
    // } catch (err) {
    //     console.error("Failed to get user email:", err);
    // }
    return true;
}

/**
 * Register a Google Drive changes watch channel for the given folder.
 * Google will POST to our webhook endpoint whenever anything changes.
 */
export async function setupDriveWatch(folderId: string, folderName: string, userId: string, email: string) {

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get a baseline page token so we only see changes from NOW onward
    const tokenRes = await drive.changes.getStartPageToken({});
    const pageToken = tokenRes.data.startPageToken;
    if (!pageToken) {
        throw new Error("Could not retrieve a start page token from Drive API");
    }

    // Build the public webhook URL
    const webhookBase = process.env.BACKEND_URL;
    if (!webhookBase) {
        throw new Error("BACKEND_URL is not defined");
    }

    // This just links to our backend endpoint
    const webhookAddress = `${webhookBase}/api/mindmapper/google/drive-webhook`;

    const partialApplet = new Mindmapper({
        user_id: userId,
        email: email,
        refresh_token: oauth2Client.credentials.refresh_token,
        folder_id: folderId,
        folder_name: folderName,
        page_token: pageToken,
    });

    // Save to database to generate the _id
    const mindmapper_object = await partialApplet.save();
    const mindmapper_object_id = `${mindmapper_object._id.toString()}-${Date.now()}`;

    // Register the watch channel
    const watchRes = await drive.changes.watch({
        pageToken,
        requestBody: {
            id: mindmapper_object_id,
            type: "web_hook",
            address: webhookAddress,
        },
    });

    const { resourceId, expiration } = watchRes.data;
    if (!resourceId || !expiration) {
        throw new Error("Drive watch did not respond to our request");
    };

    // Google returns the expiration as a string of Unix epoch time (milliseconds)
    // Example: "1698765432100". We parse it into an integer, then convert it to a Date.
    const expirationDate = new Date(parseInt(expiration, 10));

    // Update the Mongoose document properties
    mindmapper_object.channel_id = mindmapper_object_id;
    mindmapper_object.resource_id = resourceId;
    mindmapper_object.expiration = expirationDate;

    mindmapper_object.page_token = pageToken;
    mindmapper_object.status = "active";

    // Save the updated document back to MongoDB
    await mindmapper_object.save();

    log.info(`Drive watch registered, channel: ${mindmapper_object_id.toString()}, expires: ${new Date(Number(expiration)).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}`);
}

/**
 * Handle an incoming Drive push-notification webhook.
 * Google always expects a 200 response quickly, so do the heavy lifting async.
 */
export async function handleDriveWebhook(headers: Record<string, string | string[] | undefined>) {
    // Extract the Google headers
    const googleChannelId: any = headers['x-goog-channel-id'];
    const channelId = googleChannelId.split('-')[0];
    const resourceState = headers["x-goog-resource-state"] as string;
    const resourceId = headers["x-goog-resource-id"] as string;

    // "sync" fires immediately after watch registration
    if (resourceState === "sync") {
        console.log(`Drive webhook: sync ping received for channel ${channelId}, ignored`);
        return;
    }

    if (!channelId) {
        console.warn(`Drive webhook: missing channel ID in headers`);
        return;
    }

    try {
        // Because we set channelId = result._id.toString() earlier, we can use findById
        const activeChannel = await Mindmapper.findById(channelId);

        // Verify the channel exists in our database
        if (!activeChannel) {
            console.warn(`Drive webhook: received notification for unknown channel ${channelId}`);
            return;
        }

        // Verify the resource ID matches what Google gave us during setup
        if (activeChannel.resource_id && activeChannel.resource_id !== resourceId) {
            console.warn(`Drive webhook: resource ID mismatch for channel ${channelId}. Possible spoofing attempt.`);
            return;
        }

        console.log(`Drive webhook: change detected (state: ${resourceState}) for folder: ${activeChannel.folder_name}`);

        await processNewFiles(activeChannel);

    } catch (error) {
        // Catch any database connection errors or invalid ID formats
        console.error(`Drive webhook: Error querying database for channel ${channelId}`, error);
    }
}

/**
 * Finds all Drive webhooks expiring within the next hour and refreshes them.
 * Returns a summary of the operation.
 */
export async function processWebhookRefreshes() {
    // Calculate the time window (Current time + 1 hour) in UTC
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find all active webhooks that expire before our 1-hour buffer
    const expiringWatches = await Mindmapper.find({
        status: "active",
        expiration: { $lte: oneHourFromNow }
    });

    if (expiringWatches.length === 0) {
        return "No webhooks need refreshing right now.";
    }

    // Loop through and refresh them
    let successCount = 0;
    let failCount = 0;

    for (const object of expiringWatches) {
        const mindmapper_object: IMindmapper = object;
        try {
            const oauth2Client = await getUserOAuthClient(mindmapper_object.refresh_token);

            if (!oauth2Client) {
                throw new Error(`Could not find OAuth credentials for user ${mindmapper_object.user_id}`);
            }

            await refreshDriveWatch(mindmapper_object, oauth2Client);
            successCount++;

        } catch (refreshError) {
            console.error(`[Webhook Cron] Failed to refresh webhook for ID ${mindmapper_object._id}:`, refreshError);
            failCount++;
        }
    }

    // Return the summary statistics
    return {
        processed: expiringWatches.length,
        successes: successCount,
        failures: failCount
    };
}

export async function refreshDriveWatch(mindmapper_object: IMindmapper, oauth2Client: any) {
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const oldChannelId = mindmapper_object._id.toString();

    try {
        await drive.channels.stop({
            requestBody: {
                id: oldChannelId,
                resourceId: mindmapper_object.resource_id,
            }
        });
    } catch (error) {
        // It is perfectly fine if this fails. The channel likely expired naturally.
        console.log(`Old channel ${oldChannelId} could not be stopped (likely already expired).`);
    }

    // 3. Create a NEW unique ID for Google by appending the current timestamp
    const newChannelId = `${mindmapper_object._id.toString()}-${Date.now()}`;

    const webhookBase = process.env.BACKEND_URL;
    const webhookAddress = `${webhookBase}/api/mindmapper/google/drive-webhook`;

    // Start the new watch using the saved page_token!
    const watchRes = await drive.changes.watch({
        pageToken: mindmapper_object.page_token,
        requestBody: {
            id: newChannelId,
            type: "web_hook",
            address: webhookAddress,
        },
    });

    const { resourceId, expiration } = watchRes.data;
    if (!resourceId || !expiration) {
        throw new Error("Drive watch did not respond to our refresh request");
    }

    const expirationDate = new Date(parseInt(expiration, 10));

    // Update the Mongoose document with the new Google properties
    mindmapper_object.channel_id = newChannelId;
    mindmapper_object.resource_id = resourceId;
    mindmapper_object.expiration = expirationDate;

    // Save it back to MongoDB!
    await mindmapper_object.save();
}