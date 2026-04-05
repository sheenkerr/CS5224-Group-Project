import { Router } from "express";
import { extractGraph } from "./extract";
import {
  saveMindMap,
  getMindMap,
  getAllMindMaps,
  getMergedGraph,
  mergeSelectedGraphs,
  deleteMindMap,
} from "./graph";
import { ExtractRequest, GraphEdge, GraphNode, MindMapRecord } from "./types";
import { processNewDocument } from "./processDocuments";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../../middlewares/auth";


const router = Router();

router.use(requireAuth);

/**
 * Manual extraction (synchronous)
 */
router.post("/extract", async (req, res) => {
  const userId = (req as any).userId;
  const {
    documentId,
    documentName,
    documentText,
    extractionPrompt,
    apiKey,
  }: ExtractRequest = req.body;

  if (!userId || !documentId || !documentName || !documentText) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields.",
    });
  }

  console.log("EXTRACT userId:", userId);

  try {
    const graph = await extractGraph(
      documentText,
      extractionPrompt || "key concepts",
      apiKey
    );

    await saveMindMap(
      userId,
      documentId,
      documentName,
      graph,
      extractionPrompt || "key concepts",
      "completed" // ✅ FIXED
    );

    

    return res.status(200).json({
      success: true,
      documentId,
      graph,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});


router.post("/merge", async (req, res) => {
  const userId = (req as any).userId;
  const { documentIds, mergedName }: { documentIds: string[]; mergedName?: string } = req.body;

  if (!userId || !documentIds?.length) {
    return res.status(400).json({ success: false, error: "Missing userId or documentIds" });
  }

  try {
    // Fetch only selected documents
    const records: (MindMapRecord | null)[] = await Promise.all(
      documentIds.map((id: string) => getMindMap(userId, id))
    );

    const validRecords = records.filter(r => r?.graph) as MindMapRecord[];

    // Merge using LLM
    const mergedGraph = await mergeSelectedGraphs(validRecords);
    const mergedDocumentId = `merged-${uuidv4()}`;
    const finalName = mergedName || "Merged Document";

    // Save and get full record
    const mergedRecord: MindMapRecord = await saveMindMap(
      userId,
      mergedDocumentId,
      finalName,
      mergedGraph,
      "merged nodes",
      "completed"
    );

    // ✅ Return the full merged record
    return res.status(200).json({
      success: true,
      record: mergedRecord,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get merged graph (only completed docs are used internally)
 */
router.get("/merged", async (req, res) => {
  const userId = (req as any).userId;

  try {
    const graph = await getMergedGraph(userId);
    return res.status(200).json({ success: true, graph });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

router.get("/", async (req, res) => {
  const userId = (req as any).userId;
//   console.log("GET ALL userId:", userId);

  try {
    const records = await getAllMindMaps(userId);

    return res.status(200).json({
      success: true,
      records,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get single document
 */
router.get("/:documentId", async (req, res) => {
    const userId = (req as any).userId;
  const { documentId } = req.params;

try {
    const record = await getMindMap(userId, documentId);

    if (!record) {
      return res.status(404).json({ success: false, error: "Not found." });
    }

    return res.status(200).json({ success: true, record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

/**
 * DELETE a single MindMap by documentId (DB only)
 */
router.delete("/:documentId", async (req, res) => {
  const userId = (req as any).userId;
  const { documentId } = req.params;

  if (!userId || !documentId) {
    return res.status(400).json({ success: false, error: "Missing userId or documentId" });
  }

  try {
    // Optional: check if document exists first
    const existing = await getMindMap(userId, documentId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    await deleteMindMap(userId, documentId);

    return res.status(200).json({ success: true, message: "Document deleted from DB" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

// /**
//  * Get all documents for a user
//  */
// router.get("/:userId", async (req, res) => {
//   try {
//     const records = await getAllMindMaps(req.params.userId);

//     return res.status(200).json({
//       success: true,
//       records,
//     });
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : "Unknown error";
//     return res.status(500).json({ success: false, error: message });
//   }
// });

/**
 * S3 webhook (async pipeline)
 */
router.post("/s3-webhook", async (req, res) => {
  res.sendStatus(200); // respond immediately

  try {
    const { bucketName, objectKey } = req.body;

    if (!bucketName || !objectKey) {
      console.error("Invalid webhook payload:", req.body);
      return;
    }

    /**
     * Expected format:
     * uploads/{userId}/{documentId}.pdf
     */
    const parts = objectKey.split("/");

    if (parts.length < 3) {
      console.error("Invalid S3 key format:", objectKey);
      return;
    }

    const userId = parts[1];
    const fileName = parts[2];
    const documentId = fileName.replace(".pdf", "");

    processNewDocument(
      bucketName,
      objectKey,
      userId,
      documentId
    ).catch(console.error);
  } catch (err) {
    console.error("Webhook error:", err);
  }
});

export default router;