import { readPDFFromS3 } from "./services/s3Service";
import { extractTextFromPDF } from "./services/pdfService";
import { extractGraph } from "./extract";
import { saveMindMap } from "./graph";
import { v4 as uuidv4 } from "uuid";

export async function processNewDocument(
  bucketName: string,
  objectKey: string,
  userId: string,
  extractionPrompt?: string
) {
  console.log(`Processing new document: ${objectKey}`);

  // 1. Read PDF from S3
  const pdfBuffer = await readPDFFromS3(bucketName, objectKey);

  // 2. Extract text from PDF
  const documentText = await extractTextFromPDF(pdfBuffer);

  // 3. Get document name from S3 key (e.g. "uploads/report.pdf" → "report.pdf")
  const documentName = objectKey.split("/").pop() ?? objectKey;

  const documentId = `doc-${uuidv4()}`;

// 1. Save initial state
await saveMindMap(
  userId,
  documentId,
  documentName,
  undefined,
  extractionPrompt ?? "key concepts",
  "processing"
);

// 2. Generate graph
const graph = await extractGraph(
  documentText,
  extractionPrompt ?? "key concepts, people, organizations and ALL relationships between them"
);

// 3. Save final result
await saveMindMap(
  userId,
  documentId,
  documentName,
  graph,
  extractionPrompt ?? "key concepts",
  "completed"
);
}