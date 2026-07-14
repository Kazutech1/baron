import { Router } from "express";
import { checkPassword, issueToken, requireAdmin } from "../auth.ts";
import {
  events,
  games,
  getSetting,
  orders,
  orderStats,
  setOrderStatus,
  setSetting,
  skins,
  syncLog,
  telegramChatId,
} from "../db.ts";
import { refreshOrderMessage, sendTestMessage } from "../telegram.ts";
import { runSync } from "../sync.ts";
import { pub } from "../types.ts";
import type { EventDoc, GameDoc, Pack, SkinDoc } from "../types.ts";
import { config } from "../config.ts";

export const adminRouter = Router();

adminRouter.post("/login", async (req, res) => {
  // small fixed delay to blunt brute-force attempts
  await new Promise((r) => setTimeout(r, 300));
  if (!checkPassword(req.body?.password)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }
  res.json({ token: issueToken() });
});

adminRouter.use(requireAdmin);

/* ---------- overview ---------- */

adminRouter.get("/overview", async (_req, res) => {
  const [stats, recent, logs, chatId, draftCount] = await Promise.all([
    orderStats(),
    orders().find().sort({ createdAt: -1 }).limit(8).toArray(),
    syncLog().find().sort({ at: -1 }).limit(5).toArray(),
    telegramChatId(),
    events().countDocuments({ status: "draft" }),
  ]);
  res.json({
    stats,
    recentOrders: recent.map(pub),
    syncLogs: logs.map((l) => ({ at: l.at, summary: l.summary })),
    telegram: { tokenSet: Boolean(config.telegramToken), chatId },
    draftEvents: draftCount,
  });
});

/* ---------- orders ---------- */

adminRouter.get("/orders", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const filter = status && status !== "all" ? { status: status as never } : {};
  const list = await orders().find(filter).sort({ createdAt: -1 }).limit(200).toArray();
  res.json({ orders: list.map(pub) });
});

