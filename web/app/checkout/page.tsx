"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { API_URL, initializePayment } from "@/lib/api";
import { formatNaira } from "@/lib/catalog";

/** Games that need a zone/server id alongside the player id (e.g. Mobile Legends). */
const SERVER_ID_GAMES = new Set(["mlbb"]);

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [playerIds, setPlayerIds] = useState<Record<string, string>>({});
  const [serverIds, setServerIds] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const games = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) map.set(item.gameId, item.gameName);
    return [...map.entries()];
  }, [items]);

  if (items.length === 0 && !processing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold uppercase text-white">Nothing to check out</h1>
        <p className="mt-3 text-sm text-slate-400">Your cart is empty.</p>
        <Link
          href="/games"
          className="clip-btn hud-label mt-6 inline-block bg-neon px-6 py-3 text-xs font-bold text-night-950 hover:brightness-110"
        >
          Browse games
        </Link>
      </div>
    );
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    try {
      const finalPlayerIds = { ...playerIds };
      for (const gameId of SERVER_ID_GAMES) {
        if (finalPlayerIds[gameId] && serverIds[gameId]) {
          finalPlayerIds[gameId] = `${finalPlayerIds[gameId]} (${serverIds[gameId]})`;
        }
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          method: "Pay online (Paystack)",
          playerIds: finalPlayerIds,
          items: items.map((i) => ({ id: i.id, kind: i.kind, qty: i.qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Order failed (${res.status})`);
      const order = data.order;

      const { authorizationUrl } = await initializePayment(order.id);
      clear();
      window.location.href = authorizationUrl;
    } catch (err) {
      setError((err as Error).message);
      setProcessing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="hud-label text-xs font-bold text-volt">Final step</p>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase text-white">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {/* Contact */}
          <section className="clip-card panel p-6">
            <h2 className="hud-label text-xs font-bold text-neon">1 · Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-300">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full border border-edge bg-night-950 px-3 py-2.5 text-white outline-none transition focus:border-neon"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-300">WhatsApp number</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0803 000 0000"
                  className="mt-1.5 w-full border border-edge bg-night-950 px-3 py-2.5 text-white outline-none transition focus:border-neon"
                />
              </label>
            </div>
          </section>

          {/* Player IDs */}
          <section className="clip-card panel p-6">
            <h2 className="hud-label text-xs font-bold text-neon">2 · Delivery — your game IDs</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Tokens are delivered directly to these accounts. Triple-check every ID.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {games.map(([gameId, gameName]) => (
                <div key={gameId} className={SERVER_ID_GAMES.has(gameId) ? "grid gap-4 sm:col-span-2 sm:grid-cols-2" : "contents"}>
                  <label className="block text-sm">
                    <span className="text-slate-300">{gameName} player ID</span>
                    <input
                      type="text"
                      required
                      value={playerIds[gameId] ?? ""}
                      onChange={(e) => setPlayerIds((p) => ({ ...p, [gameId]: e.target.value }))}
                      placeholder="e.g. 5524 198 7723"
                      className="mt-1.5 w-full border border-edge bg-night-950 px-3 py-2.5 font-mono text-white outline-none transition focus:border-neon"
                    />
                  </label>
                  {SERVER_ID_GAMES.has(gameId) && (
                    <label className="block text-sm">
                      <span className="text-slate-300">{gameName} server ID</span>
                      <input
                        type="text"
                        required
                        value={serverIds[gameId] ?? ""}
                        onChange={(e) => setServerIds((s) => ({ ...s, [gameId]: e.target.value }))}
                        placeholder="e.g. 1234"
                        className="mt-1.5 w-full border border-edge bg-night-950 px-3 py-2.5 font-mono text-white outline-none transition focus:border-neon"
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="clip-card panel p-6">
            <h2 className="hud-label text-xs font-bold text-neon">3 · Payment</h2>
            <p className="mt-3 text-sm text-slate-300">
              You&apos;ll be redirected to Paystack&apos;s secure checkout — pay by card, bank transfer, or USSD.
            </p>
          </section>
        </div>

        {/* Summary */}
        <aside className="clip-card panel h-fit p-6">
          <p className="hud-label text-xs font-bold text-neon">Order summary</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="truncate">
                  {i.qty}× {i.name}
                </span>
                <span className="shrink-0">{formatNaira(i.priceNgn * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-edge pt-3 font-display text-lg font-bold text-white">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
          <button
            type="submit"
            disabled={processing}
            className="clip-btn hud-label mt-6 w-full bg-neon px-6 py-3 text-xs font-bold text-night-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {processing ? "Redirecting to Paystack…" : `Place order — ${formatNaira(total)}`}
          </button>
          {error && (
            <p className="mt-3 text-center text-xs font-semibold text-red-400">{error}</p>
          )}
          <p className="mt-3 text-center text-[11px] text-slate-500">
            You&apos;ll be redirected to Paystack&apos;s secure checkout to pay.
          </p>
        </aside>
      </form>
    </div>
  );
}
