import axios from "axios";
import { google } from "googleapis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getUserOAuthClient } from "../controllers/googleController";
import { saveMindmapperWatch } from "../googleWatchStore";
import { MindmapperWatchRecord } from "../types";

function getS3Config(): {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
} {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing AWS credentials in environment variables");
  }

  return { region, accessKeyId, secretAccessKey };
}

function getBackendInternalUrl(): string {
  const backendPort = process.env.BACKEND_PORT ?? process.env.PORT ?? "4001";
  return (process.env.BACKEND_INTERNAL_URL ?? `http://127.0.0.1:${backendPort}`).replace(/\/$/, "");
}

function getS3BucketName(): string {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("Missing S3_BUCKET_NAME in environment variables");
  }

  return bucketName;
}

export async function processNewFiles(activeChannel: MindmapperWatchRecord): Promise<string[]> {
  const userOAuthClient = await getUserOAuthClient(activeChannel.refreshToken);
  const drive = google.drive({ version: "v3", auth: userOAuthClient });
  const changesRes = await drive.changes.list({
    pageToken: activeChannel.pageToken,
    fields: "newStartPageToken, changes(fileId, file(name, mimeType, parents, trashed))",
  });
  const nextPageToken = changesRes.data.newStartPageToken;

  if (nextPageToken) {
    await saveMindmapperWatch({
      ...activeChannel,
      pageToken: nextPageToken,
    });
  }

  const newFileNames: string[] = [];

  for (const change of changesRes.data.changes ?? []) {
    const file = change.file;
    if (!file || file.trashed || file.mimeType === "application/vnd.google-apps.folder") {
      continue;
    }

    const isInWatchedFolder = (file.parents ?? []).includes(activeChannel.folderId);
    if (!isInWatchedFolder || !change.fileId) {
      continue;
    }

    const fileName = file.name ?? "Unknown file";
    newFileNames.push(fileName);

    await transferDriveFileToS3(
      drive,
      activeChannel.userId,
      activeChannel.mindmapperId,
      change.fileId,
      fileName
    );

    console.log("processing controller: EMAIL BEING USED:", activeChannel.email);
    await triggerEmail(fileName, activeChannel.folderName, activeChannel.email);
  }

  return newFileNames;
}

export async function transferDriveFileToS3(
  drive: any,
  userId: string,
  mindmapperId: string,
  fileId: string,
  fileName: string
): Promise<boolean> {
  const s3Config = getS3Config();
  const s3Client = new S3Client({
    region: s3Config.region,
    credentials: {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    },
  });

  try {
    const driveResponse = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );
    const bucketName = getS3BucketName();
    const objectKey = `mindmappers/${userId}/${mindmapperId}/${fileName}`;
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: objectKey,
        Body: driveResponse.data,
      },
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(`Uploading ${fileName} to S3: ${progress.loaded} / ${progress.total} bytes`);
    });

    await upload.done();
    console.log(`Successfully transferred ${fileName} to S3!`);

    await axios.post(`${getBackendInternalUrl()}/api/mindmapper/s3-webhook`, {
      bucketName,
      objectKey,
      mindmapperAppletId: mindmapperId,
    });

    return true;
  } catch (error) {
    console.error(`Failed to transfer ${fileName} to S3:`, error);
    throw error;
  }
}

async function triggerEmail(fileName: string, folderName: string, email: string): Promise<void> {
  try {
    await axios.post(
      "https://k7qshcvminxug77qohskxynbne0mpauh.lambda-url.us-east-2.on.aws/",
      JSON.stringify({
        subject: "New file uploaded",
        message: `New file "${fileName}" uploaded to folder "${folderName}"`,
        email,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Failed to trigger email:", err);
  }
}
