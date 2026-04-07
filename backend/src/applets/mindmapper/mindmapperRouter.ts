import { Router } from "express";
import { extractGraph } from "./extract";
import {
  saveMindMap,
  getMindMap,
  getMergedGraph,
  mergeSelectedGraphs,
  deleteMindMap,
  createWorkspace,
  getWorkspaces,
  getMindMapsByWorkspace,
} from "./graph";
import { ExtractRequest, GraphEdge, GraphNode, MindMapRecord } from "./types";
import { processNewDocument } from "./processDocuments";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../../middlewares/auth";

const router = Router();
router.use(requireAuth);

// ── POST /api/mindmapper/workspace ──────────────────────────
router.post("/workspace", async (req, res) => {
  const userId = (req as any).userId;
  const { mindmapperId, name } = req.body;

  if (!mindmapperId || !name) {
    return res.status(400).json({ success: false, error: "Missing mindmapperId or name" });
  }

  try {
    const workspace = await createWorkspace(userId, mindmapperId, name);
    return res.status(200).json({ success: true, workspace });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

// ── GET /api/mindmapper/workspaces ───────────────────────────
router.get("/workspaces", async (req, res) => {
  const userId = (req as any).userId;
  try {
    const workspaces = await getWorkspaces(userId);
    return res.status(200).json({ success: true, workspaces });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

// ── POST /api/mindmapper/:mindmapperId/extract ───────────────
router.post("/:mindmapperId/extract", async (req, res) => {
  const userId = (req as any).userId;
  const { mindmapperId } = req.params;
  const { documentId, documentName, documentText, extractionPrompt, apiKey } = req.body;

  try {
    const graph = await extractGraph(documentText, extractionPrompt || "key concepts", apiKey);
    const record = await saveMindMap(
      userId, mindmapperId, documentId, documentName,
      graph, extractionPrompt || "key concepts", "completed"
    );
    return res.status(200).json({ success: true, documentId, graph, record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

// ── GET /api/mindmapper/:mindmapperId/documents ──────────────
router.get("/:mindmapperId/documents", async (req, res) => {
  const userId = (req as any).userId;
  const { mindmapperId } = req.params;
  try {
    const records = await getMindMapsByWorkspace(userId, mindmapperId);
    return res.status(200).json({ success: true, records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

// ── GET /api/mindmapper/:mindmapperId/merged ─────────────────
router.get("/:mindmapperId/merged", async (req, res) => {
  const userId = (req as any).userId;
  const { mindmapperId } = req.params;
  try {
    const graph = await getMergedGraph(userId, mindmapperId);
    return res.status(200).json({ success: true, graph });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

// ── POST /api/mindmapper/:mindmapperId/merge ─────────────────
router.post("/:mindmapperId/merge", async (req, res) => {
  const userId = (req as any).userId;
  const { mindmapperId } = req.params;
  const { documentIds, mergedName } = req.body;

  try {
    // getMindMap expects raw documentId — it builds the composite key internally
    const records = await Promise.all(
      documentIds.map((docId: string) => getMindMap(userId, mindmapperId, docId))
    );

    const validRecords = records.filter((r): r is MindMapRecord => !!r?.graph);
    if (validRecords.length === 0) {
      return res.status(400).json({ success: false, error: "No valid documents to merge" });
    }

    const mergedGraph = await mergeSelectedGraphs(validRecords);
    const mergedDocumentId = `merged-${uuidv4()}`;

    const record = await saveMindMap(
      userId,
      mindmapperId,
      mergedDocumentId,
      mergedName || "Merged Document",
      mergedGraph,
      "merged",
      "completed"
    );

    return res.status(200).json({ success: true, record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

// ── DELETE /api/mindmapper/:mindmapperId/documents/:documentId
// NOTE: route uses /documents/:documentId to avoid clashing with /:mindmapperId/merged etc.
router.delete("/:mindmapperId/documents/:documentId", async (req, res) => {
  const userId = (req as any).userId;
  const { mindmapperId, documentId } = req.params;
  
  console.log("DELETE request:", { userId, mindmapperId, documentId });
  console.log("Composite key will be:", `${mindmapperId}#${documentId}`);
  
  try {
    await deleteMindMap(userId, mindmapperId, documentId);
    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete failed:", message);
    return res.status(500).json({ success: false, error: message });
  }
});

// ── POST /api/mindmapper/s3-webhook ─────────────────────────
// objectKey format: mindmappers/{userId}/{mindmapperId}/{filename}.pdf
router.post("/s3-webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const { bucketName, objectKey } = req.body;
    const parts = objectKey.split("/");
    if (parts.length < 4) {
      console.error("Invalid S3 key format (expected mindmappers/userId/mindmapperId/file.pdf):", objectKey);
      return;
    }
    const userId = parts[1];
    const mindmapperId = parts[2];
    const fileName = parts[3];
    const documentId = fileName.replace(".pdf", "");

    processNewDocument(bucketName, objectKey, userId, mindmapperId, documentId).catch(console.error);
  } catch (err) {
    console.error("Webhook error:", err);
  }
});

export default router;