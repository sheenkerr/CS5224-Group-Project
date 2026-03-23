import oauth2Client from "../../../middlewares/googleAuthMiddleware";
import { createLogger } from "../../../utils/logger";

const log = createLogger("Mindmapper");

export function getGoogleLoginUrl() {
    const SCOPE = [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPE,
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
    return true;
}