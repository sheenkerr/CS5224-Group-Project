import { Router } from "express";
import { extractGraph } from "./extract";
import { saveMindMap, getMindMap, getAllMindMaps, getMergedGraph } from "./graph";
import { ExtractRequest } from "./types";

const router = Router();

router.post("/extract", async (req, res) => {
  const { userId, documentId, documentName, documentText, extractionPrompt, apiKey }: ExtractRequest = req.body;
  if (!userId || !documentId || !documentName || !documentText) {
    return res.status(400).json({ success: false, error: "Missing required fields." });
  }
  try {
    const graph = await extractGraph(documentText, extractionPrompt || "key concepts", apiKey);
    await saveMindMap(userId, documentId, documentName, graph, extractionPrompt || "key concepts");
    return res.status(200).json({ success: true, documentId, graph });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

router.get("/:userId/merged", async (req, res) => {
  try {
    const graph = await getMergedGraph(req.params.userId);
    return res.status(200).json({ success: true, graph });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

router.get("/:userId/:documentId", async (req, res) => {
  try {
    const record = await getMindMap(req.params.userId, req.params.documentId);
    if (!record) return res.status(404).json({ success: false, error: "Not found." });
    return res.status(200).json({ success: true, record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const records = await getAllMindMaps(req.params.userId);
    return res.status(200).json({ success: true, records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

export default router;