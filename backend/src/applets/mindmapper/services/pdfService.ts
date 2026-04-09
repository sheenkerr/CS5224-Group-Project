import * as pdfParseModule from "pdf-parse";

const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  const data = await pdfParse(pdfBuffer);
  return data.text;
}