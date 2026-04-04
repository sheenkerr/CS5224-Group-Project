import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/index";
import { createLogger } from "./utils/logger";
import { clerkAuth } from "./middlewares/auth";
import { clerkMiddleware } from "@clerk/express";
import mindMapRouter from "./applets/mindmapper/mindmapperRouter";
import googleRouter from "./applets/mindmapper/handler";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

const log = createLogger("Server");

app.use(cors({
  origin: 'http://localhost:4000', // Your exact React frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
}));

// Parse JSON request bodies
app.use(express.json());
app.use(clerkAuth);
app.use("/api/mindmapper/google", googleRouter); // Google endpoints
app.use("/api/mindmapper", mindMapRouter);      // Graph endpoints

// ✅ Any other shared routes
app.use("/api", apiRouter);

const server = app.listen(PORT, () => {
  log.info(`Server running on http://localhost:${PORT}`);
});


process.on("SIGINT", () => {
  server.close(() => {
    log.info("Server shutting down");
    process.exit(0);
  });
});

export default app;
