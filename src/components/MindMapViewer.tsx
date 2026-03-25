// ─────────────────────────────────────────────
// MindMapViewer.tsx
// Renders a MindMap as an interactive graph using React Flow
// Place in: src/components/MindMapViewer.tsx
// ─────────────────────────────────────────────

import { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { MindMap, GraphNode } from "../../backend/src/applets/mindmapper/types";

interface MindMapViewerProps {
  graph: MindMap;
  documentName?: string;
}

// Colour by node type
const TYPE_COLORS: Record<string, string> = {
  concept: "#3b82f6",
  person:  "#f59e0b",
  event:   "#10b981",
  place:   "#8b5cf6",
  other:   "#6b7280",
};

function buildLayout(graphNodes: GraphNode[]): Node[] {
  const total = graphNodes.length;
  const cols = Math.ceil(Math.sqrt(total));
  const spacing = 160;

  return graphNodes.map((n, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    // Add some randomness so it doesn't look like a grid
    const jitterX = (Math.random() - 0.5) * 40;
    const jitterY = (Math.random() - 0.5) * 40;
    return {
      id: n.id,
      data: { label: n.label, text: n.text, type: n.type || "other" },
      position: {
        x: col * spacing + jitterX,
        y: row * spacing + jitterY,
      },
      style: {
        background: TYPE_COLORS[n.type || "other"],
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        width: 80,
        height: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: 600,
        textAlign: "center" as const,
        padding: "6px",
        cursor: "pointer",
      },
    };
  });
}

export default function MindMapViewer({ graph, documentName }: MindMapViewerProps) {
  const initialNodes = buildLayout(graph.nodes);
  const initialEdges: Edge[] = graph.edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    label: e.relationship,
    labelStyle: { fontSize: 10, fill: "#374151" },
    labelBgStyle: { fill: "#f9fafb", opacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#9ca3af" },
    style: { stroke: "#9ca3af", strokeWidth: 1.5 },
    animated: false,
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sidebar: show node details on click
  const [selected, setSelected] = useState<{ label: string; text: string; type: string } | null>(null);
  const [search, setSearch] = useState("");

  const onNodeClick: NodeMouseHandler = useCallback((_evt, node) => {
    setSelected({
      label: node.data.label,
      text: node.data.text,
      type: node.data.type,
    });
  }, []);

  // Search: highlight matching nodes
  const filteredNodeIds = search.trim()
    ? nodes
        .filter((n) =>
          n.data.label.toLowerCase().includes(search.toLowerCase()) ||
          n.data.text?.toLowerCase().includes(search.toLowerCase())
        )
        .map((n) => n.id)
    : [];

  const styledNodes = nodes.map((n) => ({
    ...n,
    style: {
      ...n.style,
      opacity:
        filteredNodeIds.length === 0 || filteredNodeIds.includes(n.id) ? 1 : 0.2,
      boxShadow:
        filteredNodeIds.includes(n.id) ? "0 0 0 3px #fbbf24" : undefined,
    },
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          background: "#1e293b",
          color: "#f8fafc",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          🧠 {documentName || "Mind Map"}
        </span>
        <input
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            marginLeft: "auto",
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid #475569",
            background: "#334155",
            color: "#f8fafc",
            fontSize: 13,
            width: 200,
          }}
        />
      </div>

      {/* Main: graph + sidebar */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Graph */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={styledNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={(n) => TYPE_COLORS[n.data?.type || "other"]}
              style={{ background: "#f1f5f9" }}
            />
          </ReactFlow>
        </div>

        {/* Sidebar: node detail */}
        {selected && (
          <div
            style={{
              width: 260,
              background: "#f8fafc",
              borderLeft: "1px solid #e2e8f0",
              padding: 16,
              overflow: "auto",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                {selected.label}
              </span>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
              >
                ×
              </button>
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: 6,
                padding: "2px 8px",
                borderRadius: 99,
                background: TYPE_COLORS[selected.type],
                color: "#fff",
                fontSize: 11,
              }}
            >
              {selected.type}
            </span>
            <p style={{ marginTop: 12, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
              {selected.text || "No excerpt available."}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          padding: "8px 16px",
          background: "#f1f5f9",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          gap: 16,
          flexShrink: 0,
        }}
      >
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}