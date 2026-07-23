// Client-side helper for the admin dashboard (talks to the Loadax API with a bearer token).
import { API_URL } from "./api";
import { formatNaira } from "./catalog";

const TOKEN_KEY = "loadax-admin-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${getToken() ?? ""}`,
      ...init.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/admin/login")) {
      window.location.href = "/admin/login";
    }
    throw new Error("Session expired — log in again");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

/* ---------- shared admin types (mirror server wire format) ---------- */

export type AdminPack = {
  id: string;
  amount: string;
  bonus: string;
  priceNgn: number;
  popular: boolean;
  sort: number;
  active: boolean;
};

export type AdminGame = {
  id: string;
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
  packs: AdminPack[];
};

export type AdminSkin = {
  id: string;
  gameId: string;
  name: string;
  rarity: "Epic" | "Legendary" | "Mythic";
  priceNgn: number;
  image: string;
  sort: number;
  active: boolean;
};

export type AdminEvent = {
  id: string;
  gameId: string;
  title: string;
  blurb: string;
  image: string;
  tag: string;
  endsAt: string;
  status: "draft" | "live" | "archived";
};

export type AdminOrder = {
  id: string;
  email: string;
  phone: string;
  method: string;
  playerIds: Record<string, string>;
  totalNgn: number;
  status: "pending" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "failed";
  createdAt: string;
  items: { itemId: string; kind: string; gameId: string; gameName: string; name: string; priceNgn: number; qty: number }[];
};

/** WhatsApp supports a light markdown subset: *bold*, _italic_, and real line breaks. */
function whatsAppMessage(order: Pick<AdminOrder, "id" | "totalNgn" | "status" | "paymentStatus">): string {
  const ref = order.id;
  const total = formatNaira(order.totalNgn);

  if (order.status === "delivered") {
    return [
      "✅ *Delivered!*",
      "",
      `Hey! Your Loadax order *${ref}* has landed — sent straight to your game ID.`,
      "",
      "Enjoy! 🎮🔥",
    ].join("\n");
  }
  if (order.paymentStatus === "paid") {
    return [
      "💰 *Payment received!*",
      "",
      `Thanks for order *${ref}* — we've confirmed your payment of *${total}*.`,
      "",
      "Getting it ready now, delivery is on the way 🚀",
    ].join("\n");
  }
  return ["👋 Hey, this is *Loadax*!", "", `Reaching out about your order *${ref}* (*${total}*).`].join("\n");
}

/** Click-to-chat link, pre-filled with a status message — free, no WhatsApp API needed. */
export function whatsAppLink(
  order: Pick<AdminOrder, "id" | "phone" | "totalNgn" | "status" | "paymentStatus">
): string | null {
  const digits = order.phone.replace(/\D/g, "");
  if (!digits) return null;
  const phone = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppMessage(order))}`;
}

export type Overview = {
  stats: { pending: number; todayCount: number; todayTotal: number; deliveredCount: number; deliveredTotal: number };
  recentOrders: AdminOrder[];
  syncLogs: { at: string; summary: string }[];
  telegram: { tokenSet: boolean; chatId: string };
  draftEvents: number;
};

/* ---------- shared styles ---------- */

export const cls = {
  input:
    "w-full border border-edge bg-night-950 px-3 py-2 text-sm text-white outline-none transition focus:border-neon",
  label: "block text-xs font-semibold text-slate-400",
  btn: "clip-btn hud-label cursor-pointer border border-neon/60 bg-neon/10 px-3 py-2 text-[11px] font-bold text-neon transition hover:bg-neon/20 disabled:opacity-50",
  btnSolid:
    "clip-btn hud-label cursor-pointer bg-neon px-4 py-2 text-[11px] font-bold text-night-950 transition hover:brightness-110 disabled:opacity-50",
  btnDanger:
    "clip-btn hud-label cursor-pointer border border-red-400/60 bg-red-400/10 px-3 py-2 text-[11px] font-bold text-red-300 transition hover:bg-red-400/20",
  th: "px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500",
  td: "px-3 py-2.5 text-sm text-slate-300",
};

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}
