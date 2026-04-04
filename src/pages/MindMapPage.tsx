// ─────────────────────────────────────────────
// MindMapPage.tsx
// Full page: paste document → extract → view graph
// Place in: src/pages/MindMapPage.tsx
// ─────────────────────────────────────────────

import { useState } from "react";
import MindMapViewer from "../components/MindMapViewer";
import { MindMap, MindMapRecord } from "../../backend/src/applets/mindmapper/types";
import MindMapDocumentTable from "../components/MindMapDocumentTable";
import { useApi } from "../utils/api";


const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface MindMapPageProps {
  prefillText?: string;      // document text from Google Drive
  prefillName?: string;      // document name from Google Drive
}

export default function MindMapPage({ prefillText, prefillName }: MindMapPageProps) {
  const { apiFetch } = useApi();
  // Extract tab state (independent)
  const [extractText, setExtractText] = useState(prefillText || "");
  const [extractName, setExtractName] = useState(prefillName || "My Document");

  // View state (for documents tab)
  const [activeDocumentName, setActiveDocumentName] = useState<string | null>(null);
  const [extractionPrompt, setExtractionPrompt] = useState("key concepts and how they relate to each other");
  const [userApiKey, setUserApiKey]           = useState("");

  // Result state
  const [graph, setGraph]     = useState<MindMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"single" | "merged">("single");
  const [mergedGraph, setMergedGraph] = useState<MindMap | null>(null);
  const [tab, setTab] = useState<"extract" | "documents">("documents");

  const handleMergeView = async () => {
    const res = await apiFetch("/api/mindmapper/merged");
    const data = await res.json();
    console.log("Merged response:", JSON.stringify(data, null, 2)); 
    setMergedGraph(data.graph);
    setViewMode("merged");
  };

  const handleExtract = async () => {
    if (!extractText.trim()) {
      setError("Please paste some document text first.");
      return;
    }
    setLoading(true);
    setError(null);
    setGraph(null);

    try {
      const res = await apiFetch("/api/mindmapper/extract", {
        method: "POST",
        body: JSON.stringify({
          documentId: `doc-${Date.now()}`,
          extractName,
          extractText,
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

  const handleMergeSelected = async (records: MindMapRecord[]) => {
    const documentIds = records.map(r => r.documentId);
    const mergedName =
      records.map(r => r.documentName).join(" + ") + " merged";

    const res = await apiFetch("/api/mindmapper/merge", {
      method: "POST",
      body: JSON.stringify({ documentIds, mergedName }),
    });

    const data = await res.json();

    if (data.success) {
      setMergedGraph(data.graph);
      setViewMode("merged");
    }
  };

  function mergeRecordsClientSide(records: MindMapRecord[]): MindMap {
  const nodes = records.flatMap(r =>
    r.graph!.nodes.map(n => ({ ...n, id: `${r.documentId}_${n.id}`, text: `[${r.documentName}] ${n.text}` }))
  );
  const edges = records.flatMap(r =>
    r.graph!.edges.map(e => ({
      ...e,
      source: `${r.documentId}_${e.source}`,
      target: `${r.documentId}_${e.target}`,
    }))
  );
  return { nodes, edges };
}

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

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setTab("documents")}
            style={{
              flex: 1,
              padding: "6px",
              background: tab === "documents" ? "#3b82f6" : "#334155",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📄 Documents
          </button>
          <button
            onClick={() => setTab("extract")}
            style={{
              flex: 1,
              padding: "6px",
              background: tab === "extract" ? "#3b82f6" : "#334155",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ✏️ Extract
          </button>
        </div>

      {tab === "documents" ? (
  <MindMapDocumentTable
    tab={tab}
    onViewSingle={(record) => {
      setMergedGraph(null);
      setGraph(record.graph!);
      setActiveDocumentName(record.documentName);
      setViewMode("single");
    }}
    onViewMerged={async (records) => {
     await handleMergeSelected(records);
    setViewMode("merged");
  }}
  />
) : (
  <>
  {/* Document name */}
        <label style={labelStyle}>
          Document Name
          <input
            value={extractName}
            onChange={(e) => setExtractName(e.target.value)}
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
            value={extractText}
            onChange={(e) => setExtractText(e.target.value)}
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
        {/* <button
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
</button> */}

{/* Toggle back to single view
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
)} */}
        {/* Error */}
        {error && (
          <div style={{ background: "#323232", color: "#991b1b", padding: 10, borderRadius: 6, fontSize: 12 }}>
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
    </>
    )}
  </div>

      {/* ── Right Panel: Graph ── */}
  <div style={{ flex: 1, overflow: "hidden" }}>
    {graph || mergedGraph ? (
      <MindMapViewer
    key={
      viewMode === "merged"
        ? "merged"
        : `${activeDocumentName || extractName}-${graph?.nodes.length}`
    }
    graph={viewMode === "merged" && mergedGraph ? mergedGraph : graph!}
    documentName={
    viewMode === "merged"
      ? "All Documents — Merged View"
      : activeDocumentName || extractName
    }
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