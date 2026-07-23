import dns from "node:dns";
import cors from "cors";
import express from "express";
import { assertConfig, config } from "./config.ts";
import { connectDb, images, importLocalImages } from "./db.ts";
import { adminRouter } from "./routes/admin.ts";
import { publicRouter } from "./routes/public.ts";
import { paystackWebhook } from "./routes/webhook.ts";
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
await importLocalImages();

const app = express();
app.use(cors({ origin: config.corsOrigin.split(",").map((s) => s.trim()) }));

// Raw body required for HMAC signature verification — must come before express.json().
app.post("/api/paystack/webhook", express.raw({ type: "application/json" }), paystackWebhook);

app.use(express.json({ limit: "1mb" }));

// Real store artwork, synced into Mongo by sync.ts (survives ephemeral filesystems)
app.get("/games/:gameId/:file", async (req, res) => {
  const doc = await images().findOne({ _id: `/games/${req.params.gameId}/${req.params.file}` });
  if (!doc) {
    res.status(404).end();
    return;
  }
  res.set({
    "Content-Type": doc.contentType,
    "Cache-Control": "public, max-age=86400",
    "Last-Modified": doc.updatedAt.toUTCString(),
  });
  res.send(Buffer.from(doc.data.buffer));
});

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
