"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatNaira } from "@/lib/catalog";

export default function CartPage() {
  const { items, setQty, remove, total, count } = useCart();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="hud-label text-xs font-bold text-volt">Loadout</p>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase text-white">Your cart</h1>

      {items.length === 0 ? (
        <div className="clip-card panel mt-10 flex flex-col items-center gap-4 p-12 text-center">
          <p className="font-display text-xl font-bold text-white">Cart&apos;s empty, soldier.</p>
          <p className="text-sm text-slate-400">Grab some tokens or a skin and come back.</p>
          <Link
            href="/games"
            className="clip-btn hud-label mt-2 bg-neon px-6 py-3 text-xs font-bold text-night-950 hover:brightness-110"
          >
            Browse games
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {items.map((item) => {
              const removeButton = (extra: string) => (
                <button
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className={`p-1 text-slate-500 transition hover:text-red-400 ${extra}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              );
              return (
                <div key={item.id} className="clip-card panel p-4 sm:flex sm:items-center sm:gap-4">
                  <div className="flex items-center gap-4 sm:min-w-0 sm:flex-1">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden">
                      <Image src={item.image} alt="" fill sizes="64px" className="clip-btn object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-bold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.gameName} · {item.kind === "pack" ? "Top-up" : "Skin"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neon">{formatNaira(item.priceNgn)}</p>
                    </div>
                    {removeButton("sm:hidden")}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 sm:mt-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(item.id, item.qty - 1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="clip-btn border border-edge px-3 py-1.5 text-sm font-bold text-slate-300 hover:border-neon/60 hover:text-neon"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-mono text-sm font-bold text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => setQty(item.id, item.qty + 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="clip-btn border border-edge px-3 py-1.5 text-sm font-bold text-slate-300 hover:border-neon/60 hover:text-neon"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-display font-bold text-white sm:w-24 sm:text-right">
                      {formatNaira(item.priceNgn * item.qty)}
                    </p>
                    {removeButton("hidden sm:block")}
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="clip-card panel h-fit p-6">
            <p className="hud-label text-xs font-bold text-neon">Order summary</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-300">
                <dt>Items ({count})</dt>
                <dd>{formatNaira(total)}</dd>
              </div>
              <div className="flex justify-between text-slate-300">
                <dt>Service fee</dt>
                <dd className="text-volt">Free</dd>
              </div>
              <div className="flex justify-between border-t border-edge pt-3 font-display text-lg font-bold text-white">
                <dt>Total</dt>
                <dd>{formatNaira(total)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="clip-btn hud-label mt-6 block bg-neon px-6 py-3 text-center text-xs font-bold text-night-950 hover:brightness-110"
            >
              Checkout
            </Link>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Demo checkout — no real payment is taken.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
