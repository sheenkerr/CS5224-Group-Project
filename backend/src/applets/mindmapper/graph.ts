// ─────────────────────────────────────────────
// graph.ts
// Save and retrieve MindMap records from DynamoDB
// ─────────────────────────────────────────────

import dotenv from "dotenv";
dotenv.config();

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";
import Groq from "groq-sdk";
import { MindMap, MindMapRecord, GraphNode, GraphEdge } from "./types.js";

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "ap-southeast-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TABLE_NAME = process.env.MINDMAPPER_TABLE ?? "mindmapper-graphs";

/**
 * Save a MindMap to DynamoDB
 */
export async function saveMindMap(
  userId: string,
  documentId: string,
  documentName: string,
  graph: MindMap | undefined,
  extractionPrompt: string,
  status: "processing" | "completed" | "failed"
): Promise<MindMapRecord> {
  const record: MindMapRecord = {
    userId,
    documentId,
    documentName,
    graph,
    extractionPrompt,
    status,
    createdAt: Date.now(),
  };

  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: record,
    })
  );

  return record;
}

/**
 * Get a single MindMap by userId + documentId
 */
export async function getMindMap(
  userId: string,
  documentId: string
): Promise<MindMapRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, documentId },
    })
  );

  return (result.Item as MindMapRecord) || null;
}

/**
 * Get all MindMaps for a user
 */
export async function getAllMindMaps(userId: string): Promise<MindMapRecord[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    })
  );

  return (result.Items as MindMapRecord[]) || [];
}

/**
 * Merge selected MindMaps for a user into one graph.
 * Only merges the provided records and consults LLM for cross-doc connections.
 */
export async function mergeSelectedGraphs(records: MindMapRecord[]): Promise<MindMap> {
  const mergedNodes: GraphNode[] = [];
  const mergedEdges: GraphEdge[] = [];
  const seenLabels = new Map<string, string>(); // label → assigned id

  // Step 1: Deduplicate nodes and rewire within-document edges
  for (const record of records) {
    if (!record.graph) continue;
    const docPrefix = record.documentId;

    record.graph.nodes.forEach((node) => {
      const normalized = node.label.toLowerCase();
      const existingId = seenLabels.get(normalized);

      if (existingId) {
        // Same concept in another doc — self-link edge
        mergedEdges.push({
          source: existingId,
          target: existingId,
          relationship: `also in "${record.documentName}"`,
        });
      } else {
        const newId = `${docPrefix}_${node.id}`;
        seenLabels.set(normalized, newId);
        mergedNodes.push({
          ...node,
          id: newId,
          text: `[${record.documentName}] ${node.text}`,
        });
      }
    });

    // Within-document edges
    record.graph.edges.forEach((edge) => {
      const sourceId = seenLabels.get(
        record.graph!.nodes.find((n) => n.id === edge.source)?.label.toLowerCase() ?? ""
      );
      const targetId = seenLabels.get(
        record.graph!.nodes.find((n) => n.id === edge.target)?.label.toLowerCase() ?? ""
      );

      if (sourceId && targetId) {
        mergedEdges.push({
          source: sourceId,
          target: targetId,
          relationship: edge.relationship,
        });
      }
    });
  }

  // Step 2: LLM cross-document connections
  if (records.length > 1 && mergedNodes.length > 0) {
    try {
      const nodesSummary = mergedNodes
        .map((n) => {
          const docName = n.text.split("]")[0]?.replace("[", "") ?? "unknown";
          return `id: "${n.id}", label: "${n.label}", document: "${docName}"`;
        })
        .join("\n");

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You find meaningful connections between concepts from different documents. Return ONLY valid JSON, no explanation, no markdown.",
          },
          {
            role: "user",
            content: `Below are nodes from multiple documents. Find meaningful connections ONLY between nodes from DIFFERENT documents (different "document" values).
Do NOT connect nodes from the same document.
Return ONLY this JSON format:
{
  "edges": [
    { "source": "node_id", "target": "node_id", "relationship": "brief relationship description" }
  ]
}
Return empty edges array if no meaningful cross-document connections exist.
Maximum 6 cross-document connections. Use exact node ids from the list.

Nodes:
${nodesSummary}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 600,
      });

      const raw = response.choices?.[0]?.message?.content ?? "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { edges: GraphEdge[] };
        const validIds = new Set(mergedNodes.map((n) => n.id));
        for (const edge of parsed.edges ?? []) {
          if (validIds.has(edge.source) && validIds.has(edge.target)) {
            mergedEdges.push(edge);
          }
        }
      }
    } catch (err) {
      console.warn("Cross-document LLM call failed:", err);
    }
  }

  return { nodes: mergedNodes, edges: mergedEdges };
}

/**
 * Merge all MindMaps for a user into one graph.
 * Nodes with the same label across documents are deduplicated.
 * A second LLM call finds cross-document connections between different nodes.
 */
export async function getMergedGraph(userId: string): Promise<MindMap> {
  const records = await getAllMindMaps(userId);
  const validRecords = records.filter(r => r?.graph) as MindMapRecord[];
  return mergeSelectedGraphs(validRecords);
}

/**
 * Delete a MindMap from DynamoDB (DB only, does NOT touch S3)
 */
export async function deleteMindMap(userId: string, documentId: string): Promise<void> {
  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { userId, documentId },
    })
  );
}