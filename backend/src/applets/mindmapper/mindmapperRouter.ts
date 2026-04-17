import { Router } from "express";
import { exportGraphToNotion } from "./exportToNotion";
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
import {
  notifyMindmapCreated,
  notifyMindmapDeleted,
  notifyMindmapsMerged,
} from "./notifications";
import { MindMapRecord } from "./types";
import { processNewDocument } from "./processDocuments";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../../middlewares/auth";
import axios from "axios";

const router = Router();

// Internal callback used by the backend after a successful S3 upload.
// It cannot present a Clerk session, so it must remain outside requireAuth.
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

router.use(requireAuth);

router.get("/", async (req, res) => {
  res.status(200).send("Hello World");
});

// ── POST /api/mindmapper/workspace ──────────────────────────
router.post("/workspace", async (req, res) => {
  const userId = (req as any).userId;
  const { mindmapperId } = req.body;

  if (!mindmapperId) {
    return res.status(400).json({ success: false, error: "Missing mindmapperId or name" });
  }

  try {
    const workspace = await createWorkspace(userId, mindmapperId);
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
    await notifyMindmapCreated(userId, mindmapperId, documentName);
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
    await notifyMindmapsMerged(
      userId,
      mindmapperId,
      record.documentName,
      validRecords.length
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
    await notifyMindmapDeleted(userId, mindmapperId, documentId);
    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete failed:", message);
    return res.status(500).json({ success: false, error: message });
  }
});

/**
* AI Usage Declaration
*
* Tool Used: Gemini 3.1 Pro
*
* Prompt:
* - How may I develop a login with notion oAuth feature so users do not need to generate an API key to utilize export to notion?
*
* How the AI Output Was Used:
* - Used a portion of suggested code for the below
*/

// ── GET /api/mindmapper/notion-auth-url ─────────────────────
router.get("/notion-auth-url", (req, res) => {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;
  const state = req.query.state as string;
  if (!clientId || !redirectUri) {
    return res.status(500).json({ success: false, error: "Notion OAuth not configured on server" });
  }
  let authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;
  if (state) {
    authUrl += `&state=${encodeURIComponent(state)}`;
  }
  return res.status(200).json({ success: true, authUrl });
});

/**
* AI Usage Declaration
*
* Tool Used: Gemini 3.1 Pro
*
* Prompt:
* - How may I develop a login with notion oAuth feature so users do not need to generate an API key to utilize export to notion?
*
* How the AI Output Was Used:
* - Used a portion of suggested code for the below
*/

// ── POST /api/mindmapper/notion-token ───────────────────────
router.post("/notion-token", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: "Missing authorization code" });
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_SECRET_KEY;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ success: false, error: "Notion OAuth not configured on server" });
  }

  try {
    const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await axios.post("https://api.notion.com/v1/oauth/token", {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    }, {
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        "Content-Type": "application/json"
      }
    });

    const access_token = response.data.access_token;
    return res.status(200).json({ success: true, access_token });
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) && err.response?.data?.error
      ? err.response.data.error
      : err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: `Failed to fetch token: ${message}` });
  }
});

/**
* AI Usage Declaration
*
* Tool Used: Gemini 3.1 Pro
*
* Prompt:
* - How may I develop a login with notion oAuth feature so users do not need to generate an API key to utilize export to notion?
*
* How the AI Output Was Used:
* - Used a portion of suggested code for the below
*/

// ── POST /api/mindmapper/export-notion ──────────────────────
router.post("/export-notion", async (req, res) => {
  const { documentId, documentName, graph, notionApiKey, exportPrompt } = req.body;
  if (!documentId || !documentName || !graph || !notionApiKey) {
    return res.status(400).json({ success: false, error: "Missing required fields for Notion export." });
  }
  try {
    const pageId = await exportGraphToNotion(graph, documentName, notionApiKey, exportPrompt);
    return res.status(200).json({ success: true, pageId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
});

export default router;
