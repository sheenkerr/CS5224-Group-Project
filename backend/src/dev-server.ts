import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { handler } from "./applets/mindmapper/handler.js";

const app = express();
app.use(cors());
app.use(express.json());

// Helper to convert Express req to fake Lambda event
const toLambdaEvent = (req: express.Request, pathOverride?: string) => ({
  httpMethod: req.method,
  path: pathOverride || req.path,
  pathParameters: req.params,
  body: JSON.stringify(req.body),
  headers: req.headers,
} as any);

// Mindmapper routes
app.post("/api/mindmapper/extract", async (req, res) => {
  const result = await handler(toLambdaEvent(req));
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// ✅ merged FIRST
app.get("/api/mindmapper/:userId/merged", async (req, res) => {
  const result = await handler(toLambdaEvent(req));
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// then documentId
app.get("/api/mindmapper/:userId/:documentId", async (req, res) => {
  const result = await handler(toLambdaEvent(req));
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// then userId only
app.get("/api/mindmapper/:userId", async (req, res) => {
  const result = await handler(toLambdaEvent(req));
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.listen(3001, () => console.log("✅ Dev server running on http://localhost:3001"));