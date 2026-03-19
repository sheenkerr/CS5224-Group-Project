import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/index";
import { createLogger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

const log = createLogger("Server");

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
//     credentials: true,
//   })
// );

// Parse JSON request bodies
app.use(express.json());
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
