import { useState, useEffect } from "react";
import { MindMapRecord } from "../../backend/src/applets/mindmapper/types";
import { useApi } from "../utils/api";

interface Props {
  tab: "extract" | "documents";
  mindmapperId: string;
  onViewSingle: (record: MindMapRecord) => void;
  onViewMerged: (records: MindMapRecord[]) => Promise<MindMapRecord | null>;
}

export default function MindMapDocumentTable({ tab, mindmapperId, onViewSingle, onViewMerged }: Props) {
  const { apiFetch } = useApi();
  const [records, setRecords] = useState<MindMapRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  const fetchRecords = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await apiFetch(`/api/mindmapper/${mindmapperId}/documents`);
      const data = await res.json();
      if (data.success) {
        setRecords(prev => {
          const same = JSON.stringify(prev) === JSON.stringify(data.records);
          return same ? prev : data.records;
        });
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "documents") {
      fetchRecords(true);
      const interval = setInterval(() => fetchRecords(false), 10000);
      return () => clearInterval(interval);
    }
  }, [tab]);

  const toggleSelect = (documentId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(documentId) ? next.delete(documentId) : next.add(documentId);
      return next;
    });
  };

  const selectedRecords = records.filter(r => selected.has(r.documentId));
  const filteredRecords = records.filter(r =>
    r.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center animate-pulse">
        Loading documents...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            📄 Your Documents ({filteredRecords.length})
          </h3>

          {selected.size >= 2 && (
            <button
              onClick={async () => {
                const mergedRecord = await onViewMerged(selectedRecords);
                setSelected(new Set());
                if (mergedRecord?.documentId) {
                  setActiveDocumentId(mergedRecord.documentId);
                }
                await fetchRecords();
              }}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              🔗 Merge {selected.size} docs
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Body */}
      {records.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-3xl block mb-2">📂</span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No documents yet. Upload a file to Google Drive to get started!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredRecords.map(record => {
            const isActive =
              selected.has(record.documentId) ||
              activeDocumentId === record.documentId;

            return (
              <div
                key={record.documentId}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer
                  ${isActive
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(record.documentId)}
                  onChange={() => toggleSelect(record.documentId)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded accent-blue-600 cursor-pointer flex-shrink-0"
                />

                {/* Info */}
                <div
                  className="flex-1 min-w-0"
                  onClick={() => {
                    setActiveDocumentId(record.documentId);
                    onViewSingle(record);
                  }}
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {record.documentName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {record.graph ? (
                      <>
                        {record.graph.nodes.length} nodes · {record.graph.edges.length} edges ·{" "}
                        {new Date(record.createdAt).toLocaleDateString()}
                      </>
                    ) : (
                      <span className="text-amber-500 dark:text-amber-400">⏳ Processing…</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDocumentId(record.documentId);
                      onViewSingle(record);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors cursor-pointer"
                  >
                    View
                  </button>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = window.confirm(
                        `Are you sure you want to delete "${record.documentName}"? This cannot be undone.`
                      );
                      if (!confirmed) return;
                      try {
                        // ✅ matches DELETE /:mindmapperId/documents/:documentId
                        const res = await apiFetch(
                          `/api/mindmapper/${mindmapperId}/documents/${record.documentId}`,
                          { method: "DELETE" }
                        );
                        const data = await res.json();
                        if (data.success) {
                          fetchRecords();
                        } else {
                          alert(`Failed to delete: ${data.error}`);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Something went wrong while deleting.");
                      }
                    }}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="white">
                      <path d="M 6.496094 1 C 5.675781 1 5 1.675781 5 2.496094 L 5 3 L 2 3 L 2 4 L 3 4 L 3 12.5 C 3 13.328125 3.671875 14 4.5 14 L 10.5 14 C 11.328125 14 12 13.328125 12 12.5 L 12 4 L 13 4 L 13 3 L 10 3 L 10 2.496094 C 10 1.675781 9.324219 1 8.503906 1 Z M 6.496094 2 L 8.503906 2 C 8.785156 2 9 2.214844 9 2.496094 L 9 3 L 6 3 L 6 2.496094 C 6 2.214844 6.214844 2 6.496094 2 Z M 5 5 L 6 5 L 6 12 L 5 12 Z M 7 5 L 8 5 L 8 12 L 7 12 Z M 9 5 L 10 5 L 10 12 L 9 12 Z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}