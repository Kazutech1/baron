"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin-ui";
import { adminFetch, cls, type AdminOrder } from "@/lib/admin";
import { formatNaira } from "@/lib/catalog";

const FILTERS = ["all", "pending", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyRef, setBusyRef] = useState<string | null>(null);

  const load = useCallback(() => {
    adminFetch<{ orders: AdminOrder[] }>(`/api/admin/orders?status=${filter}`)
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message));
  }, [filter]);

  useEffect(load, [load]);

  async function setStatus(ref: string, status: AdminOrder["status"]) {
    setBusyRef(ref);
    try {
      await adminFetch(`/api/admin/orders/${ref}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyRef(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Orders</h1>

      <div className="mt-5 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`clip-btn hud-label px-3 py-1.5 text-[11px] font-bold ${
              filter === f ? "bg-neon/15 text-neon" : "text-slate-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="clip-card panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-neon">{o.id}</span>
                <StatusBadge status={o.status} />
                <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</span>
              </div>
              <span className="font-display text-lg font-bold text-white">{formatNaira(o.totalNgn)}</span>
            </div>

            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              {o.items.map((i, idx) => (
                <li key={idx}>
                  {i.qty}× {i.name} <span className="text-slate-500">· {i.gameName}</span> —{" "}
                  {formatNaira(i.priceNgn * i.qty)}
                </li>
              ))}
            </ul>

            <div className="mt-3 grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
              <p>
                👤 {o.email}
                {o.phone ? ` · ${o.phone}` : ""}
              </p>
              <p>💳 {o.method || "—"}</p>
              {Object.entries(o.playerIds).map(([g, id]) => (
                <p key={g}>
                  🎮 {g}: <span className="font-mono text-slate-200">{id}</span>
                </p>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {o.status !== "delivered" && (
                <button
                  disabled={busyRef === o.id}
                  onClick={() => setStatus(o.id, "delivered")}
                  className={cls.btnSolid}
                >
                  ✅ Mark delivered
                </button>
              )}
              {o.status !== "cancelled" && (
                <button
                  disabled={busyRef === o.id}
                  onClick={() => setStatus(o.id, "cancelled")}
                  className={cls.btnDanger}
                >
                  ❌ Cancel
                </button>
              )}
              {o.status !== "pending" && (
                <button
                  disabled={busyRef === o.id}
                  onClick={() => setStatus(o.id, "pending")}
                  className={cls.btn}
                >
                  ↩ Back to pending
                </button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && !error && (
          <p className="text-sm text-slate-500">No {filter !== "all" ? filter : ""} orders.</p>
        )}
      </div>
    </div>
  );
}
