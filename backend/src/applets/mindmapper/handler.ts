import { Router } from "express";
import { getGoogleLoginUrl, handleGoogleCallback, getGoogleAccessToken, getGoogleClientId, setupDriveWatch, handleDriveWebhook, processWebhookRefreshes } from "./controllers/googleController";
import { createLogger } from "../../utils/logger";
import { requireAuth } from "../../middlewares/auth";

const router = Router();
const log = createLogger("Mindmapper");

/** Check that the routes are loaded properly */
router.get("/", (req, res) => {
    res.status(200).json({ message: "Mindmapper routes are imported" });
});

/** Callback for google to send us data */
router.get("/callback", async (req, res) => {

    const result = await handleGoogleCallback(req);

    const frontendUrl = process.env.FRONTEND_URL;

    const redirectTarget = `${frontendUrl}/applets/mindmappers/setup?success=${result}`;

    res.redirect(redirectTarget);
});

/**
 * Webhook endpoint — Google POSTs here whenever a Drive change happens.
 * Must respond 200 quickly; processing happens asynchronously.
 */
router.post("/drive-webhook", (req, res) => {
    res.sendStatus(200);
    handleDriveWebhook(req.headers as Record<string, string | string[] | undefined>)
        .catch((err) => log.error(`Error handling Drive webhook: ${err.message}`));
});

/** To refresh all the webhooks that are expiring soon */
router.post('/refresh-webhooks', async (req, res) => {
    try {

        const apiKey = req.headers['x-api-key'];
        if (apiKey !== process.env.AWS_CRON_SECRET) {
            return res.status(401).send("Unauthorized");
        }

        const result = await processWebhookRefreshes();

        console.log(result);

        res.status(200).send("Refresh cycle complete");

    } catch (error) {
        // Catch any critical errors that bubble up from the service
        console.error("[Webhook Cron] Critical error during refresh cycle:", error);
        return res.status(500).send("Internal server error during refresh cycle.");
    }
});

router.use(requireAuth);

router.get("/login-url", (req, res) => {
    const authUrl = getGoogleLoginUrl();

    res.status(200).json({ authUrl });
});

router.get("/client-id", (req, res) => {
    const clientId = getGoogleClientId();
    res.status(200).json({ clientId });
});

/** Return the client key for use with Google Picker */
router.get("/api-key", async (req, res) => {

    res.status(200).json({ apiKey: process.env.GOOGLE_API_KEY });
});

/** Return the stored OAuth access token for use with Google Picker */
router.get("/access-token", (req, res) => {
    const token = getGoogleAccessToken();

    if (!token) {
        return res.status(401).json({ error: "Not authenticated with Google" });
    }

    res.status(200).json({ access_token: token });
});

/** Register a Google Drive watch channel for the selected folder */
router.post("/setup-listener", async (req, res) => {
    const { userId, email, folderId, folderName } = req.body;

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!folderId || !folderName) {
        res.status(400).json({
            success: false,
            error: "No folder was selected"
        });
        return;
    }

    try {
        const mindmapperId = await setupDriveWatch(folderId, folderName, userId, email);
        res.status(200).json({
            message: "Drive watch registered",
            success: true,
            mindmapperId: mindmapperId
        });
    } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err);
        log.error(`Failed to set up Drive watch: ${message}`);
        res.status(500).json({
            error: message,
            success: false
        });
    }
});

export default router;
