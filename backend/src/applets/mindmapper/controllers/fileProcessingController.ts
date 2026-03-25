import { google } from "googleapis";
import oauth2Client from "../../../middlewares/googleAuthMiddleware";
import { createLogger } from "../../../utils/logger";

const log = createLogger("Mindmapper");

// Processes new files in the watched folder
export async function processNewFiles(pageToken: string, folderId: string, folderName: string) {
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Fetch the actual list of changes since the last page token
    const changesRes = await drive.changes.list({
        pageToken: pageToken,
        fields: "newStartPageToken, changes(fileId, file(name, mimeType, parents, trashed))",
    });

    // Advance the page token so next notification starts from here
    if (changesRes.data.newStartPageToken) {
        pageToken = changesRes.data.newStartPageToken;
    }

    const changes = changesRes.data.changes ?? [];
    const watchedFolderId = folderId;

    for (const change of changes) {
        const file = change.file;

        // Skip trashed files and folders themselves
        if (!file || file.trashed || file.mimeType === "application/vnd.google-apps.folder") {
            continue;
        };

        const parents = file.parents ?? [];
        // Ensure that what we have is indeed a file in the watched folder
        if (parents.includes(watchedFolderId)) {
            log.info(`New file detected in watched folder "${folderName}": ${file.name} (id: ${change.fileId})`);
            // TODO: trigger mind-map processing here
        }
    }
}