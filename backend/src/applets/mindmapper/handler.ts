import { Router } from "express";
import { getGoogleLoginUrl, handleGoogleCallback } from "./controllers/googleController";
import { createLogger } from "../../utils/logger";

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
    const redirectTarget = `${frontendUrl}/applets/Mindmappers/setup?success=${result}`;

    res.redirect(redirectTarget);
});

export default router;