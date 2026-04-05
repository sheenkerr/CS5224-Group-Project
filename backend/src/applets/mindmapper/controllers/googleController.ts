import { google } from "googleapis";
import oauth2Client from "../../../middlewares/googleAuthMiddleware";
import { createLogger } from "../../../utils/logger";
import { processNewFiles } from "./fileProcessingController";
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
        folder_id: folderId,
        folder_name: folderName,
        page_token: pageToken,
    });

    // Save to database to generate the _id
    const mindmapper_object = await partialApplet.save();
    const mindmapper_object_id = mindmapper_object._id.toString();

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
    const expirationDate = expiration ? new Date(parseInt(expiration, 10)) : undefined;

    // Update the Mongoose document properties
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
    // 1. Extract the Google headers
    const channelId = headers["x-goog-channel-id"] as string;
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

        // processNewFiles(
        //     activeChannel.page_token!,
        //     activeChannel.folder_id,
        //     activeChannel.folder_name,
        //     activeChannel.user_id
        // );

    } catch (error) {
        // Catch any database connection errors or invalid ID formats
        console.error(`Drive webhook: Error querying database for channel ${channelId}`, error);
    }
}