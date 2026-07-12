// Baron catalog — frontend-only demo data.
// Images in /public/games/* are real store artwork fetched by scripts/fetch-assets.mjs.
// Prices are demo figures in Naira; event end dates are placeholders for the demo.

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
  title: string;
  blurb: string;
  image: string;
  endsAt: string; // ISO date
  tag: string;
};

export const GAMES: Game[] = [
  {
    id: "codm",
    name: "Call of Duty: Mobile",
    publisher: "Activision",
    currency: "CP",
    tagline: "COD Points for Battle Pass, Lucky Draws & Mythic crates.",
    icon: "/games/codm/icon.jpg",
    card: "/games/codm/shot-3.jpg",
    banner: "/games/codm/shot-2.jpg",
    accent: "#f59e0b",
    packs: [
      { id: "codm-80", amount: "80 CP", priceNgn: 1600 },
      { id: "codm-400", amount: "400 CP", bonus: "+40 bonus", priceNgn: 7500 },
      { id: "codm-800", amount: "800 CP", bonus: "+80 bonus", priceNgn: 14800, popular: true },
      { id: "codm-2000", amount: "2000 CP", bonus: "+260 bonus", priceNgn: 36500 },
      { id: "codm-5000", amount: "5000 CP", bonus: "+800 bonus", priceNgn: 74500 },
      { id: "codm-10800", amount: "10800 CP", bonus: "+1500 bonus", priceNgn: 145000 },
    ],
  },
  {
    id: "mlbb",
    name: "Mobile Legends: Bang Bang",
    publisher: "Moonton",
    currency: "Diamonds",
    tagline: "Diamonds delivered straight to your MLBB user ID.",
    icon: "/games/mlbb/icon.jpg",
    card: "/games/mlbb/shot-2.jpg",
    banner: "/games/mlbb/shot-4.jpg",
    accent: "#38bdf8",
    packs: [
      { id: "mlbb-86", amount: "86 Diamonds", priceNgn: 1900 },
      { id: "mlbb-172", amount: "172 Diamonds", priceNgn: 3700 },
      { id: "mlbb-257", amount: "257 Diamonds", priceNgn: 5500 },
      { id: "mlbb-706", amount: "706 Diamonds", priceNgn: 14500, popular: true },
      { id: "mlbb-2195", amount: "2195 Diamonds", priceNgn: 43500 },
      { id: "mlbb-wdp", amount: "Weekly Diamond Pass", priceNgn: 2400 },
      { id: "mlbb-twilight", amount: "Twilight Pass", priceNgn: 12500 },
    ],
  },
  {
    id: "pubgm",
    name: "PUBG Mobile",
    publisher: "Tencent / Level Infinite",
    currency: "UC",
    tagline: "Unknown Cash for Royale Pass, crates & Naruto collab draws.",
    icon: "/games/pubgm/icon.jpg",
    card: "/games/pubgm/shot-3.jpg",
    banner: "/games/pubgm/shot-2.jpg",
    accent: "#fbbf24",
    packs: [
      { id: "pubgm-60", amount: "60 UC", priceNgn: 1500 },
      { id: "pubgm-325", amount: "325 UC", bonus: "+25 bonus", priceNgn: 7300 },
      { id: "pubgm-660", amount: "660 UC", bonus: "+60 bonus", priceNgn: 14500, popular: true },
      { id: "pubgm-1800", amount: "1800 UC", bonus: "+300 bonus", priceNgn: 36000 },
      { id: "pubgm-3850", amount: "3850 UC", bonus: "+550 bonus", priceNgn: 72000 },
      { id: "pubgm-8100", amount: "8100 UC", bonus: "+1200 bonus", priceNgn: 144000 },
    ],
  },
  {
    id: "freefire",
    name: "Free Fire",
    publisher: "Garena",
    currency: "Diamonds",
    tagline: "FF Diamonds — instant top-up with just your player ID.",
    icon: "/games/freefire/icon.jpg",
    card: "/games/freefire/shot-2.jpg",
    banner: "/games/freefire/shot-2.jpg",
    accent: "#fb923c",
    packs: [
      { id: "ff-100", amount: "100 Diamonds", priceNgn: 1300 },
      { id: "ff-310", amount: "310 Diamonds", priceNgn: 3900 },
      { id: "ff-520", amount: "520 Diamonds", priceNgn: 6400, popular: true },
      { id: "ff-1060", amount: "1060 Diamonds", priceNgn: 12800 },
      { id: "ff-2180", amount: "2180 Diamonds", priceNgn: 25500 },
      { id: "ff-5600", amount: "5600 Diamonds", priceNgn: 64000 },
    ],
  },
  {
    id: "bloodstrike",
    name: "Blood Strike",
    publisher: "NetEase",
    currency: "Gold",
    tagline: "Strike Gold for the Strike Pass & One-Punch Man collab.",
    icon: "/games/bloodstrike/icon.jpg",
    card: "/games/bloodstrike/shot-3.jpg",
    banner: "/games/bloodstrike/shot-3.jpg",
    accent: "#f87171",
    packs: [
      { id: "bs-300", amount: "300 Gold", priceNgn: 1500 },
      { id: "bs-980", amount: "980 Gold", bonus: "+80 bonus", priceNgn: 4800 },
      { id: "bs-1980", amount: "1980 Gold", bonus: "+180 bonus", priceNgn: 9500, popular: true },
      { id: "bs-3280", amount: "3280 Gold", bonus: "+380 bonus", priceNgn: 15800 },
      { id: "bs-6480", amount: "6480 Gold", bonus: "+880 bonus", priceNgn: 31000 },
    ],
  },
  {
    id: "fcmobile",
    name: "EA SPORTS FC Mobile",
    publisher: "EA Sports",
    currency: "FC Points",
    tagline: "FC Points for packs, players & World Cup events.",
    icon: "/games/fcmobile/icon.jpg",
    card: "/games/fcmobile/shot-2.jpg",
    banner: "/games/fcmobile/shot-2.jpg",
    accent: "#4ade80",
    packs: [
      { id: "fc-100", amount: "100 FC Points", priceNgn: 2200 },
      { id: "fc-500", amount: "500 FC Points", priceNgn: 10500 },
      { id: "fc-1050", amount: "1050 FC Points", priceNgn: 20500, popular: true },
      { id: "fc-2130", amount: "2130 FC Points", priceNgn: 41000 },
      { id: "fc-5580", amount: "5580 FC Points", priceNgn: 98000 },
    ],
  },
  {
    id: "efootball",
    name: "eFootball 2026",
    publisher: "Konami",
    currency: "Coins",
    tagline: "eFootball Coins for Epic packs & national team campaigns.",
    icon: "/games/efootball/icon.jpg",
    card: "/games/efootball/shot-2.jpg",
    banner: "/games/efootball/shot-2.jpg",
    accent: "#facc15",
    packs: [
      { id: "ef-130", amount: "130 Coins", priceNgn: 1600 },
      { id: "ef-550", amount: "550 Coins", priceNgn: 6500 },
      { id: "ef-1100", amount: "1100 Coins", priceNgn: 12800, popular: true },
      { id: "ef-2130", amount: "2130 Coins", priceNgn: 24500 },
      { id: "ef-3900", amount: "3900 Coins", priceNgn: 44000 },
    ],
  },
  {
    id: "deltaforce",
    name: "Delta Force",
    publisher: "TiMi Studio Group",
    currency: "Delta Coins",
    tagline: "Delta Coins for operators, weapon mods & seasonal passes.",
    icon: "/games/deltaforce/icon.jpg",
    card: "/games/deltaforce/shot-2.jpg",
    banner: "/games/deltaforce/shot-2.jpg",
    accent: "#a78bfa",
    packs: [
      { id: "df-60", amount: "60 Delta Coins", priceNgn: 1500 },
      { id: "df-320", amount: "320 Delta Coins", bonus: "+16 bonus", priceNgn: 7400 },
      { id: "df-640", amount: "640 Delta Coins", bonus: "+45 bonus", priceNgn: 14600, popular: true },
      { id: "df-1280", amount: "1280 Delta Coins", bonus: "+110 bonus", priceNgn: 29000 },
      { id: "df-3240", amount: "3240 Delta Coins", bonus: "+350 bonus", priceNgn: 72500 },
    ],
  },
];

