import { Router } from "express";
import { exportGraphToNotion } from "./exportToNotion";
import { extractGraph } from "./extract";
import { saveMindMap, getMindMap, getAllMindMaps, getMergedGraph } from "./graph";
import { ExtractRequest } from "./types";
import axios from "axios";

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

// Notion OAuth setup endpoint
router.get("/notion-auth-url", (req, res) => {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return res.status(500).json({ success: false, error: "Notion OAuth not configured on server" });
  }
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return res.status(200).json({ success: true, authUrl });
});

// Notion OAuth token exchange
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
    // If it's an AxiosError, we can extract more details
    const message = axios.isAxiosError(err) && err.response?.data?.error
      ? err.response.data.error
      : err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ success: false, error: `Failed to fetch token: ${message}` });
  }
});

// Export graph to Notion
router.post("/export-notion", async (req, res) => {
  const { userId, documentId, documentName, graph, notionApiKey, exportPrompt } = req.body;
  if (!userId || !documentId || !documentName || !graph || !notionApiKey) {
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