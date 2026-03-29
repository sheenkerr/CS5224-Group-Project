import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/index";
import { createLogger } from "./utils/logger";

dotenv.config();

import { connectToDatabase } from "./utils/database";
import { clerkMiddleware } from "@clerk/express";

const app = express();
const PORT = process.env.BACKEND_PORT ?? 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowfox';

const log = createLogger("Server");

app.use(cors({
  origin: 'http://localhost:4000', // Allowed React frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
}));

// Parse JSON request bodies
app.use(express.json());

// Add Clerk middleware to authenticate requests
app.use(clerkMiddleware());
app.use("/api", apiRouter);

// Start Server after connecting to DB
connectToDatabase(MONGODB_URI)
  .then(() => {
    log.info("Successfully connected to MongoDB");
    const server = app.listen(PORT, () => {
      log.info(`Server running on http://localhost:${PORT}`);
    });

    process.on("SIGINT", () => {
      server.close(() => {
        log.info("Server shutting down");
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    log.error(`Failed to connect to MongoDB: ${err}`);
    process.exit(1);
  });

export default app;
