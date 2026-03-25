import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";
import type { MindMap } from "./types.js";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function extractGraph(
  documentText: string,
  extractionPrompt: string = "key concepts and how they relate to each other",
  userApiKey?: string
): Promise<MindMap> {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile", // free on Groq
    messages: [
      {
        role: "system",
        content: "You are a knowledge graph extractor. Return ONLY valid JSON, no explanation, no markdown, no backticks."
      },
      {
        role: "user",
        content: `Extract "${extractionPrompt}" from the document below.
Return ONLY this JSON format:
{
  "nodes": [
    { "id": "1", "label": "short concept name", "text": "relevant excerpt", "type": "concept" }
  ],
  "edges": [
    { "source": "1", "target": "2", "relationship": "relates to" }
  ]
}
Rules:
- id must be unique string numbers
- label must be 1-4 words
- type is one of: concept, person, event, place, other
- Extract 5-15 nodes maximum
- Return ONLY the JSON

Document:
${documentText}`
      }
    ],
    temperature: 0.1,
    max_tokens: 1000,
  });

  const rawText = response.choices?.[0]?.message?.content;
  if (!rawText) throw new Error("No response from model.");

  console.log("Raw response:", rawText.slice(0, 300));

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON found in response: ${rawText.slice(0, 200)}`);

  let graph: MindMap;
  try {
    graph = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Invalid JSON returned: ${jsonMatch[0].slice(0, 200)}`);
  }

  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error("Graph JSON missing nodes or edges.");
  }

  return graph;
}