import axios from "axios";
import { google } from "googleapis";
import { createLogger } from "../../../utils/logger";
import { IMindmapper } from "../../../models/mindmapper_model";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getUserOAuthClient } from "../controllers/googleController";

const log = createLogger("Mindmapper");

// Processes new files in the watched folder
// We pass the entire Mongoose document instead of individual strings
export async function processNewFiles(activeChannel: IMindmapper) {

    const oauth2Client = await getUserOAuthClient(activeChannel.refresh_token);
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

            // Move the file to S3
            await transferDriveFileToS3(drive, activeChannel._id.toString(), change.fileId!, fileName);

            // Trigger your email logic
            console.log("processing controller: EMAIL BEING USED:", activeChannel.email);
            await triggerEmail(fileName, activeChannel.folder_name, activeChannel.email);
        }
    }

    // Return the list of file names so our webhook handler knows what happened
    return newFileNames;
}

export async function transferDriveFileToS3(drive: any, mindmapperId: string, fileId: string, fileName: string) {

    const awsRegion = process.env.AWS_REGION;
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!awsRegion || !accessKey || !secretKey) {
        throw new Error("Missing AWS credentials in environment variables!");
    }

    const s3Client = new S3Client({
        region: awsRegion,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        }
    });

    try {
        const driveResponse = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        // Prepare the S3 Upload
        const bucketName = process.env.S3_BUCKET_NAME;

        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: `mindmappers/${mindmapperId}/${fileName}`,
                Body: driveResponse.data,
            },
        });

        parallelUploads3.on("httpUploadProgress", (progress) => {
            console.log(`Uploading ${fileName} to S3: ${progress.loaded} / ${progress.total} bytes`);
        });

        // Execute the upload
        await parallelUploads3.done();
        console.log(`Successfully transferred ${fileName} to S3!`);

        // Alert the mindmapper to start processing the new file
        await axios.post(
            "http://localhost:4001/api/mindmapper/s3-webhook",
            JSON.stringify({
                "bucketName": bucketName,
                "objectKey": `mindmappers/${mindmapperId}/${fileName}`,
                "mindmapperAppletId": mindmapperId
            })
        );

        return true;
    } catch (error) {
        console.error(`Failed to transfer ${fileName} to S3:`, error);
        throw error;
    }
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