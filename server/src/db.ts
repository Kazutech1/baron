import fs from "node:fs";
import path from "node:path";
import { Binary, MongoClient, type Collection, type Db } from "mongodb";
import { config } from "./config.ts";
import { SEED_EVENTS, SEED_GAMES, SEED_SKINS } from "./seed-data.ts";
import type {
  EventDoc,
  GameDoc,
  OrderDoc,
  OrderItem,
  OrderStatus,
  SettingDoc,
  SkinDoc,
  SyncLogDoc,
} from "./types.ts";

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (database) return database;
  client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  database = client.db(config.mongoDb);
  await seedIfEmpty(database);
  return database;
}

export function db(): Db {
  if (!database) throw new Error("DB not connected yet");
  return database;
}

/** Game artwork stored in Mongo so it survives ephemeral filesystems (Render etc). */
export type ImageDoc = { _id: string; contentType: string; data: Binary; updatedAt: Date };

export const images = (): Collection<ImageDoc> => db().collection<ImageDoc>("images");

export async function saveImage(pathKey: string, contentType: string, data: Buffer): Promise<void> {
  await images().updateOne(
    { _id: pathKey },
    { $set: { contentType, data: new Binary(data), updatedAt: new Date() } },
    { upsert: true }
  );
}

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * One-time migration: if the images collection is empty and a legacy
 * public/games directory exists locally, import its files into Mongo.
 */
export async function importLocalImages(): Promise<void> {
  const count = await images().estimatedDocumentCount();
  if (count > 0) return;
  const root = path.resolve(import.meta.dirname, "..", "public", "games");
  if (!fs.existsSync(root)) return;
  let imported = 0;
  for (const gameDir of fs.readdirSync(root, { withFileTypes: true })) {
    if (!gameDir.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(root, gameDir.name))) {
      const mime = MIME_BY_EXT[path.extname(file).toLowerCase()];
      if (!mime) continue;
      const data = fs.readFileSync(path.join(root, gameDir.name, file));
      await saveImage(`/games/${gameDir.name}/${file}`, mime, data);
      imported += 1;
    }
  }
  if (imported > 0) console.log(`[db] imported ${imported} local images into Mongo`);
}

export const games = (): Collection<GameDoc> => db().collection<GameDoc>("games");
export const skins = (): Collection<SkinDoc> => db().collection<SkinDoc>("skins");
export const events = (): Collection<EventDoc> => db().collection<EventDoc>("events");
export const orders = (): Collection<OrderDoc> => db().collection<OrderDoc>("orders");
export const settings = (): Collection<SettingDoc> => db().collection<SettingDoc>("settings");
export const syncLog = (): Collection<SyncLogDoc> => db().collection<SyncLogDoc>("synclog");

async function seedIfEmpty(d: Db) {
  const count = await d.collection("games").estimatedDocumentCount();
  if (count > 0) return;
  await d.collection<GameDoc>("games").insertMany(SEED_GAMES);
  await d.collection<SkinDoc>("skins").insertMany(SEED_SKINS);
  await d.collection<EventDoc>("events").insertMany(SEED_EVENTS);
  console.log(`[db] seeded ${SEED_GAMES.length} games, ${SEED_SKINS.length} skins, ${SEED_EVENTS.length} events`);
}

/* ---------- settings ---------- */

export async function getSetting(key: string): Promise<string | null> {
  const doc = await settings().findOne({ _id: key });
  return doc?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await settings().updateOne({ _id: key }, { $set: { value } }, { upsert: true });
}

/** Effective Telegram chat id: admin-configured setting wins over env. */
export async function telegramChatId(): Promise<string> {
  return (await getSetting("telegramChatId")) || config.telegramChatId;
}

/* ---------- orders ---------- */

export async function createOrder(input: {
  email: string;
  phone: string;
  method: string;
  playerIds: Record<string, string>;
  items: { id: string; kind: "pack" | "skin"; qty: number }[];
}): Promise<OrderDoc> {
  const lines: OrderItem[] = [];
  for (const item of input.items) {
    const qty = Math.max(1, Math.min(50, Math.floor(item.qty || 1)));
    if (item.kind === "pack") {
      const game = await games().findOne(
        { active: true, packs: { $elemMatch: { id: item.id, active: true } } },
        { projection: { name: 1, "packs.$": 1 } }
      );
      const pack = game?.packs?.[0];
      if (!game || !pack) throw new Error(`Unknown pack: ${item.id}`);
      lines.push({
        itemId: pack.id,
        kind: "pack",
        gameId: game._id,
        gameName: game.name,
        name: `${pack.amount}${pack.bonus ? ` (${pack.bonus})` : ""}`,
        priceNgn: pack.priceNgn,
        qty,
      });
    } else {
      const skin = await skins().findOne({ _id: item.id, active: true });
      if (!skin) throw new Error(`Unknown skin: ${item.id}`);
      const game = await games().findOne({ _id: skin.gameId });
      lines.push({
        itemId: skin._id,
        kind: "skin",
        gameId: skin.gameId,
        gameName: game?.name ?? skin.gameId,
        name: skin.name,
        priceNgn: skin.priceNgn,
        qty,
      });
    }
  }
  if (lines.length === 0) throw new Error("Empty order");

  const order: OrderDoc = {
    _id: `BAR-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`,
    email: input.email,
    phone: input.phone,
    method: input.method,
    playerIds: input.playerIds,
    totalNgn: lines.reduce((n, l) => n + l.priceNgn * l.qty, 0),
    status: "pending",
    paymentStatus: "unpaid",
    paymentRef: null,
    paidAt: null,
    telegramMsgId: null,
    createdAt: new Date(),
    updatedAt: null,
    items: lines,
  };
  await orders().insertOne(order);
  return order;
}

export async function setOrderStatus(ref: string, status: OrderStatus): Promise<OrderDoc | null> {
  await orders().updateOne({ _id: ref }, { $set: { status, updatedAt: new Date() } });
  return orders().findOne({ _id: ref });
}

export async function setOrderPaymentRef(ref: string, paymentRef: string): Promise<void> {
  await orders().updateOne({ _id: ref }, { $set: { paymentRef } });
}

/**
 * Idempotent: the `paymentStatus: { $ne: "paid" }` guard means a late/duplicate "failed"
 * verify can never downgrade an order the webhook already marked paid, and marking paid
 * twice (webhook + return-page verify racing) is a no-op the second time.
 */
export async function updatePaymentStatus(
  ref: string,
  status: "paid" | "failed",
  paymentRef: string
): Promise<OrderDoc | null> {
  await orders().updateOne(
    { _id: ref, paymentStatus: { $ne: "paid" } },
    {
      $set: {
        paymentStatus: status,
        paymentRef,
        updatedAt: new Date(),
        ...(status === "paid" ? { paidAt: new Date() } : {}),
      },
    }
  );
  return orders().findOne({ _id: ref });
}

export async function orderStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [pending, todayAgg, deliveredAgg] = await Promise.all([
    orders().countDocuments({ status: "pending" }),
    orders()
      .aggregate([
        { $match: { createdAt: { $gte: startOfToday }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, n: { $sum: 1 }, total: { $sum: "$totalNgn" } } },
      ])
      .toArray(),
    orders()
      .aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, n: { $sum: 1 }, total: { $sum: "$totalNgn" } } },
      ])
      .toArray(),
  ]);
  return {
    pending,
    todayCount: todayAgg[0]?.n ?? 0,
    todayTotal: todayAgg[0]?.total ?? 0,
    deliveredCount: deliveredAgg[0]?.n ?? 0,
    deliveredTotal: deliveredAgg[0]?.total ?? 0,
  };
}
