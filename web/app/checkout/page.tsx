"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatNaira } from "@/lib/catalog";

const PAYMENT_METHODS = [
  { id: "card", label: "Card (Paystack)", hint: "Visa, Mastercard, Verve" },
  { id: "transfer", label: "Bank transfer", hint: "Instant confirmation" },
  { id: "ussd", label: "USSD", hint: "*Any bank* — no data needed" },
  { id: "wallet", label: "OPay / PalmPay", hint: "Pay from your wallet" },
];

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("card");
  const [playerIds, setPlayerIds] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

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

  function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    const ref = `BAR-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
    const order = {
      ref,
      placedAt: new Date().toISOString(),
      email,
      phone,
      method: PAYMENT_METHODS.find((m) => m.id === method)?.label ?? method,
      playerIds,
      items: items.map((i) => ({ name: i.name, gameName: i.gameName, qty: i.qty, priceNgn: i.priceNgn })),
      total,
    };
    sessionStorage.setItem("baron-last-order", JSON.stringify(order));
    // Simulate the payment round-trip
    setTimeout(() => {
      clear();
      router.push("/success");
    }, 1400);
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
                <label key={gameId} className="block text-sm">
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
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="clip-card panel p-6">
            <h2 className="hud-label text-xs font-bold text-neon">3 · Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`clip-btn flex cursor-pointer items-center gap-3 border px-4 py-3 transition ${
                    method === m.id
                      ? "border-neon bg-neon/10"
                      : "border-edge hover:border-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    className="accent-[#35e0ff]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">{m.label}</span>
                    <span className="block text-xs text-slate-500">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
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
            {processing ? "Processing…" : `Pay ${formatNaira(total)}`}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Demo checkout — no real payment is taken.
          </p>
        </aside>
      </form>
    </div>
  );
}
