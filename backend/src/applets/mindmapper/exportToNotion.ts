import dotenv from "dotenv";

dotenv.config();
import Groq from "groq-sdk";
import axios from "axios";
import type { MindMap } from "./types";

/**
 * AI Usage Declaration
 *
 * Tool Used: Gemini 3.1 Pro
 *
 * Prompt:
 * - How may I develop a login with notion oAuth feature so users do not need to generate an API key to utilize export to notion?
 *
 * How the AI Output Was Used:
 * - Used a portion of suggested code for the below
*/

const NOTION_API_VERSION = "2022-06-28";

// Convert graph to readable notes using Groq
export async function graphToNotes(graph: MindMap, documentName: string, exportPrompt: string = "full graph"): Promise<string> {

  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) throw new Error("GROQ_API_KEY not set in environment");

  const client = new Groq({ apiKey: groqKey });
  const graphJson = JSON.stringify(graph, null, 2);
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system", content: `
        You are an expert educational note-writer. Transform the provided knowledge-graph JSON into clear, comprehensive, and aesthetically pleasing study notes. 

        Use the following formatting rules:
        - Title: Start your output with a Level 1 Header structured exactly like this: # 📝 [Overarching Topic] (replace [Overarching Topic] with the main subject of the graph and not just the document name).
        - Divider: Immediately follow the title with a markdown divider (---).
        - Paragraphs: Use standard, descriptive paragraphs to explain concepts, provide context, and connect ideas smoothly. Do not rely solely on lists.
        - Headers: Use standard headers for hierarchy (##, ###).
        - Bullet points (- ): Use only for listing distinct attributes, multiple related facts, or itemized details. 
        - Numbered lists (1. , 2. ): Use strictly for step-by-step processes or sequential timelines.
        - Blockquotes (> ): Use to highlight key definitions, crucial takeaways, or warnings (these will be formatted as visual callouts).

        Color Syntax Rules:
        - Use double asterisks (**text**) for key points or emphasis. (This will be formatted as yellow text).
        - Use double plus signs (++text++) for positive points, advantages, or pros. (This will be formatted as green text).
        - Use double hyphens (==text==) for negative points, disadvantages, or cons. (This will be formatted as red text).

        Keep the text engaging and easy to scan by balancing descriptive paragraphs with structured lists. Do not use Markdown code fences or output raw JSON.
        `},
      { role: "user", content: `Write study notes for "${documentName}" focusing on ${exportPrompt}. Use the provided graph:\n\n${graphJson}` },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const text = response.choices?.[0]?.message?.content;

  if (!text) throw new Error("Groq returned empty content");
  return text;

}

// Find first page the integration can access
async function findFirstPage(notionKey: string): Promise<string> {

  const res = await axios.post(
    "https://api.notion.com/v1/search",
    { filter: { value: "page", property: "object" }, page_size: 1 },
    { headers: { Authorization: `Bearer ${notionKey}`, "Notion-Version": NOTION_API_VERSION, "Content-Type": "application/json" } }
  );

  const pages = res.data.results;

  if (!pages || pages.length === 0) throw new Error("No accessible Notion pages found. Share a page with the integration.");
  return pages[0].id;

}

// Gemini 3.1 Pro was utilized to generate the code for this function
// Append blocks to a Notion page (parsed from Markdown)

// Helper function to handle custom color syntax (**, ++, ??)
function parseRichText(text: string): any[] {
  // Regex looks for text wrapped in **, ++, or ??
  const regex = /(\*\*.*?\*\*|\+\+.*?\+\+|==.*?==)/g;
  const parts = text.split(regex);
  const richTextArray = [];

  for (const part of parts) {
    if (!part) continue;

    // Yellow for key points
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      richTextArray.push({
        type: "text",
        text: { content: part.slice(2, -2) },
        annotations: { color: "yellow" }, // Changes text to yellow instead of bold
      });
    }
    // Green for positive points
    else if (part.startsWith("++") && part.endsWith("++") && part.length >= 4) {
      richTextArray.push({
        type: "text",
        text: { content: part.slice(2, -2) },
        annotations: { color: "green" },
      });
    }
    // Red for negative points
    else if (part.startsWith("==") && part.endsWith("==") && part.length >= 4) {
      richTextArray.push({
        type: "text",
        text: { content: part.slice(2, -2) },
        annotations: { color: "red" },
      });
    }
    // Standard unformatted text
    else {
      richTextArray.push({
        type: "text",
        text: { content: part },
      });
    }
  }
  return richTextArray;
}

// Main function to parse markdown lines and push to Notion
async function appendToPage(
  notionKey: string,
  pageId: string,
  notes: string,
  documentName: string // You can remove this parameter now if you aren't using it elsewhere!
): Promise<void> {
  const lines = notes.split("\n");

  // Start with an empty array instead of the hardcoded documentName block
  const children: any[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    let block: any = null;

    // Divider
    if (line === "---") {
      block = {
        object: "block",
        type: "divider",
        divider: {},
      };
    }
    // Headings
    else if (line.startsWith("### ")) {
      block = {
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: parseRichText(line.replace(/^### /, "").slice(0, 2000)) },
      };
    } else if (line.startsWith("## ")) {
      block = {
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: parseRichText(line.replace(/^## /, "").slice(0, 2000)) },
      };
    } else if (line.startsWith("# ")) {
      block = {
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: parseRichText(line.replace(/^# /, "").slice(0, 2000)) },
      };
    }
    // Callouts (Parsed from markdown blockquotes)
    else if (line.startsWith("> ")) {
      block = {
        object: "block",
        type: "callout",
        callout: {
          rich_text: parseRichText(line.replace(/^>\s*/, "").slice(0, 2000)),
          icon: { type: "emoji", emoji: "💡" },
          color: "gray_background",
        },
      };
    }
    // Numbered Lists (Matches "1. ", "2. ", etc.)
    else if (/^\d+\.\s/.test(line)) {
      block = {
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: parseRichText(line.replace(/^\d+\.\s*/, "").slice(0, 2000)),
        },
      };
    }
    // Bullet Points
    else if (line.startsWith("* ") || line.startsWith("- ")) {
      block = {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: parseRichText(line.replace(/^[*|-]\s*/, "").slice(0, 2000)),
        },
      };
    }
    // Default to paragraph
    else {
      block = {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: parseRichText(line.slice(0, 2000)),
        },
      };
    }

    if (block) children.push(block);
  }

  await axios.patch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    { children },
    {
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function exportGraphToNotion(graph: MindMap, documentName: string, notionKey: string, exportPrompt: string = "full graph"): Promise<string> {

  const notes = await graphToNotes(graph, documentName, exportPrompt);
  const pageId = await findFirstPage(notionKey);
  await appendToPage(notionKey, pageId, notes, documentName);
  return pageId;

}