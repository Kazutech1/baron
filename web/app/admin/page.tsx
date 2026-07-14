"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin-ui";
import { adminFetch, cls, type Overview } from "@/lib/admin";
import { formatNaira } from "@/lib/catalog";

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Overview>("/api/admin/overview").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const tiles = [
    { label: "Pending orders", value: String(data.stats.pending), accent: data.stats.pending > 0 },
    { label: "Orders today", value: String(data.stats.todayCount) },
    { label: "Revenue today", value: formatNaira(data.stats.todayTotal) },
    { label: "Delivered all-time", value: `${data.stats.deliveredCount} · ${formatNaira(data.stats.deliveredTotal)}` },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Overview</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={`clip-card panel p-5 ${t.accent ? "border-volt/60" : ""}`}>
            <p className="hud-label text-[10px] font-bold text-slate-500">{t.label}</p>
            <p className={`font-display mt-2 text-2xl font-bold ${t.accent ? "text-volt" : "text-white"}`}>
              {t.value}
            </p>
          </div>
        ))}
      </div>

      {(data.draftEvents > 0 || !data.telegram.chatId) && (
        <div className="clip-card mt-6 space-y-2 border border-volt/40 bg-volt/5 p-5 text-sm text-slate-300">
          {data.draftEvents > 0 && (
            <p>
              📣 <b className="text-white">{data.draftEvents}</b> auto-detected event
              {data.draftEvents > 1 ? "s" : ""} waiting for review —{" "}
              <Link href="/admin/events" className="font-semibold text-neon underline">
                publish them
              </Link>
            </p>
          )}
          {!data.telegram.chatId && (
            <p>
              🤖 Telegram notifications are off — send <code className="text-neon">/start</code> to
              your bot, then save the chat id in{" "}
              <Link href="/admin/settings" className="font-semibold text-neon underline">
                Settings
              </Link>
            </p>
          )}
        </div>
      )}

      <h2 className="font-display mt-10 text-xl font-bold uppercase text-white">Recent orders</h2>
      <div className="clip-card panel mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-edge">
            <tr>
              <th className={cls.th}>Ref</th>
              <th className={cls.th}>Items</th>
              <th className={cls.th}>Total</th>
              <th className={cls.th}>Status</th>
              <th className={cls.th}>When</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.map((o) => (
              <tr key={o.id} className="border-b border-edge/40 last:border-0">
                <td className={`${cls.td} font-mono text-neon`}>
                  <Link href="/admin/orders">{o.id}</Link>
                </td>
                <td className={cls.td}>{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</td>
                <td className={cls.td}>{formatNaira(o.totalNgn)}</td>
                <td className={cls.td}>
                  <StatusBadge status={o.status} />
                </td>
                <td className={`${cls.td} text-xs text-slate-500`}>
                  {new Date(o.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {data.recentOrders.length === 0 && (
              <tr>
                <td className={cls.td} colSpan={5}>
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="font-display mt-10 text-xl font-bold uppercase text-white">Last syncs</h2>
      <div className="clip-card panel mt-4 divide-y divide-edge/40">
        {data.syncLogs.map((l, i) => (
          <p key={i} className="px-4 py-3 text-xs text-slate-400">
            <span className="font-mono text-slate-500">{new Date(l.at).toLocaleString()}</span> —{" "}
            {l.summary}
          </p>
        ))}
        {data.syncLogs.length === 0 && (
          <p className="px-4 py-3 text-xs text-slate-500">
            No syncs yet — run one from Settings.
          </p>
        )}
      </div>
    </div>
  );
}
