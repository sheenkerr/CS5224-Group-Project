import { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { GraphNode, MindMap } from "../../backend/src/applets/mindmapper/types";


interface MindMapViewerProps {
  graph: MindMap;
  documentName?: string;
}

const TYPE_COLORS: Record<string, string> = {
  concept: "#3b82f6",
  person:  "#f97316",
  event:   "#a78bfa",
  place:   "#34d399",
  other:   "#64748b",
};

function buildLayout(graphNodes: GraphNode[]): Node[] {
  const total = graphNodes.length;
  const cols = Math.ceil(Math.sqrt(total));
  const spacing = 160;

  return graphNodes.map((n, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
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
        background: TYPE_COLORS[n.type ?? "other"] ?? TYPE_COLORS["other"],
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
    labelStyle: { fontSize: 10, fill: "#94a3b8" },
    labelBgStyle: { fill: "#1e293b", opacity: 0.85 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#475569" },
    style: { stroke: "#475569", strokeWidth: 1.5 },
    animated: false,
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const [selected, setSelected] = useState<{ id: string; label: string; text: string; type: string } | null>(null);
  const [search, setSearch] = useState("");

  const onNodeClick: NodeMouseHandler = useCallback((_evt, node) => {
    setSelected({
      id: node.id,
      label: node.data.label,
      text: node.data.text,
      type: node.data.type,
    });
  }, []);

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
    data: {
      ...n.data,
      isSelected: selected?.id === n.id,
    },
    style: {
      ...n.style,
      opacity: filteredNodeIds.length === 0 || filteredNodeIds.includes(n.id) ? 1 : 0.2,
      boxShadow: selected?.id === n.id
        ? "0 0 0 3px #fff, 0 0 12px rgba(255,255,255,0.3)"
        : filteredNodeIds.includes(n.id)
        ? "0 0 0 3px #facc15, 0 0 8px rgba(250,204,21,0.4)"
        : undefined,
    },
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0f172a", borderRadius: "inherit" }}>
      {/* Header */}
      <div style={{
        padding: "10px 16px",
        background: "#293548",
        borderBottom: "1px solid rgba(255,255,255,0.18)",
        color: "#f8fafc",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>
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
            border: "1px solid rgba(255,255,255,0.15)",
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: 13,
            width: 200,
            outline: "none",
          }}
        />
      </div>

      {/* Main: graph + sidebar */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={styledNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background
              color="#1e293b"
              gap={24}
              variant={BackgroundVariant.Dots}
            />
            <Controls style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }} />
            <MiniMap
              nodeColor={(n) => TYPE_COLORS[n.data?.type || "other"]}
              nodeStrokeColor={(n) => n.data?.isSelected ? "#facc15" : "transparent"}
              nodeStrokeWidth={4}
              style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </ReactFlow>
        </div>

        {/* Sidebar */}
        {selected && (
          <div style={{
            width: 240,
            background: "#1e293b",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            padding: 16,
            overflow: "auto",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>
                {selected.label}
              </span>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8" }}
              >
                ×
              </button>
            </div>
            <span style={{
              display: "inline-block",
              marginTop: 6,
              padding: "2px 8px",
              borderRadius: 99,
              background: TYPE_COLORS[selected.type],
              color: "#fff",
              fontSize: 11,
            }}>
              {selected.type}
            </span>
            <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
              {selected.text || "No excerpt available."}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        padding: "8px 16px",
        background: "#293548",
        borderTop: "1px solid rgba(255,255,255,0.18)",
        display: "flex",
        gap: 16,
        flexShrink: 0,
      }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}