adminRouter.post("/orders/:ref/status", async (req, res) => {
  const status = req.body?.status;
  if (!["pending", "delivered", "cancelled"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const order = await setOrderStatus(req.params.ref, status);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  refreshOrderMessage(order).catch(() => {});
  res.json({ order: pub(order) });
});

/* ---------- games & packs ---------- */

adminRouter.get("/games", async (_req, res) => {
  const list = await games().find().sort({ sort: 1, name: 1 }).toArray();
  res.json({ games: list.map(pub) });
});

adminRouter.get("/games/:id", async (req, res) => {
  const game = await games().findOne({ _id: req.params.id });
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json({ game: pub(game) });
});

function sanitizePack(p: Record<string, unknown>, index: number): Pack {
  return {
    id: String(p.id || `pack-${Date.now().toString(36)}-${index}`).slice(0, 60),
    amount: String(p.amount ?? "").slice(0, 80),
    bonus: String(p.bonus ?? "").slice(0, 80),
    priceNgn: Math.max(0, Math.floor(Number(p.priceNgn) || 0)),
    popular: Boolean(p.popular),
    sort: Number.isFinite(Number(p.sort)) ? Number(p.sort) : index,
    active: p.active === undefined ? true : Boolean(p.active),
  };
}

adminRouter.put("/games/:id", async (req, res) => {
  const b = req.body ?? {};
  const id = req.params.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!id || typeof b.name !== "string" || !b.name.trim()) {
    res.status(400).json({ error: "id and name are required" });
    return;
  }
  const existing = await games().findOne({ _id: id });
  const doc: GameDoc = {
    _id: id,
    name: b.name.trim().slice(0, 120),
    publisher: String(b.publisher ?? "").slice(0, 120),
    currency: String(b.currency ?? "Tokens").slice(0, 60),
    tagline: String(b.tagline ?? "").slice(0, 300),
    accent: String(b.accent ?? "#35e0ff").slice(0, 20),
    icon: String(b.icon ?? "").slice(0, 500),
    card: String(b.card ?? "").slice(0, 500),
    banner: String(b.banner ?? "").slice(0, 500),
    playPackageId: String(b.playPackageId ?? "").slice(0, 200),
    itunesTerm: String(b.itunesTerm ?? "").slice(0, 200),
    screenshots: existing?.screenshots ?? [],
    sort: Number.isFinite(Number(b.sort)) ? Number(b.sort) : existing?.sort ?? 99,
    active: b.active === undefined ? true : Boolean(b.active),
    packs: Array.isArray(b.packs)
      ? b.packs.slice(0, 40).map((p: Record<string, unknown>, i: number) => sanitizePack(p, i))
      : existing?.packs ?? [],
  };
  await games().replaceOne({ _id: id }, doc, { upsert: true });
  res.json({ game: pub(doc) });
});

adminRouter.delete("/games/:id", async (req, res) => {
  await Promise.all([
    games().deleteOne({ _id: req.params.id }),
    skins().deleteMany({ gameId: req.params.id }),
    events().deleteMany({ gameId: req.params.id }),
  ]);
  res.json({ ok: true });
});

/* ---------- skins ---------- */

adminRouter.get("/skins", async (_req, res) => {
  const list = await skins().find().sort({ sort: 1, name: 1 }).toArray();
  res.json({ skins: list.map(pub) });
});

adminRouter.put("/skins/:id", async (req, res) => {
  const b = req.body ?? {};
  const id = req.params.id.trim();
  const game = await games().findOne({ _id: String(b.gameId ?? "") });
  if (!id || !game || typeof b.name !== "string" || !b.name.trim()) {
    res.status(400).json({ error: "id, valid gameId and name are required" });
    return;
  }
  const doc: SkinDoc = {
    _id: id.slice(0, 80),
    gameId: game._id,
    name: b.name.trim().slice(0, 160),
    rarity: ["Epic", "Legendary", "Mythic"].includes(b.rarity) ? b.rarity : "Epic",
    priceNgn: Math.max(0, Math.floor(Number(b.priceNgn) || 0)),
    image: String(b.image ?? "").slice(0, 500),
    sort: Number.isFinite(Number(b.sort)) ? Number(b.sort) : 99,
    active: b.active === undefined ? true : Boolean(b.active),
  };
  await skins().replaceOne({ _id: doc._id }, doc, { upsert: true });
  res.json({ skin: pub(doc) });
});

adminRouter.delete("/skins/:id", async (req, res) => {
  await skins().deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

/* ---------- events ---------- */

adminRouter.get("/events", async (_req, res) => {
  const list = await events().find().sort({ status: 1, endsAt: 1 }).toArray();
  res.json({ events: list.map(pub) });
});

adminRouter.put("/events/:id", async (req, res) => {
  const b = req.body ?? {};
  const id = req.params.id.trim();
  const game = await games().findOne({ _id: String(b.gameId ?? "") });
  if (!id || !game || typeof b.title !== "string" || !b.title.trim()) {
    res.status(400).json({ error: "id, valid gameId and title are required" });
    return;
  }
  const endsAt = new Date(String(b.endsAt ?? ""));
  if (Number.isNaN(endsAt.getTime())) {
    res.status(400).json({ error: "Valid endsAt date required" });
    return;
  }
  const doc: EventDoc = {
    _id: id.slice(0, 80),
    gameId: game._id,
    title: b.title.trim().slice(0, 160),
    blurb: String(b.blurb ?? "").slice(0, 400),
    image: String(b.image ?? "").slice(0, 500),
    tag: String(b.tag ?? "Event").slice(0, 40),
    endsAt: endsAt.toISOString(),
    status: ["draft", "live", "archived"].includes(b.status) ? b.status : "draft",
  };
  await events().replaceOne({ _id: doc._id }, doc, { upsert: true });
  res.json({ event: pub(doc) });
});

adminRouter.delete("/events/:id", async (req, res) => {
  await events().deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

/* ---------- settings, telegram, sync ---------- */

adminRouter.get("/settings", async (_req, res) => {
  res.json({
    telegramChatId: (await getSetting("telegramChatId")) ?? "",
    telegramChatIdEnv: config.telegramChatId,
    telegramTokenSet: Boolean(config.telegramToken),
    autoPublishEvents: (await getSetting("autoPublishEvents")) === "true",
    syncIntervalHours: config.syncIntervalHours,
  });
});

adminRouter.put("/settings", async (req, res) => {
  const b = req.body ?? {};
  if (typeof b.telegramChatId === "string") {
    await setSetting("telegramChatId", b.telegramChatId.trim().slice(0, 40));
  }
  if (typeof b.autoPublishEvents === "boolean") {
    await setSetting("autoPublishEvents", String(b.autoPublishEvents));
  }
  res.json({ ok: true });
});

adminRouter.post("/telegram/test", async (_req, res) => {
  const ok = await sendTestMessage();
  if (!ok) {
    res.status(400).json({ error: "Bot token or chat id not configured (send /start to the bot to get your chat id)" });
    return;
  }
  res.json({ ok: true });
});

adminRouter.post("/sync", async (_req, res) => {
  try {
    const result = await runSync();
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
