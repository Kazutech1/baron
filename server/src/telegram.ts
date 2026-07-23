// Telegram bot for manual order fulfilment.
// Outbound: new-order notifications with inline action buttons.
// Inbound (long polling): /start, /orders, /stats commands + button callbacks.
import { config } from "./config.ts";
import { orders, orderStats, setOrderStatus, telegramChatId } from "./db.ts";
import type { OrderDoc, PaymentStatus } from "./types.ts";

const API = () => `https://api.telegram.org/bot${config.telegramToken}`;

type TgResult<T> = { ok: boolean; result?: T; description?: string };

async function tg<T = unknown>(method: string, params: Record<string, unknown>): Promise<T | null> {
  if (!config.telegramToken) return null;
  try {
    const res = await fetch(`${API()}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as TgResult<T>;
    if (!data.ok) {
      console.error(`[telegram] ${method} failed: ${data.description}`);
      return null;
    }
    return data.result ?? null;
  } catch (err) {
    console.error(`[telegram] ${method} error:`, (err as Error).message);
    return null;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function naira(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

const STATUS_ICON: Record<OrderDoc["status"], string> = {
  pending: "🟡 PENDING",
  delivered: "✅ DELIVERED",
  cancelled: "❌ CANCELLED",
};

const PAYMENT_ICON: Record<PaymentStatus, string> = {
  unpaid: "⏳ UNPAID",
  paid: "💰 PAID",
  failed: "⚠️ PAYMENT FAILED",
};

/** Nigerian local (0xxx) or already-international number → digits-only international form for wa.me. */
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

/** Click-to-chat link, pre-filled with a status message — free, no WhatsApp API needed. */
function whatsAppLink(order: OrderDoc): string | null {
  const phone = normalizePhone(order.phone);
  if (!phone) return null;
  const text =
    order.status === "delivered"
      ? `Hi! Your Baron order ${order._id} has been delivered ✅ Enjoy!`
      : `Hi! This is Baron regarding your order ${order._id} (${naira(order.totalNgn)}).`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function orderMessage(order: OrderDoc): string {
  const lines = order.items
    .map((i) => `• ${i.qty}× ${esc(i.name)} — ${esc(i.gameName)} — ${naira(i.priceNgn * i.qty)}`)
    .join("\n");
  const ids = Object.entries(order.playerIds)
    .map(([gameId, id]) => `  ${esc(gameId)}: <code>${esc(id)}</code>`)
    .join("\n");
  return [
    `🛒 <b>ORDER ${esc(order._id)}</b> — <b>${naira(order.totalNgn)}</b>`,
    ``,
    lines,
    ``,
    `👤 ${esc(order.email)}${order.phone ? ` / ${esc(order.phone)}` : ""}`,
    `🎮 Player IDs:\n${ids || "  (none)"}`,
    `💳 ${esc(order.method)}`,
    ``,
    STATUS_ICON[order.status],
    PAYMENT_ICON[order.paymentStatus],
  ].join("\n");
}

function orderKeyboard(order: OrderDoc) {
  const rows: { text: string; callback_data?: string; url?: string }[][] = [];
  if (order.status === "pending") {
    rows.push([
      { text: "✅ Mark delivered", callback_data: `d:${order._id}` },
      { text: "❌ Cancel order", callback_data: `c:${order._id}` },
    ]);
  }
  const wa = whatsAppLink(order);
  if (wa) rows.push([{ text: "💬 Message customer on WhatsApp", url: wa }]);
  return { inline_keyboard: rows };
}

/** Send the new-order notification; returns the Telegram message id. */
export async function notifyNewOrder(order: OrderDoc): Promise<number | null> {
  const chatId = await telegramChatId();
  if (!chatId) {
    console.warn("[telegram] no chat id configured — order notification skipped");
    return null;
  }
  const msg = await tg<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: orderMessage(order),
    parse_mode: "HTML",
    reply_markup: orderKeyboard(order),
  });
  if (msg) await orders().updateOne({ _id: order._id }, { $set: { telegramMsgId: msg.message_id } });
  return msg?.message_id ?? null;
}

/** Keep the Telegram message in sync when status changes (from bot or dashboard). */
export async function refreshOrderMessage(order: OrderDoc): Promise<void> {
  const chatId = await telegramChatId();
  if (!chatId || !order.telegramMsgId) return;
  await tg("editMessageText", {
    chat_id: chatId,
    message_id: order.telegramMsgId,
    text: orderMessage(order),
    parse_mode: "HTML",
    reply_markup: orderKeyboard(order),
  });
}

export async function sendTestMessage(): Promise<boolean> {
  const chatId = await telegramChatId();
  if (!chatId) return false;
  const res = await tg("sendMessage", {
    chat_id: chatId,
    text: "⚡ Baron test — the bot is wired up correctly.",
  });
  return res !== null;
}

/* ---------- inbound updates ---------- */

type TgUpdate = {
  update_id: number;
  message?: { message_id: number; text?: string; chat: { id: number; type: string } };
  callback_query?: {
    id: string;
    data?: string;
    from: { id: number };
    message?: { message_id: number; chat: { id: number } };
  };
};

async function isAdminChat(chatId: number | string): Promise<boolean> {
  const configured = await telegramChatId();
  return configured !== "" && String(chatId) === String(configured);
}

async function handleCommand(chatId: number, text: string) {
  const cmd = text.trim().split(/[\s@]/)[0].toLowerCase();

  if (cmd === "/start" || cmd === "/id") {
    const configured = await isAdminChat(chatId);
    await tg("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: [
        `👑 <b>Baron bot</b>`,
        ``,
        `Your chat id: <code>${chatId}</code>`,
        configured
          ? `This chat receives order notifications. Commands: /orders /stats`
          : `Set this id as TELEGRAM_CHAT_ID in server/.env (or in the admin dashboard → Settings) to receive order notifications here.`,
      ].join("\n"),
    });
    return;
  }

  if (!(await isAdminChat(chatId))) return; // ignore everything else from strangers

  if (cmd === "/orders") {
    const pending = await orders().find({ status: "pending" }).sort({ createdAt: -1 }).limit(10).toArray();
    if (pending.length === 0) {
      await tg("sendMessage", { chat_id: chatId, text: "No pending orders. 🎉" });
      return;
    }
    for (const order of pending) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: orderMessage(order),
        parse_mode: "HTML",
        reply_markup: orderKeyboard(order),
      });
    }
    return;
  }

  if (cmd === "/stats") {
    const s = await orderStats();
    await tg("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: [
        `📊 <b>Baron stats</b>`,
        `Pending: <b>${s.pending}</b>`,
        `Today: <b>${s.todayCount}</b> orders — ${naira(s.todayTotal)}`,
        `Delivered all-time: <b>${s.deliveredCount}</b> — ${naira(s.deliveredTotal)}`,
      ].join("\n"),
    });
  }
}

async function handleCallback(cb: NonNullable<TgUpdate["callback_query"]>) {
  const chatId = cb.message?.chat.id;
  const answer = (text: string) => tg("answerCallbackQuery", { callback_query_id: cb.id, text });

  if (!chatId || !(await isAdminChat(chatId))) {
    await answer("Not authorised.");
    return;
  }
  const [action, ref] = (cb.data ?? "").split(":");
  if (!ref || (action !== "d" && action !== "c")) {
    await answer("Unknown action.");
    return;
  }
  const order = await setOrderStatus(ref, action === "d" ? "delivered" : "cancelled");
  if (!order) {
    await answer(`Order ${ref} not found.`);
    return;
  }
  await refreshOrderMessage(order);
  await answer(action === "d" ? `${ref} marked delivered ✅` : `${ref} cancelled ❌`);
}

async function handleUpdate(update: TgUpdate) {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
  } else if (update.message?.text && update.message.chat.type === "private") {
    await handleCommand(update.message.chat.id, update.message.text);
  }
}

/* ---------- long-poll loop ---------- */

let polling = false;

export async function startBot() {
  if (!config.telegramToken) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set — bot disabled");
    return;
  }
  // long polling conflicts with a registered webhook
  await tg("deleteWebhook", { drop_pending_updates: false });
  polling = true;
  let offset = 0;
  console.log("[telegram] bot polling started");
  while (polling) {
    try {
      const updates = await tg<TgUpdate[]>("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message", "callback_query"],
      });
      if (updates) {
        for (const update of updates) {
          offset = update.update_id + 1;
          try {
            await handleUpdate(update);
          } catch (err) {
            console.error("[telegram] update handler error:", (err as Error).message);
          }
        }
      } else {
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export function stopBot() {
  polling = false;
}
