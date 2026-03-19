import { Router } from "express";
import mindmapperRouter from "../applets/mindmapper/handler";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Applet routes
router.use("/mindmapper", mindmapperRouter);

export default router;
