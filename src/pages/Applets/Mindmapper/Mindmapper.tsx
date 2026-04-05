import React, { useState, useEffect } from "react";
import Navigation from "../../../components/Navigation";
import MindmapperSetup from "./MindmapperSetup";
import MindMapViewer from "../../../components/MindMapViewer";
import MindMapDocumentTable from "../../../components/MindMapDocumentTable";
import { MindMap, MindMapRecord } from "../../../../backend/src/applets/mindmapper/types"
import { useApi } from "../../../utils/api";

type MindmapperProps = {
  isSetup: boolean;
};

function Mindmapper({ isSetup = false }: MindmapperProps): React.ReactElement {
  const { apiFetch } = useApi();

  const [stage, setStage] = useState(0);

  const [tab, setTab] = useState<"extract" | "documents">("documents");

  const [extractText, setExtractText] = useState("");
  const [extractName, setExtractName] = useState("My Document");
  const [extractionPrompt, setExtractionPrompt] = useState("key concepts and how they relate to each other");

  const [graph, setGraph] = useState<MindMap | null>(null);
  const [mergedGraph, setMergedGraph] = useState<MindMap | null>(null);
  const [viewMode, setViewMode] = useState<"single" | "merged">("single");
  const [activeDocumentName, setActiveDocumentName] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) setStage(1);
  }, []);

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
          documentName: extractName,
          documentText: extractText,
          extractionPrompt,
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

  const handleMergeSelected = async (records: MindMapRecord[]): Promise<MindMapRecord | null> => {
    if (!records.length) return null;
    const documentIds = records.map((r) => r.documentId);
    const mergedName = records.map((r) => r.documentName).join(" + ") + " merged";
    const res = await apiFetch("/api/mindmapper/merge", {
      method: "POST",
      body: JSON.stringify({ documentIds, mergedName }),
    });
    const data = await res.json();
    if (data.success && data.record) {
      setMergedGraph(data.record.graph);
      setViewMode("merged");
      setActiveDocumentName(data.record.documentName);
      return data.record;
    }
    return null;
  };

  const MindMapUI = (
    <div className="flex gap-6" style={{ height: "calc(100vh - 140px)" }}>
      {/* ── Left Panel ── */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">🧠 Mind Mapper</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Paste any document text and we'll extract a knowledge graph for you.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("documents")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === "documents"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            📄 Documents
          </button>
          <button
            onClick={() => setTab("extract")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === "extract"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
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
              const mergedRecord = await handleMergeSelected(records);
              if (mergedRecord?.documentId) {
                setActiveDocumentName(mergedRecord.documentName);
              }
              return mergedRecord;
            }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Document Name</span>
              <input
                value={extractName}
                onChange={(e) => setExtractName(e.target.value)}
                placeholder="e.g. Research Paper"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">What to extract</span>
              <input
                value={extractionPrompt}
                onChange={(e) => setExtractionPrompt(e.target.value)}
                placeholder="e.g. key concepts, authors, events..."
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Document Text</span>
              <textarea
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                placeholder="Paste your document text here..."
                rows={8}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <button
              onClick={handleExtract}
              disabled={loading}
              className={`py-3 rounded-lg text-white font-bold text-sm transition-colors ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              {loading ? "Extracting..." : "Extract Graph →"}
            </button>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {graph && (
              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                ✅ <strong className="text-gray-900 dark:text-white">{graph.nodes.length} nodes</strong> and{" "}
                <strong className="text-gray-900 dark:text-white">{graph.edges.length} edges</strong> extracted.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right Panel: Graph ── */}
      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
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
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-3">
            <span className="text-5xl">🗺️</span>
            <p className="text-base">
              Paste a document on the left and click <strong>Extract Graph</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent dark:bg-linear-to-br dark:from-[#0f0f1a] dark:to-[#16213e] font-sans transition-colors">
      <Navigation />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {isSetup ? <MindmapperSetup stage={stage} /> : MindMapUI}
      </main>
    </div>
  );
}

export default Mindmapper;