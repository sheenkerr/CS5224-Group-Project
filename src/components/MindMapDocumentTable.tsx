import { useState, useEffect } from "react";
import { MindMapRecord } from "../../backend/src/applets/mindmapper/types";
import { useApi } from "../utils/api";


const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4001";

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
    if (isInitial) setLoading(true); // ONLY for first load

    try {
        const res = await apiFetch(`/api/mindmapper?mindmapperId=${mindmapperId}`);
        const data = await res.json();

        if (data.success) {
        setRecords(prev => {
            // prevent unnecessary re-renders if data hasn't changed
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

  // Poll for new documents every 10 seconds
    useEffect(() => {
    if (tab === "documents") {
        fetchRecords(true); // initial load

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

  if (loading) return <div style={{ padding: 20, color: "#94a3b8" }}>Loading documents...</div>;

  const filteredRecords = records.filter(r =>
  r.documentName.toLowerCase().includes(searchQuery.toLowerCase())
);

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>
            📄 Your Documents ({filteredRecords.length})
          </h3>

          {selected.size >= 2 && (
  <button
    onClick={async () => {
      // Call onViewMerged with selected records, expect a single merged record back
      const mergedRecord = await onViewMerged(selectedRecords);

      // Clear old selections
      setSelected(new Set());

      // Highlight new merged doc
      if (mergedRecord?.documentId) {
        setActiveDocumentId(mergedRecord.documentId);
      }

      // Refresh document list
      await fetchRecords();
    }}
    style={{
      padding: "6px 12px",
      background: "#7c3aed",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
    }}
  >
    🔗 Merge {selected.size} docs
  </button>
)}
        </div>

        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #334155",
            background: "#020617",
            color: "#f8fafc",
            fontSize: 12,
          }}
        />
      </div>

      {/* Body */}
      {records.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 12 }}>
          No documents yet. Upload a file to Google Drive to get started!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredRecords.map(record => {
            const isActive =
              selected.has(record.documentId) ||
              activeDocumentId === record.documentId;

            return (
              <div
                key={record.documentId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: isActive ? "#1e3a5f" : "#0f172a",
                  borderRadius: 8,
                  border: `1px solid ${isActive ? "#3b82f6" : "#1e293b"}`,
                  cursor: "pointer",
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(record.documentId)}
                  onChange={() => toggleSelect(record.documentId)}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Info */}
                <div
                  style={{ flex: 1 }}
                  onClick={() => {
                    setActiveDocumentId(record.documentId);
                    onViewSingle(record);
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                    {record.documentName}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {record.graph ? (
                      <>
                        {record.graph.nodes.length} nodes · {record.graph.edges.length} edges ·{" "}
                        {new Date(record.createdAt).toLocaleDateString()}
                      </>
                    ) : (
                      <span>Processing…</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDocumentId(record.documentId);
                      onViewSingle(record);
                    }}
                    style={{
                      padding: "4px 10px",
                      background: "#1d4ed8",
                      color: "#fff",
                      border: "none",
                      borderRadius: 5,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
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
                        const res = await apiFetch(`/api/mindmapper/${mindmapperId}/${record.documentId}`, {
                            method: "DELETE",
                        });
                        const data = await res.json();

                        if (data.success) {
                            alert(`Deleted "${record.documentName}" successfully.`);
                            fetchRecords();
                        } else {
                            alert(`Failed to delete: ${data.error}`);
                        }
                        } catch (err) {
                        console.error(err);
                        alert("Something went wrong while deleting.");
                        }
                    }}
                    style={{
                        padding: "4px 8px",
                        background: "#dc2626",
                        border: "none",
                        borderRadius: 5,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 16 16"
                    style={{ fill: "#FFFFFF" }}>
                    <path d="M 6.496094 1 C 5.675781 1 5 1.675781 5 2.496094 L 5 3 L 2 3 L 2 4 L 3 4 L 3 12.5 C 3 13.328125 3.671875 14 4.5 14 L 10.5 14 C 11.328125 14 12 13.328125 12 12.5 L 12 4 L 13 4 L 13 3 L 10 3 L 10 2.496094 C 10 1.675781 9.324219 1 8.503906 1 Z M 6.496094 2 L 8.503906 2 C 8.785156 2 9 2.214844 9 2.496094 L 9 3 L 6 3 L 6 2.496094 C 6 2.214844 6.214844 2 6.496094 2 Z M 5 5 L 6 5 L 6 12 L 5 12 Z M 7 5 L 8 5 L 8 12 L 7 12 Z M 9 5 L 10 5 L 10 12 L 9 12 Z"></path>
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