import { Router } from "express";
import mindmapperRouter from "../applets/mindmapper/handler";
import mindmapperExtractRouter from "../applets/mindmapper/mindmapperRouter";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Applet routes
router.use("/mindmapper", mindmapperRouter);
router.use("/mindmapper", mindmapperExtractRouter);

export default router;