import { readPDFFromS3 } from "./services/s3Service";
import { extractTextFromPDF } from "./services/pdfService";
import { extractGraph } from "./extract";
import { saveMindMap } from "./graph";
import { notifyMindmapCreated } from "./notifications";

export async function processNewDocument(
  bucketName: string,
  objectKey: string,
  userId: string,
  mindmapperId: string,
  documentId: string,
  extractionPrompt?: string
): Promise<void> {
  const pdfBuffer = await readPDFFromS3(bucketName, objectKey);
  const documentText = await extractTextFromPDF(pdfBuffer);
  const documentName = objectKey.split("/").pop() ?? objectKey;

  const graph = await extractGraph(
    documentText,
    extractionPrompt ?? "key concepts, people, organizations and ALL relationships between them"
  );

  await saveMindMap(
    userId,
    mindmapperId,
    documentId,
    documentName,
    graph,
    extractionPrompt ?? "key concepts",
    "completed",
    objectKey
  );
  await notifyMindmapCreated(userId, mindmapperId, documentName);
  console.log(`Processed: ${documentName}`);
}
