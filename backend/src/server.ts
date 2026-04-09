import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/index";
import { createLogger } from "./utils/logger";
import { clerkAuth } from "./middlewares/auth";
import mindMapRouter from "./applets/mindmapper/mindmapperRouter";
import googleRouter from "./applets/mindmapper/handler";
import { connectToDatabase } from "./utils/database";


dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT ?? 4001;
const log = createLogger("Server");

// -------------------
// CORS configuration
// -------------------
app.use(cors({
  origin: 'http://localhost:4000', // React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // if you need cookies/auth
}));

// -------------------
// Middleware
// -------------------
app.use(express.json());
app.use(clerkAuth);

// -------------------
// Mindmapper routes (always available, no DB needed)
// -------------------
app.use("/api/mindmapper/google", googleRouter);
app.use("/api/mindmapper", mindMapRouter);

// -------------------
// Any other routes (may require DB)
// -------------------
app.use("/api", apiRouter);

// -------------------
// Start server
// -------------------
async function startServer() {
  try {
    // Attempt to connect to MongoDB if URI exists
    if (process.env.MONGODB_URI) {
      await connectToDatabase(process.env.MONGODB_URI);
      log.info("MongoDB connected successfully");
    } else {
      log.warn("No MongoDB URI provided, skipping DB connection");
    }

    const server = app.listen(PORT, () => {
      log.info(`Server running on http://localhost:${PORT}`);
    });

    process.on("SIGINT", () => {
      server.close(() => {
        log.info("Server shutting down");
        process.exit(0);
      });
    });

  } catch (err) {
    log.error("Failed to start server", err);
    process.exit(1);
  }
}

startServer();

export default app;