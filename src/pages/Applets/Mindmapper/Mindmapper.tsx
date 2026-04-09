import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../../../components/Navigation";
import MindmapperSetup from "./MindmapperSetup";
import MindMapViewer from "../../../components/MindMapViewer";
import MindMapDocumentTable from "../../../components/MindMapDocumentTable";
import { MindMap, MindMapRecord } from "../../../../backend/src/applets/mindmapper/types"
import { useApi } from "../../../utils/api";

const NotionExportPanel = ({
  notionApiKey,
  notionLoading,
  onLogin,
  onExport,
  disabled
}: {
  notionApiKey: string | null;
  notionLoading: boolean;
  onLogin: () => void;
  onExport: () => void;
  disabled: boolean;
}) => (
  <div className="flex flex-col gap-3 mt-4 p-4 border border-gray-200 dark:border-gray-700/50 rounded-xl bg-gray-50 dark:bg-gray-800/30">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <span className="text-lg">📓</span> Export to Notion
    </h3>
    {!notionApiKey ? (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Connect your Notion account to export your active knowledge graph into a new page.
        </p>
        <button
          onClick={onLogin}
          className="w-full py-2 rounded-lg text-sm font-semibold transition-colors bg-white border border-gray-300 hover:bg-gray-100 text-black dark:bg-black dark:border-gray-600 dark:hover:bg-gray-900 dark:text-white cursor-pointer"
        >
          Login with Notion
        </button>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Connected to Notion
        </div>
        {!disabled && (
          <button
            onClick={onExport}
            disabled={notionLoading}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${notionLoading
                ? "bg-indigo-900/40 text-indigo-300/50 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              }`}
          >
            {notionLoading ? "Exporting..." : "Export Flow to Notion"}
          </button>
        )}
      </div>
    )}
  </div>
);

type MindmapperProps = {
  isSetup: boolean;
};

function Mindmapper({ isSetup = false }: MindmapperProps): React.ReactElement {
  const { mindmapperId } = useParams<{ mindmapperId: string }>();
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

    React.useEffect(() => {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const success = params.get('success');
        if (success == "true") {
            setStage(1);
        }
    }, []);
  const [notionApiKey, setNotionApiKey] = useState<string | null>(null);
  const [notionLoading, setNotionLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) setStage(1);

    const code = params.get("code");
    if (code) {
      const fetchToken = async () => {
        try {
          const res = await apiFetch(`/api/mindmapper/notion-token`, {
            method: "POST",
            body: JSON.stringify({ code }),
          });
          const data = await res.json();
          if (data.success) {
            setNotionApiKey(data.access_token);
            const url = new URL(window.location.href);
            url.searchParams.delete("code");
            url.searchParams.delete("state");
            window.history.replaceState({}, document.title, url.pathname);
          } else {
            console.error("Failed to fetch Notion token:", data.error);
          }
        } catch (err) {
          console.error("Notion token error:", err);
        }
      };
      fetchToken();
    }
  }, [apiFetch, stage]);

  const handleExtract = async () => {
    if (!extractText.trim()) {
      setError("Please paste some document text first.");
      return;
    }
    setLoading(true);
    setError(null);
    setGraph(null);
    try {
      const res = await apiFetch(`/api/mindmapper/${mindmapperId}/extract`, {
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
    const res = await apiFetch(`/api/mindmapper/${mindmapperId}/merge`, {
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

  const handleNotionLogin = async () => {
    try {
      const res = await apiFetch(`/api/mindmapper/notion-auth-url?state=${encodeURIComponent(`ws-${mindmapperId || ""}`)}`);
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Failed to fetch Notion auth URL", err);
    }
  };

  const handleNotionExport = async () => {
    const activeGraph = viewMode === "merged" ? mergedGraph : graph;
    if (!activeGraph || !notionApiKey) return;

    setNotionLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/mindmapper/export-notion`, {
        method: "POST",
        body: JSON.stringify({
          documentId: `doc-${Date.now()}`,
          documentName: viewMode === "merged" ? "All Documents Merged" : (activeDocumentName || extractName),
          graph: activeGraph,
          notionApiKey,
          exportPrompt: "Exported from Mindmapper"
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      alert("Successfully exported to Notion!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Notion export failed");
    } finally {
      setNotionLoading(false);
    }
  };

  const MindMapUI = (
    <div className="flex gap-6" style={{ height: "calc(100vh - 140px)" }}>
      {/* ── Left Panel ── */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">🧠 Mind Mapper ({mindmapperId})</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Paste any document text and we'll extract a knowledge graph for you.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("documents")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "documents"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            📄 Documents
          </button>
          <button
            onClick={() => setTab("extract")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "extract"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            ✏️ Extract
          </button>
        </div>

        {mindmapperId && tab === "documents" ? (
          <MindMapDocumentTable
            tab={tab}
            mindmapperId={mindmapperId}
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
              className={`py-3 rounded-lg text-white font-bold text-sm transition-colors ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
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

        {tab === "documents" && (
          <div className="mt-auto pt-2 pb-6">
            <NotionExportPanel
              notionApiKey={notionApiKey}
              notionLoading={notionLoading}
              onLogin={handleNotionLogin}
              onExport={handleNotionExport}
              disabled={!(viewMode === "merged" ? mergedGraph : graph)}
            />
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