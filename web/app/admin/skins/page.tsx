"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePicker, StatusBadge } from "@/components/admin-ui";
import { adminFetch, cls, slugify, type AdminGame, type AdminSkin } from "@/lib/admin";
import { assetUrl } from "@/lib/api";
import { formatNaira } from "@/lib/catalog";

const EMPTY: AdminSkin = {
  id: "",
  gameId: "",
  name: "",
  rarity: "Epic",
  priceNgn: 0,
  image: "",
  sort: 99,
  active: true,
};

export default function AdminSkinsPage() {
  const [skins, setSkins] = useState<AdminSkin[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [editing, setEditing] = useState<AdminSkin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminFetch<{ skins: AdminSkin[] }>("/api/admin/skins")
      .then((d) => setSkins(d.skins))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    adminFetch<{ games: AdminGame[] }>("/api/admin/games")
      .then((d) => setGames(d.games))
      .catch(() => {});
  }, [load]);

  const gameName = (id: string) => games.find((g) => g.id === id)?.name ?? id;
  const gameShots = (id: string) => {
    const g = games.find((x) => x.id === id);
    return g ? [...(g.screenshots ?? []), g.card, g.banner].filter(Boolean) : [];
  };

  async function save() {
    if (!editing) return;
    const id = editing.id || `skin-${editing.gameId}-${slugify(editing.name)}`;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/skins/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...editing, id }),
      });
      setEditing(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this skin?")) return;
    await adminFetch(`/api/admin/skins/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase text-white">Skins</h1>
        <button className={cls.btnSolid} onClick={() => setEditing({ ...EMPTY, gameId: games[0]?.id ?? "" })}>
          + New skin
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {editing && (
        <div className="clip-card panel mt-6 space-y-4 border-neon/50 p-5">
          <p className="hud-label text-xs font-bold text-neon">
            {editing.id ? `Editing ${editing.id}` : "New skin"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={cls.label}>Name</span>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className={`mt-1.5 ${cls.input}`}
              />
            </label>
            <label className="block">
              <span className={cls.label}>Game</span>
              <select
                value={editing.gameId}
                onChange={(e) => setEditing({ ...editing, gameId: e.target.value, image: "" })}
                className={`mt-1.5 ${cls.input}`}
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={cls.label}>Rarity</span>
              <select
                value={editing.rarity}
                onChange={(e) => setEditing({ ...editing, rarity: e.target.value as AdminSkin["rarity"] })}
                className={`mt-1.5 ${cls.input}`}
              >
                <option>Epic</option>
                <option>Legendary</option>
                <option>Mythic</option>
              </select>
            </label>
            <label className="block">
              <span className={cls.label}>Price (₦)</span>
              <input
                type="number"
                value={editing.priceNgn}
                onChange={(e) => setEditing({ ...editing, priceNgn: Number(e.target.value) })}
                className={`mt-1.5 ${cls.input}`}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={cls.label}>Image path</span>
              <input
                value={editing.image}
                placeholder="/games/… or https://…"
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                className={`mt-1.5 ${cls.input}`}
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-400">Or pick from {gameName(editing.gameId)} artwork:</p>
            <ImagePicker
              images={gameShots(editing.gameId)}
              assetUrl={assetUrl}
              onPick={(img) => setEditing({ ...editing, image: img })}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="accent-[#35e0ff]"
              />
              Active
            </label>
            <button onClick={save} disabled={busy || !editing.name || !editing.gameId} className={cls.btnSolid}>
              {busy ? "Saving…" : "Save skin"}
            </button>
            <button onClick={() => setEditing(null)} className={cls.btn}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="clip-card panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-edge">
            <tr>
              <th className={cls.th}>Skin</th>
              <th className={cls.th}>Game</th>
              <th className={cls.th}>Rarity</th>
              <th className={cls.th}>Price</th>
              <th className={cls.th}>Status</th>
              <th className={cls.th}></th>
            </tr>
          </thead>
          <tbody>
            {skins.map((s) => (
              <tr key={s.id} className="border-b border-edge/40 last:border-0">
                <td className={cls.td}>
                  <button onClick={() => setEditing(s)} className="font-semibold text-neon hover:underline">
                    {s.name}
                  </button>
                </td>
                <td className={cls.td}>{gameName(s.gameId)}</td>
                <td className={cls.td}>{s.rarity}</td>
                <td className={cls.td}>{formatNaira(s.priceNgn)}</td>
                <td className={cls.td}>
                  <StatusBadge status={s.active ? "live" : "archived"} />
                </td>
                <td className={cls.td}>
                  <button onClick={() => remove(s.id)} className="text-slate-500 hover:text-red-400">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
