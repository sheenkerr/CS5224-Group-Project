import { Router } from "express";
import oauth2Client from "../../middlewares/googleAuthMiddleware";
import { createLogger } from "../../utils/logger";

const router = Router();
const log = createLogger("Mindmapper");

/** Check that the routes are loaded properly */
router.get("/", (req, res) => {
    res.status(200).json({ message: "Mindmapper routes are imported" });
});

router.get("/google/login-url", (req, res) => {
    const SCOPE = [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPE,
    });

    log.info(authUrl);

    res.status(200).json({ authUrl });
});

/** Callback for google to send us data */
router.get("/google/callback", (req, res) => {
    res.status(200).json({ message: "Google has responded" });
});

export default router;