export const SKINS: Skin[] = [
  { id: "skin-codm-p5", gameId: "codm", name: "Phantom Thieves Draw Bundle", rarity: "Mythic", priceNgn: 45000, image: "/games/codm/shot-2.jpg" },
  { id: "skin-codm-undead", gameId: "codm", name: "Undead Warlord Crate", rarity: "Legendary", priceNgn: 28500, image: "/games/codm/shot-4.jpg" },
  { id: "skin-mlbb-sf6", gameId: "mlbb", name: "SF6 Collab Skin Chest", rarity: "Legendary", priceNgn: 22000, image: "/games/mlbb/shot-3.jpg" },
  { id: "skin-mlbb-infernal", gameId: "mlbb", name: "Infernal Juggernaut Skin", rarity: "Epic", priceNgn: 14500, image: "/games/mlbb/shot-2.jpg" },
  { id: "skin-pubgm-naruto", gameId: "pubgm", name: "Naruto Shippuden Crate", rarity: "Mythic", priceNgn: 32000, image: "/games/pubgm/shot-3.jpg" },
  { id: "skin-bs-railgun", gameId: "bloodstrike", name: "Galactic Striker Vehicle Skin", rarity: "Epic", priceNgn: 9800, image: "/games/bloodstrike/shot-2.jpg" },
  { id: "skin-ff-anniv", gameId: "freefire", name: "9th Anniversary Bundle", rarity: "Epic", priceNgn: 8500, image: "/games/freefire/banner.jpg" },
  { id: "skin-df-colosseum", gameId: "deltaforce", name: "Colosseum Assault Operator Pack", rarity: "Legendary", priceNgn: 18000, image: "/games/deltaforce/shot-2.jpg" },
];

