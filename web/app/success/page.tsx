"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { verifyPayment, type PaymentStatus } from "@/lib/api";
import { formatNaira } from "@/lib/catalog";

type Order = {
  ref: string;
  placedAt: string;
  email: string;
  method: string;
  items: { name: string; gameName: string; qty: number; priceNgn: number }[];
  total: number;
};

/** Poll a few times right after the Paystack redirect — the webhook can beat us here, or lag a second or two. */
function usePaymentStatus(ref: string | null): PaymentStatus | "checking" | null {
  const [status, setStatus] = useState<PaymentStatus | "checking" | null>(ref ? "checking" : null);

  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    let attempt = 0;

    async function poll() {
      try {
        const { paymentStatus } = await verifyPayment(ref!);
        if (cancelled) return;
        if (paymentStatus !== "unpaid" || attempt >= 4) {
          setStatus(paymentStatus);
          return;
        }
        attempt += 1;
        setTimeout(poll, 1500);
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  return status;
}

function PaystackResult({ ref }: { ref: string }) {
  const status = usePaymentStatus(ref);

  if (status === "checking" || status === null) {
    return (
      <div className="clip-card panel p-8 text-center">
        <p className="hud-label text-xs font-bold text-neon">Confirming your payment…</p>
        <p className="mt-3 text-sm text-slate-400">
          Reference <span className="font-mono font-bold text-neon">{ref}</span>
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="clip-card panel p-8 text-center">
        <h1 className="font-display mt-2 text-3xl font-bold uppercase text-white">Payment not confirmed</h1>
        <p className="mt-3 text-sm text-slate-400">
          Reference <span className="font-mono font-bold text-neon">{ref}</span>
        </p>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          We couldn&apos;t confirm this payment. If you were charged, message us on WhatsApp with your order
          reference and we&apos;ll sort it out — otherwise, feel free to try again.
        </p>
        <Link
          href="/cart"
          className="clip-btn hud-label mt-8 inline-block bg-neon px-6 py-3 text-xs font-bold text-night-950 hover:brightness-110"
        >
          Back to cart
        </Link>
      </div>
    );
  }

  return (
    <div className="clip-card panel p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-volt">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-volt" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-display mt-5 text-3xl font-bold uppercase text-white">Payment confirmed</h1>
      <p className="mt-2 text-sm text-slate-400">
        Reference <span className="font-mono font-bold text-neon">{ref}</span>
      </p>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        We&apos;ve got your payment — delivery to your game ID is next, usually within minutes during support
        hours.
      </p>
      <Link
        href="/"
        className="clip-btn hud-label mt-8 inline-block bg-neon px-6 py-3 text-xs font-bold text-night-950 hover:brightness-110"
      >
        Back to home
      </Link>
    </div>
  );
}

function ManualOrderResult() {
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
      <div className="text-center">
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
    <div className="clip-card panel p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-volt">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-volt" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-display mt-5 text-3xl font-bold uppercase text-white">Order confirmed</h1>
      <p className="mt-2 text-sm text-slate-400">
        Reference <span className="font-mono font-bold text-neon">{order.ref}</span>
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Payment method: {order.method}. Confirmation goes to {order.email || "your email"}.
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
        Our team has been notified and will confirm payment with you on WhatsApp, then deliver straight to your
        game ID — usually within minutes during support hours.
      </p>

      <Link
        href="/"
        className="clip-btn hud-label mt-8 inline-block bg-neon px-6 py-3 text-xs font-bold text-night-950 hover:brightness-110"
      >
        Back to home
      </Link>
    </div>
  );
}

function SuccessContent() {
  const ref = useSearchParams().get("ref");
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      {ref ? <PaystackResult ref={ref} /> : <ManualOrderResult />}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
