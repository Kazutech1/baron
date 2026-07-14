import { MongoClient, type Collection, type Db } from "mongodb";
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
