// ─────────────────────────────────────────────
// MindMapPage.tsx
// Full page: paste document → extract → view graph
// Place in: src/pages/MindMapPage.tsx
// ─────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import MindMapViewer from "../components/MindMapViewer";
import { MindMap } from "../../backend/src/applets/mindmapper/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4001";

interface MindMapPageProps {
  prefillText?: string;      // document text from Google Drive
  prefillName?: string;      // document name from Google Drive
}

export default function MindMapPage({ prefillText, prefillName }: MindMapPageProps) {
  const [documentText, setDocumentText] = useState(prefillText || "");
  const [documentName, setDocumentName] = useState(prefillName || "My Document");
  const [extractionPrompt, setExtractionPrompt] = useState("key concepts and how they relate to each other");
  const [exportPrompt, setExportPrompt] = useState("");
  const [userApiKey, setUserApiKey] = useState("");
  const [notionApiKey, setNotionApiKey] = useState("");

  // Result state
  const [graph, setGraph] = useState<MindMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"single" | "merged">("single");
  const [mergedGraph, setMergedGraph] = useState<MindMap | null>(null);

  const oauthCalled = useRef(false);

  // Handle Notion OAuth callback
  useEffect(() => {
    const savedText = localStorage.getItem("mindmap_documentText");
    const savedName = localStorage.getItem("mindmap_documentName");
    const savedExtPrompt = localStorage.getItem("mindmap_extractionPrompt");
    const savedExpPrompt = localStorage.getItem("mindmap_exportPrompt");

    if (savedText !== null && !documentText) setDocumentText(savedText);
    if (savedName !== null) setDocumentName(savedName);
    if (savedExtPrompt !== null) setExtractionPrompt(savedExtPrompt);
    if (savedExpPrompt !== null) setExportPrompt(savedExpPrompt);

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !oauthCalled.current) {
      oauthCalled.current = true;
      // Clear code from URL immediately to prevent strict-mode double fetch
      window.history.replaceState({}, document.title, window.location.pathname);

      setLoading(true);
      fetch(`${API_BASE}/api/mindmapper/notion-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.access_token) {
            setNotionApiKey(data.access_token);
            // Optionally clear localStorage now that we're back
            localStorage.removeItem("mindmap_documentText");
            localStorage.removeItem("mindmap_documentName");
            localStorage.removeItem("mindmap_extractionPrompt");
            localStorage.removeItem("mindmap_exportPrompt");
          } else {
            setError(data.error || "Failed to exchange Notion token");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleLoginWithNotion = async () => {
    try {
      setLoading(true);
      // Save state to restore after redirect
      localStorage.setItem("mindmap_documentText", documentText);
      localStorage.setItem("mindmap_documentName", documentName);
      localStorage.setItem("mindmap_extractionPrompt", extractionPrompt);
      localStorage.setItem("mindmap_exportPrompt", exportPrompt);

      const res = await fetch(`${API_BASE}/api/mindmapper/notion-auth-url`);
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || "Failed to get auth URL");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error initiating Notion OAuth");
      setLoading(false);
    }
  };

  const handleMergeView = async () => {
    const res = await fetch(`${API_BASE}/api/mindmapper/test-user/merged`);
    const data = await res.json();
    console.log("Merged response:", JSON.stringify(data, null, 2)); // add this
    setMergedGraph(data.graph);
    setViewMode("merged");
  };

  const handleExport = async () => {
    if (!graph) {
      setError("No graph to export.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/mindmapper/export-notion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "test-user",
          documentId: `doc-${Date.now()}`,
          documentName,
          graph,
          notionApiKey,
          exportPrompt,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Export failed.");
      alert(`Exported to Notion page ${data.pageId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export error.");
    } finally {
      setLoading(false);
    }
  };



  const handleExtract = async () => {
    if (!documentText.trim()) {
      setError("Please paste some document text first.");
      return;
    }
    setLoading(true);
    setError(null);
    setGraph(null);

    try {
      const res = await fetch(`${API_BASE}/api/mindmapper/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "test-user",           // replace with real auth userId later
          documentId: `doc-${Date.now()}`,
          documentName,
          documentText,
          extractionPrompt,
          apiKey: userApiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Extraction failed.");
      setGraph(data.graph);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", background: "#f8fafc" }}>
      {/* ── Left Panel: Input ── */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          background: "#1e293b",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          padding: 20,
          gap: 14,
          overflowY: "auto",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🧠 Mind Mapper</h2>
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
          Paste any document text and we'll extract a knowledge graph for you.
        </p>

        {/* ── Document extraction inputs ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Document name */}
          <label style={labelStyle}>
            Document Name
            <input
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Research Paper"
            />
          </label>

          {/* Extraction prompt */}
          <label style={labelStyle}>
            What to extract
            <input
              value={extractionPrompt}
              onChange={(e) => setExtractionPrompt(e.target.value)}
              style={inputStyle}
              placeholder="e.g. key concepts, authors, events..."
            />
          </label>

          {/* Document text */}
          <label style={labelStyle}>
            Document Text
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              style={{ ...inputStyle, height: 200, resize: "vertical" }}
              placeholder="Paste your document text here..."
            />
          </label>

          {/* Extract button */}
          <button
            onClick={handleExtract}
            disabled={loading}
            style={{
              padding: "12px",
              background: loading ? "#475569" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Extracting..." : "Extract Graph →"}
          </button>
        </div>

        {/* ── Notion Export Group ── */}
        <div
          style={{
            background: "#1e1b4b", // deep indigo background to hint at export/Notion
            border: "1px solid #4338ca",
            borderRadius: 8,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 8,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e0e7ff" }}>
              Export to Notion
            </h3>
          </div>

          {/**
           * AI Usage Declaration
           *
           * Tool Used: Gemini 3.1 Pro
           *
           * Prompt:
           * - How may I develop a login with notion oAuth feature so users do not need to generate an API key to utilize export to notion?
           *
           * How the AI Output Was Used:
           * - Used a portion of suggested code for the below
           */}
          {/* Notion Integration */}
          {notionApiKey ? (
            <div style={{ ...labelStyle, color: "#34d399", flexDirection: "row", alignItems: "center" }}>
              ✅ Connected to Notion
            </div>
          ) : (
            <button
              onClick={handleLoginWithNotion}
              disabled={loading}
              style={{
                padding: "8px",
                background: "#ffffff",
                color: "#000000",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                alt="Notion"
                style={{ width: 16, height: 16 }}
              />
              Login with Notion
            </button>
          )}

          {/* Export Prompt */}
          <label style={{ ...labelStyle, color: "#a5b4fc" }}>
            Export Instruction
            <input
              value={exportPrompt}
              onChange={(e) => setExportPrompt(e.target.value)}
              style={{ ...inputStyle, background: "#312e81", border: "1px solid #4f46e5" }}
              placeholder="e.g., Methods section"
            />
          </label>

          {/**
           * AI Usage Declaration
           *
           * Tool Used: Gemini 3.1 Pro
           *
           * Prompt:
           * - How may I develop a login with notion oAuth feature so users do not need to generate an API key to utilize export to notion?
           *
           * How the AI Output Was Used:
           * - Used a portion of suggested code for the below
           */}
          {/* Export to Notion button */}
          <button
            onClick={handleExport}
            disabled={loading || !graph || !notionApiKey}
            style={{
              padding: "12px",
              background: loading || !graph || !notionApiKey ? "#3730a3" : "#4f46e5",
              color: loading || !graph || !notionApiKey ? "#818cf8" : "#ffffff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: loading || !graph || !notionApiKey ? "not-allowed" : "pointer",
            }}
          >
            Export to Notion
          </button>
        </div>
        <button
          onClick={handleMergeView}
          style={{
            padding: "12px",
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          🔗 View All Docs Merged
        </button>

        {/* Toggle back to single view */}
        {viewMode === "merged" && (
          <button
            onClick={() => setViewMode("single")}
            style={{
              padding: "8px",
              background: "none",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ← Back to single doc view
          </button>
        )}
        {/* Error */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 6, fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Stats */}
        {graph && (
          <div style={{ background: "#0f172a", padding: 10, borderRadius: 6, fontSize: 12, color: "#94a3b8" }}>
            ✅ <strong style={{ color: "#f8fafc" }}>{graph.nodes.length} nodes</strong> and{" "}
            <strong style={{ color: "#f8fafc" }}>{graph.edges.length} edges</strong> extracted.
          </div>
        )}
      </div>

      {/* ── Right Panel: Graph ── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {graph || mergedGraph ? (
          <MindMapViewer
            key={viewMode === "merged" ? "merged" : graph?.nodes[0]?.id}
            graph={viewMode === "merged" && mergedGraph ? mergedGraph : graph!}
            documentName={viewMode === "merged" ? "All Documents — Merged View" : documentName}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 48 }}>🗺️</span>
            <p style={{ fontSize: 16, margin: 0 }}>
              Paste a document on the left and click <strong>Extract Graph</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
  fontSize: 12,
  color: "#cbd5e1",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: 13,
  fontFamily: "sans-serif",
};