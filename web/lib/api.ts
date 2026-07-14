// Storefront data access — everything comes from the Baron API server.
import type { Game, GameEvent, Skin } from "./catalog";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** API image paths (e.g. /games/codm/icon.jpg) are served by the API server. */
export function assetUrl(p: string): string {
  return p?.startsWith("/") ? `${API_URL}${p}` : p;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

function absGame(g: Game): Game {
  return { ...g, icon: assetUrl(g.icon), card: assetUrl(g.card), banner: assetUrl(g.banner) };
}
const absSkin = (s: Skin): Skin => ({ ...s, image: assetUrl(s.image) });
const absEvent = (e: GameEvent): GameEvent => ({ ...e, image: assetUrl(e.image) });

export type Catalog = { games: Game[]; skins: Skin[]; events: GameEvent[] };

export async function getCatalog(): Promise<Catalog> {
  const data = await getJson<Catalog>("/api/catalog");
  return {
    games: data.games.map(absGame),
    skins: data.skins.map(absSkin),
    events: data.events.map(absEvent),
  };
}

export type GameDetail = { game: Game; skins: Skin[]; events: GameEvent[] };

export async function getGameDetail(id: string): Promise<GameDetail | null> {
  const res = await fetch(`${API_URL}/api/games/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for /api/games/${id}`);
  const data = (await res.json()) as GameDetail;
  return {
    game: absGame(data.game),
    skins: data.skins.map(absSkin),
    events: data.events.map(absEvent),
  };
}
