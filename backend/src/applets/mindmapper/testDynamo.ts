// import dotenv from "dotenv";
// dotenv.config();

// import { saveMindMap, getMindMap } from "./graph";

// async function main() {
//   console.log("Testing DynamoDB...\n");

//   const mockGraph = {
//     nodes: [
//       { id: "1", label: "Albert Einstein", text: "German-born physicist", type: "person" as const },
//       { id: "2", label: "Theory of Relativity", text: "one of two pillars of modern physics", type: "concept" as const },
//     ],
//     edges: [
//       { source: "1", target: "2", relationship: "developed" }
//     ]
//   };

//   // Test save
//   console.log("Saving graph...");
//   await saveMindMap("test-user", "doc-001", "Einstein Doc", mockGraph, "key concepts", "completed");
//   console.log("✅ Saved!");

//   // Test retrieve
//   console.log("Retrieving graph...");
//   const record = await getMindMap("test-user", "doc-001");
//   console.log("✅ Retrieved:", record?.documentName);
//   console.log("Nodes:", record?.graph!.nodes.length);
//   console.log("Edges:", record?.graph!.edges.length);
// }

// main().catch(console.error);