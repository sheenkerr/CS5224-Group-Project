import { readPDFFromS3 } from "./services/s3Service";
import { extractTextFromPDF } from "./services/pdfService";
import { extractGraph } from "./extract";
import { saveMindMap } from "./graph";
import { v4 as uuidv4 } from "uuid";

export async function processNewDocument(
  bucketName: string,
  objectKey: string,
  userId: string,
  mindmapperId: string,  // ← ADD
  documentId: string,
  extractionPrompt?: string
) {
  const pdfBuffer = await readPDFFromS3(bucketName, objectKey);
  const documentText = await extractTextFromPDF(pdfBuffer);
  const documentName = objectKey.split("/").pop() ?? objectKey;

  const graph = await extractGraph(
    documentText,
    extractionPrompt ?? "key concepts, people, organizations and ALL relationships between them"
  );

  await saveMindMap(userId, mindmapperId, documentId, documentName, graph, extractionPrompt ?? "key concepts", "completed", objectKey);
  console.log(`✅ Processed: ${documentName}`);
}