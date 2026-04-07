import dotenv from "dotenv";
dotenv.config();
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import Groq from "groq-sdk";
import { MindMap, MindMapRecord, MindMapWorkspace, GraphNode, GraphEdge } from "./types";

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-southeast-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GRAPHS_TABLE = process.env.MINDMAPPER_TABLE ?? "mindmapper-graphs";
const WORKSPACES_TABLE = "mindmapper-workspaces";

// ── Helper ──────────────────────────────────────────────────
function makeDocId(mindmapperId: string, documentId: string) {
  return `${mindmapperId}#${documentId}`;
}

// ── Workspace CRUD ──────────────────────────────────────────
export async function createWorkspace(
  userId: string,
  mindmapperId: string,
  name: string
): Promise<MindMapWorkspace> {
  const workspace: MindMapWorkspace = {
    userId,
    mindmapperId,
    name,
    createdAt: Date.now(),
  };
  await dynamo.send(new PutCommand({ TableName: WORKSPACES_TABLE, Item: workspace }));
  return workspace;
}

export async function getWorkspaces(userId: string): Promise<MindMapWorkspace[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: WORKSPACES_TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    })
  );
  return (result.Items as MindMapWorkspace[]) ?? [];
}

// ── MindMap CRUD ────────────────────────────────────────────
// backend/src/applets/mindmapper/crud.ts
export async function saveMindMap(
  userId: string,
  mindmapperId: string,
  documentId: string,
  documentName: string,
  graph: MindMap,
  extractionPrompt: string,
  status: "processing" | "completed" | "failed" = "completed",
  s3Key?: string
): Promise<MindMapRecord> {
  const record: MindMapRecord = {
    userId,
    mindmapperId,
    mindmapperDocId: `${mindmapperId}#${documentId}`, // ✅ always include #
    documentId,
    documentName,
    graph,
    extractionPrompt,
    status,
    createdAt: Date.now(),
    ...(s3Key && { s3Key }),
  };

  await dynamo.send(
    new PutCommand({ TableName: "mindmapper-graphs", Item: record })
  );

  return record;
}

export async function getMindMap(
  userId: string,
  mindmapperId: string,
  documentId: string
): Promise<MindMapRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: GRAPHS_TABLE,
      Key: { userId, mindmapperDocId: makeDocId(mindmapperId, documentId) },
    })
  );
  return (result.Item as MindMapRecord) ?? null;
}

export async function getMindMapsByWorkspace(
  userId: string,
  mindmapperId: string
): Promise<MindMapRecord[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: GRAPHS_TABLE,
      KeyConditionExpression: "userId = :uid AND begins_with(mindmapperDocId, :prefix)",
      ExpressionAttributeValues: {
        ":uid": userId,
        ":prefix": `${mindmapperId}#`,
      },
    })
  );
  return (result.Items as MindMapRecord[]) ?? [];
}

export async function deleteMindMap(
  userId: string,
  mindmapperId: string,
  documentId: string
): Promise<void> {
  // ✅ Construct the correct composite SK
  const mindmapperDocId = makeDocId(mindmapperId, documentId);

  await dynamo.send(
    new DeleteCommand({
      TableName: GRAPHS_TABLE,
      Key: { userId, mindmapperDocId },
    })
  );

  console.log(`Deleted document ${documentId} from workspace ${mindmapperId}`);
}

export async function getMergedGraph(
  userId: string,
  mindmapperId: string
): Promise<MindMap> {
  const records = await getMindMapsByWorkspace(userId, mindmapperId);
  return mergeSelectedGraphs(records.filter(r => r.status === "completed" && r.graph));
}

export async function mergeSelectedGraphs(records: MindMapRecord[]): Promise<MindMap> {
  const mergedNodes: GraphNode[] = [];
  const mergedEdges: GraphEdge[] = [];
  const seenLabels = new Map<string, string>();

  for (const record of records) {
    const docPrefix = record.documentId;
    for (const node of record.graph?.nodes ?? []) {
      const normalised = node.label.toLowerCase();
      const existingId = seenLabels.get(normalised);
      if (existingId) {
        mergedEdges.push({ source: existingId, target: existingId, relationship: `also in "${record.documentName}"` });
      } else {
        const newId = `${docPrefix}_${node.id}`;
        seenLabels.set(normalised, newId);
        mergedNodes.push({ ...node, id: newId, text: `[${record.documentName}] ${node.text}` });
      }
    }
    for (const edge of record.graph?.edges ?? []) {
      const sourceId = seenLabels.get(record.graph!.nodes.find(n => n.id === edge.source)?.label.toLowerCase() ?? "");
      const targetId = seenLabels.get(record.graph!.nodes.find(n => n.id === edge.target)?.label.toLowerCase() ?? "");
      if (sourceId && targetId) mergedEdges.push({ source: sourceId, target: targetId, relationship: edge.relationship });
    }
  }

  // Cross-doc LLM connections
  if (records.length > 1 && mergedNodes.length > 0) {
    try {
      const nodesSummary = mergedNodes.map(n => {
        const docName = n.text.split("]")[0]?.replace("[", "") ?? "unknown";
        return `id: "${n.id}", label: "${n.label}", document: "${docName}"`;
      }).join("\n");

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Find connections between concepts from different documents. Return ONLY valid JSON." },
          { role: "user", content: `Find meaningful connections ONLY between nodes from DIFFERENT documents.\nReturn: { "edges": [{ "source": "id", "target": "id", "relationship": "description" }] }\nMax 6 edges. Empty array if none.\n\nNodes:\n${nodesSummary}` }
        ],
        temperature: 0.1,
        max_tokens: 600,
      });

      const raw = response.choices?.[0]?.message?.content ?? "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { edges: GraphEdge[] };
        const validIds = new Set(mergedNodes.map(n => n.id));
        for (const edge of parsed.edges ?? []) {
          if (validIds.has(edge.source) && validIds.has(edge.target)) mergedEdges.push(edge);
        }
      }
    } catch (err) {
      console.warn("Cross-doc LLM call failed:", err);
    }
  }

  return { nodes: mergedNodes, edges: mergedEdges };
}