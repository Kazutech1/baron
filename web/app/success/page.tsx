"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/catalog";

type Order = {
  ref: string;
  placedAt: string;
  email: string;
  method: string;
  items: { name: string; gameName: string; qty: number; priceNgn: number }[];
  total: number;
};

export default function SuccessPage() {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("baron-last-order");
      setOrder(raw ? JSON.parse(raw) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) return null;

  if (order === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold uppercase text-white">No recent order</h1>
        <Link
          href="/games"
          className="clip-btn hud-label mt-6 inline-block bg-neon px-6 py-3 text-xs font-bold text-night-950 hover:brightness-110"
        >
          Browse games
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="clip-card panel p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-volt">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-volt" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display mt-5 text-3xl font-bold uppercase text-white">
          Order confirmed
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Reference <span className="font-mono font-bold text-neon">{order.ref}</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Paid via {order.method}. A receipt was sent to {order.email || "your email"}.
        </p>

        <ul className="mt-6 space-y-2 border-t border-edge pt-5 text-left text-sm text-slate-300">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span className="truncate">
                {i.qty}× {i.name} <span className="text-slate-500">· {i.gameName}</span>
              </span>
              <span className="shrink-0">{formatNaira(i.priceNgn * i.qty)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-edge pt-3 font-display text-base font-bold text-white">
            <span>Total</span>
            <span>{formatNaira(order.total)}</span>
          </li>
        </ul>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Delivery usually lands on your game ID within minutes. We&apos;ll ping your WhatsApp when
          it&apos;s done. (Demo build — nothing was actually charged or delivered.)
        </p>

        <Link
          href="/"
          className="clip-btn hud-label mt-8 inline-block bg-neon px-6 py-3 text-xs font-bold text-night-950 hover:brightness-110"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
