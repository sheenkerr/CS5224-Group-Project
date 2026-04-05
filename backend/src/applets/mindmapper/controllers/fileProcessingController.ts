import axios from "axios";
import { google } from "googleapis";
import oauth2Client from "../../../middlewares/googleAuthMiddleware";
import { createLogger } from "../../../utils/logger";
import { IMindmapper } from "../../../models/mindmapper_model";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const log = createLogger("Mindmapper");

// Processes new files in the watched folder
// We pass the entire Mongoose document instead of individual strings
export async function processNewFiles(activeChannel: IMindmapper) {
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Fetch the actual list of changes since the last page token
    const changesRes = await drive.changes.list({
        pageToken: activeChannel.page_token,
        // We ask Google to return the new token, and the file details we care about
        fields: "newStartPageToken, changes(fileId, file(name, mimeType, parents, trashed))",
    });

    // Update the database with the new bookmark
    if (changesRes.data.newStartPageToken) {
        activeChannel.page_token = changesRes.data.newStartPageToken;
        await activeChannel.save();
    }

    const changes = changesRes.data.changes ?? [];
    const newFileNames: string[] = [];

    for (const change of changes) {
        const file = change.file;

        // Skip trashed files and folders themselves
        if (!file || file.trashed || file.mimeType === "application/vnd.google-apps.folder") {
            continue;
        };

        const parents = file.parents ?? [];

        // Ensure that what we have is indeed a file in the watched folder
        if (parents.includes(activeChannel.folder_id)) {
            const fileName = file.name ?? "Unknown file";

            // Add the file name to our simple list
            newFileNames.push(fileName);

            // Trigger your email logic
            console.log(`New file detected: ${fileName}`);
            // console.log("processing controller: EMAIL BEING USED:", activeChannel.email);
            // await triggerEmail(fileName, activeChannel.folder_name, activeChannel.email);
        }
    }

    // Return the list of file names so our webhook handler knows what happened
    return newFileNames;
}

async function triggerEmail(fileName: string, folderName: string, email: string) {
    try {
        await axios.post(
            "https://k7qshcvminxug77qohskxynbne0mpauh.lambda-url.us-east-2.on.aws/",
            JSON.stringify({
                subject: "New file uploaded",
                message: `New file "${fileName}" uploaded to folder "${folderName}"`,
                email: email
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    } catch (err) {
        console.error("Failed to trigger email:", err);
    }
}