import { Router } from "express";
import { events, games, orders, skins, createOrder } from "../db.ts";
import { notifyNewOrder } from "../telegram.ts";
import { pub } from "../types.ts";

export const publicRouter = Router();

function activePacksOnly<T extends { packs: { active: boolean; sort: number }[] }>(game: T): T {
  return { ...game, packs: game.packs.filter((p) => p.active).sort((a, b) => a.sort - b.sort) };
}

async function gameNameMap(): Promise<Map<string, { name: string; currency: string }>> {
  const list = await games().find({}, { projection: { name: 1, currency: 1 } }).toArray();
  return new Map(list.map((g) => [g._id, { name: g.name, currency: g.currency }]));
}

/** Everything the storefront needs in one call. */
publicRouter.get("/catalog", async (_req, res) => {
  const [gameList, skinList, eventList, names] = await Promise.all([
    games().find({ active: true }).sort({ sort: 1, name: 1 }).toArray(),
    skins().find({ active: true }).sort({ sort: 1, name: 1 }).toArray(),
    events().find({ status: "live" }).sort({ endsAt: 1 }).toArray(),
    gameNameMap(),
  ]);
  res.json({
    games: gameList.map((g) => pub(activePacksOnly(g))),
    skins: skinList.map((s) => ({ ...pub(s), gameName: names.get(s.gameId)?.name ?? s.gameId })),
    events: eventList.map((e) => ({
      ...pub(e),
      gameName: names.get(e.gameId)?.name ?? e.gameId,
      gameCurrency: names.get(e.gameId)?.currency ?? "",
    })),
  });
});

publicRouter.get("/games/:id", async (req, res) => {
  const game = await games().findOne({ _id: req.params.id, active: true });
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  const [gameSkins, gameEvents] = await Promise.all([
    skins().find({ gameId: game._id, active: true }).sort({ sort: 1 }).toArray(),
    events().find({ gameId: game._id, status: "live" }).sort({ endsAt: 1 }).toArray(),
  ]);
  res.json({
    game: pub(activePacksOnly(game)),
    skins: gameSkins.map((s) => ({ ...pub(s), gameName: game.name })),
    events: gameEvents.map((e) => ({ ...pub(e), gameName: game.name, gameCurrency: game.currency })),
  });
});

publicRouter.post("/orders", async (req, res) => {
  const { email, phone, method, playerIds, items } = req.body ?? {};
  if (typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    res.status(400).json({ error: "Order items required" });
    return;
  }
  try {
    const order = await createOrder({
      email: email.slice(0, 200),
      phone: typeof phone === "string" ? phone.slice(0, 40) : "",
      method: typeof method === "string" ? method.slice(0, 60) : "",
      playerIds:
        playerIds && typeof playerIds === "object"
          ? Object.fromEntries(
              Object.entries(playerIds as Record<string, unknown>)
                .filter(([, v]) => typeof v === "string")
                .map(([k, v]) => [k.slice(0, 40), (v as string).slice(0, 80)])
            )
          : {},
      items: items.map((i: { id: unknown; kind: unknown; qty: unknown }) => ({
        id: String(i.id),
        kind: i.kind === "skin" ? "skin" as const : "pack" as const,
        qty: Number(i.qty) || 1,
      })),
    });
    notifyNewOrder(order).catch((err) => console.error("[telegram] notify failed:", err.message));
    res.status(201).json({ order: pub(order) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

publicRouter.get("/orders/:ref", async (req, res) => {
  const order = await orders().findOne({ _id: req.params.ref });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  // public lookup: expose delivery status without personal details
  res.json({ ref: order._id, status: order.status, totalNgn: order.totalNgn, createdAt: order.createdAt });
});
