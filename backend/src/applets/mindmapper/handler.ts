// ─────────────────────────────────────────────
// handler.ts
// ─────────────────────────────────────────────

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractGraph } from "./extract.js";
import { saveMindMap, getMindMap, getAllMindMaps, getMergedGraph } from "./graph.js";
import { ExtractRequest } from "./types.js";

// Helper to return response
const response = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify(body),
});

// Main Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    // ─────────────────────────────────────────────
    // POST /api/mindmapper/extract
    // ─────────────────────────────────────────────
    if (method === "POST" && path.includes("/extract")) {
      const body: ExtractRequest = JSON.parse(event.body || "{}");

      const {
        userId,
        documentId,
        documentName,
        documentText,
        extractionPrompt,
        apiKey,
      } = body;

      // Validation
      if (!userId || !documentId || !documentName || !documentText) {
        return response(400, {
          success: false,
          error:
            "userId, documentId, documentName, and documentText are required.",
        });
      }

      // 1. Extract graph from LLM
      const graph = await extractGraph(
        documentText,
        extractionPrompt || "key concepts and how they relate to each other",
        apiKey
      );

      // 2. Save to DynamoDB
      await saveMindMap(
        userId,
        documentId,
        documentName,
        graph,
        extractionPrompt || "key concepts"
      );

      return response(200, {
        success: true,
        documentId,
        graph,
      });
    }

    if (method === "GET" && path.includes("/merged")) {
  const userId = event.pathParameters?.userId;
  const graph = await getMergedGraph(userId!);
  return response(200, { success: true, graph });
}

    // ─────────────────────────────────────────────
    // GET /api/mindmapper/{userId}/{documentId}
    // ─────────────────────────────────────────────
    if (method === "GET" && event.pathParameters?.documentId) {
      const { userId, documentId } = event.pathParameters;

      const record = await getMindMap(userId!, documentId!);

      if (!record) {
        return response(404, {
          success: false,
          error: "Not found.",
        });
      }

      return response(200, {
        success: true,
        record,
      });
    }

    // ─────────────────────────────────────────────
    // GET /api/mindmapper/{userId}
    // ─────────────────────────────────────────────
    if (method === "GET" && event.pathParameters?.userId) {
      const { userId } = event.pathParameters;

      const records = await getAllMindMaps(userId!);

      return response(200, {
        success: true,
        records,
      });
    }

    // Fallback
    return response(404, {
      success: false,
      error: "Route not found",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mindmapper] Error:", message);

    return response(500, {
      success: false,
      error: message,
    });
  }
  
};