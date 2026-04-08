import { Router } from "express";
import { getGoogleLoginUrl, handleGoogleCallback, getGoogleAccessToken, getGoogleClientId, setupDriveWatch, handleDriveWebhook } from "./controllers/googleController";
import { createLogger } from "../../utils/logger";
import { google } from "googleapis";
import oauth2Client from "../../middlewares/googleAuthMiddleware";


const router = Router();
const log = createLogger("Mindmapper");

/** Check that the routes are loaded properly */
router.get("/", (req, res) => {
    res.status(200).json({ message: "Mindmapper routes are imported" });
});

router.get("/google/login-url", (req, res) => {
    const authUrl = getGoogleLoginUrl();

    res.status(200).json({ authUrl });
});

/** Callback for google to send us data */
router.get("/google/callback", async (req, res) => {

    const result = await handleGoogleCallback(req);

    const frontendUrl = process.env.FRONTEND_URL;
    const redirectTarget = `${frontendUrl}/applets/mindmappers/setup?success=${result}`; //changed this

    res.redirect(redirectTarget);
});

router.get("/google/client-id", (req, res) => {
    const clientId = getGoogleClientId();
    res.status(200).json({ clientId });
});

/** Return the client key for use with Google Picker */
router.get("/google/api-key", async (req, res) => {

    res.status(200).json({ apiKey: process.env.GOOGLE_API_KEY });
});

/** Return the stored OAuth access token for use with Google Picker */
router.get("/google/access-token", (req, res) => {
    const token = getGoogleAccessToken();

    if (!token) {
        return res.status(401).json({ error: "Not authenticated with Google" });
    }

    res.status(200).json({ access_token: token });
});

/** Register a Google Drive watch channel for the selected folder */
router.post("/google/setup-listener", async (req, res) => {
    const { folderId, folderName} = req.body;
    
    if (!folderId || !folderName) {
        res.status(400).json({
            success: false,
            error: "No folder was selected"
        });
        return;
    }
    const email = (global as any).googleUserEmail;

    if (!email) {
        return res.status(401).json({
            success: false,
            error: "Google email not found. Please sign in again."
        });
    }

    try {
        await setupDriveWatch(folderId, folderName, email);
        res.status(200).json({
            message: "Drive watch registered",
            success: true
        });
    } catch (err: any) {
        log.error(`Failed to set up Drive watch: ${err.message}`);
        res.status(500).json({
            error: err.message,
            success: false
        });
    }
});

/**
 * Webhook endpoint — Google POSTs here whenever a Drive change happens.
 * Must respond 200 quickly; processing happens asynchronously.
 */
router.post("/google/drive-webhook", (req, res) => {
    res.sendStatus(200);
    handleDriveWebhook(req.headers as Record<string, string | string[] | undefined>)
        .catch((err) => log.error(`Error handling Drive webhook: ${err.message}`));
});

export default router;
