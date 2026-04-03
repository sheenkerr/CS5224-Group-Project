import dotenv from "dotenv";

dotenv.config();
import Groq from "groq-sdk";
import axios from "axios";
import type { MindMap } from "./types";

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
      { role: "system", content: "You are a concise note‑writer. Turn a knowledge‑graph JSON into clear, structured study notes. Use headings and bullet points. No code fences or JSON output." },
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

// Gemini 3 Flash was utilized to generate the code for this function
// Append blocks to a Notion page (parsed from Markdown)
async function appendToPage(
  notionKey: string,
  pageId: string,
  notes: string,
  documentName: string
): Promise<void> {
  const lines = notes.split("\n");
  const children: any[] = [
    {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: `📝 ${documentName} — Mind Map Notes` } }],
      },
    },
    { object: "block", type: "divider", divider: {} },
  ];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    let block: any = null;

    // headings
    if (line.startsWith("### ")) {
      block = {
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: [{ type: "text", text: { content: line.replace(/^### /, "").slice(0, 2000) } }] },
      };
    } else if (line.startsWith("## ")) {
      block = {
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: line.replace(/^## /, "").slice(0, 2000) } }] },
      };
    } else if (line.startsWith("# ")) {
      block = {
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ type: "text", text: { content: line.replace(/^# /, "").slice(0, 2000) } }] },
      };
    }
    // bullet points
    else if (line.startsWith("* ") || line.startsWith("- ")) {
      block = {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: line.replace(/^[*|-] /, "").slice(0, 2000) } }],
        },
      };
    }

    // else default to paragraph
    else {
      block = {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: line.slice(0, 2000) } }],
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
