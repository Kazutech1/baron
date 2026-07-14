import dns from "node:dns";
import path from "node:path";
import cors from "cors";
import express from "express";
import { assertConfig, config } from "./config.ts";
import { connectDb } from "./db.ts";
import { adminRouter } from "./routes/admin.ts";
import { publicRouter } from "./routes/public.ts";
import { scheduleSync } from "./sync.ts";
import { startBot } from "./telegram.ts";

assertConfig();

// Some ISP resolvers fail mongodb+srv SRV lookups — use public DNS for dns.resolve*.
if (config.usePublicDns) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    /* keep OS resolver */
  }
}

await connectDb();
console.log("[db] connected");

const app = express();
app.use(cors({ origin: config.corsOrigin.split(",").map((s) => s.trim()) }));
app.use(express.json({ limit: "1mb" }));

// Real store artwork downloaded by sync.ts
app.use(
  "/games",
  express.static(path.resolve(import.meta.dirname, "..", "public", "games"), {
    maxAge: "1h",
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", publicRouter);
app.use("/api/admin", adminRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[http]", err.message);
  res.status(500).json({ error: "Internal error" });
});

app.listen(config.port, () => {
  console.log(`[http] Baron API on http://localhost:${config.port}`);
});

startBot();
scheduleSync(config.syncIntervalHours);