export const EVENTS: GameEvent[] = [
  {
    id: "ev-mlbb-sf6",
    gameId: "mlbb",
    title: "MLBB × Street Fighter 6",
    blurb: "Fighting Spirit Awakens — Ryu, Ken, Guile & Chun-Li collab skins land in the Exchange Shop.",
    image: "/games/mlbb/shot-4.jpg",
    endsAt: "2026-08-02T23:59:59+01:00",
    tag: "Collab",
  },
  {
    id: "ev-codm-p5",
    gameId: "codm",
    title: "CODM × Persona 5",
    blurb: "The Phantom Thieves take the battlefield. Themed Lucky Draws, login rewards & ranked drops.",
    image: "/games/codm/shot-2.jpg",
    endsAt: "2026-08-09T23:59:59+01:00",
    tag: "Collab",
  },
  {
    id: "ev-pubgm-naruto",
    gameId: "pubgm",
    title: "PUBG Mobile × Naruto Shippuden",
    blurb: "Kurama over Erangel. Naruto & Sasuke sets, Tailed-Beast emotes and collab crate discounts.",
    image: "/games/pubgm/shot-2.jpg",
    endsAt: "2026-07-28T23:59:59+01:00",
    tag: "Collab",
  },
  {
    id: "ev-bs-opm",
    gameId: "bloodstrike",
    title: "Blood Strike × One-Punch Man",
    blurb: "Saitama and Genos join the Strike. Collab pass, OPM finishers & limited lobby themes.",
    image: "/games/bloodstrike/shot-3.jpg",
    endsAt: "2026-07-24T23:59:59+01:00",
    tag: "Collab",
  },
  {
    id: "ev-ff-anniv",
    gameId: "freefire",
    title: "Free Fire 9th Anniversary",
    blurb: "9 years of Booyah! Free rewards all month, anniversary bundles & the Pilot Duck returns.",
    image: "/games/freefire/shot-2.jpg",
    endsAt: "2026-08-23T23:59:59+01:00",
    tag: "Anniversary",
  },
  {
    id: "ev-ef-nations",
    gameId: "efootball",
    title: "eFootball Nations Takeover",
    blurb: "National team campaigns with Epic international packs — Argentina, Brazil, Japan & more.",
    image: "/games/efootball/shot-2.jpg",
    endsAt: "2026-07-31T23:59:59+01:00",
    tag: "Season",
  },
];

export function getGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

export function skinsFor(gameId: string): Skin[] {
  return SKINS.filter((s) => s.gameId === gameId);
}

export function formatNaira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}
