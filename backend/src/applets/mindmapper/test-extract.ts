// ─────────────────────────────────────────────
// test-extract.ts
// Run this to test LLM extraction WITHOUT needing
// the frontend or DynamoDB set up.
//
// Usage:
//   cd backend
//   npx ts-node src/applets/mindmapper/test-extract.ts
// ─────────────────────────────────────────────

import { extractGraph } from "./extract.js";

const SAMPLE_DOCUMENT = `
Albert Einstein was a German-born theoretical physicist who developed the theory of relativity, 
one of the two pillars of modern physics. His work is also known for its influence on the 
philosophy of science. He received the Nobel Prize in Physics in 1921 for his discovery of 
the law of the photoelectric effect. Einstein's mass-energy equivalence formula E=mc2 
has been called the world's most famous equation. He collaborated with Niels Bohr on 
quantum mechanics, though they famously disagreed on its interpretation. 
Einstein moved to the United States in 1933, where he worked at the Institute for Advanced Study in Princeton.
`;

async function main() {
  console.log("Testing extraction...\n");

  try {
    const graph = await extractGraph(
      SAMPLE_DOCUMENT,
      "key people, concepts, and their relationships"
    );

    console.log("✅ Extraction successful!\n");
    console.log(`Nodes (${graph.nodes.length}):`);
    graph.nodes.forEach((n) =>
      console.log(`  [${n.id}] ${n.label} (${n.type}) — "${n.text.slice(0, 60)}..."`)
    );

    console.log(`\nEdges (${graph.edges.length}):`);
    graph.edges.forEach((e) =>
      console.log(`  ${e.source} → ${e.target} : "${e.relationship}"`)
    );

    console.log("\nFull graph JSON:");
    console.log(JSON.stringify(graph, null, 2));
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();