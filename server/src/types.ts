export type Pack = {
  id: string;
  amount: string;
  bonus: string;
  priceNgn: number;
  popular: boolean;
  sort: number;
  active: boolean;
};

export type GameDoc = {
  _id: string;
  name: string;
  publisher: string;
  currency: string;
  tagline: string;
  accent: string;
  icon: string;
  card: string;
  banner: string;
  playPackageId: string;
  itunesTerm: string;
  screenshots?: string[];
  sort: number;
  active: boolean;
  packs: Pack[];
};

export type SkinDoc = {
  _id: string;
  gameId: string;
  name: string;
  rarity: "Epic" | "Legendary" | "Mythic";
  priceNgn: number;
  image: string;
  sort: number;
  active: boolean;
};

export type EventStatus = "draft" | "live" | "archived";

export type EventDoc = {
  _id: string;
  gameId: string;
  title: string;
  blurb: string;
  image: string;
  tag: string;
  endsAt: string;
  status: EventStatus;
};

export type OrderStatus = "pending" | "delivered" | "cancelled";

export type OrderItem = {
  itemId: string;
  kind: "pack" | "skin";
  gameId: string;
  gameName: string;
  name: string;
  priceNgn: number;
  qty: number;
};

export type OrderDoc = {
  _id: string; // the order ref, e.g. BAR-XXXX
  email: string;
  phone: string;
  method: string;
  playerIds: Record<string, string>;
  totalNgn: number;
  status: OrderStatus;
  telegramMsgId: number | null;
  createdAt: Date;
  updatedAt: Date | null;
  items: OrderItem[];
};

export type SettingDoc = { _id: string; value: string };

export type SyncLogDoc = { at: Date; summary: string };

/** Wire format: `_id` → `id`. */
export function pub<T extends { _id: string }>(doc: T): Omit<T, "_id"> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}
