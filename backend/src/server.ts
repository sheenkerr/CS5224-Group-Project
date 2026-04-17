import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/index";
import { createLogger } from "./utils/logger";
import { clerkAuth } from "./middlewares/auth";
import mindMapRouter from "./applets/mindmapper/mindmapperRouter";
import googleRouter from "./applets/mindmapper/handler";


dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT ?? process.env.PORT ?? 4001;
const log = createLogger("Server");
const allowedOrigins = [
  process.env.CORS_ALLOWED_ORIGINS,
  process.env.FRONTEND_URL,
]
  .flatMap((value) => (value ?? "").split(","))
  .map((value) => value.trim())
  .filter(Boolean);

// -------------------
// CORS configuration
// -------------------
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
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
