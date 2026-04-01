import { Router } from "express";
import mindmapperRouter from "../applets/mindmapper/handler";
import userDataRouter from "./user-data";
import mindmapperExtractRouter from "../applets/mindmapper/mindmapperRouter";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Applet routes
router.use("/mindmapper", mindmapperRouter);
router.use("/mindmapper", mindmapperExtractRouter);

// Database queries for user
router.use("/user", userDataRouter);

export default router;
