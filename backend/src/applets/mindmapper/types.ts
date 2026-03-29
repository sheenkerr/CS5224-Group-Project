export interface GraphNode {
  id: string;
  label: string;
  text: string; // relevant excerpt from document
  type?: "concept" | "person" | "event" | "place" | "other";
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface MindMap {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface MindMapRecord {
  userId: string;
  documentId: string;
  documentName: string;
  graph: MindMap;
  extractionPrompt: string;
  createdAt: number;
}

export interface ExtractRequest {
  userId: string;
  documentId: string;
  documentName: string;
  documentText: string;
  extractionPrompt?: string; // optional, defaults to "key concepts"
  apiKey?: string;           // optional user-provided API key
}

export interface ExtractResponse {
  success: boolean;
  documentId: string;
  graph?: MindMap;
  error?: string;
}