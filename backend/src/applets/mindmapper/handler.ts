import { Router } from "express";

const router = Router();

/** Check that the routes are loaded properly */
router.get("/", (req, res) => {
    res.status(200).json({ message: "Mindmapper routes are imported" });
});

export default router;