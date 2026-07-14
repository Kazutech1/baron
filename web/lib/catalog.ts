// Shared storefront types (data comes from the Baron API — see lib/api.ts).

export type Pack = {
  id: string;
  amount: string;
  bonus?: string;
  priceNgn: number;
  popular?: boolean;
};

export type Skin = {
  id: string;
  gameId: string;
  gameName?: string;
  name: string;
  rarity: "Epic" | "Legendary" | "Mythic";
  priceNgn: number;
  image: string;
};

export type Game = {
  id: string;
  name: string;
  publisher: string;
  currency: string;
  tagline: string;
  icon: string;
  card: string;
  banner: string;
  accent: string;
  packs: Pack[];
};

export type GameEvent = {
  id: string;
  gameId: string;
  gameName?: string;
  gameCurrency?: string;
  title: string;
  blurb: string;
  image: string;
  endsAt: string; // ISO date
  tag: string;
};

export function formatNaira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}
