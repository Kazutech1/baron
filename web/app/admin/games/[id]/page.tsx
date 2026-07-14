"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImagePicker } from "@/components/admin-ui";
import { adminFetch, cls, type AdminGame, type AdminPack } from "@/lib/admin";
import { assetUrl } from "@/lib/api";

export default function AdminGameEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<AdminGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pickTarget, setPickTarget] = useState<"icon" | "card" | "banner" | null>(null);

  useEffect(() => {
    adminFetch<{ game: AdminGame }>(`/api/admin/games/${id}`)
      .then((d) => setGame(d.game))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!game) return <p className="text-sm text-slate-500">Loading…</p>;

  const set = (patch: Partial<AdminGame>) => {
    setGame({ ...game, ...patch });
    setSaved(false);
  };
  const setPack = (i: number, patch: Partial<AdminPack>) => {
    const packs = game.packs.slice();
    packs[i] = { ...packs[i], ...patch };
    set({ packs });
  };

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const d = await adminFetch<{ game: AdminGame }>(`/api/admin/games/${game!.id}`, {
        method: "PUT",
        body: JSON.stringify(game),
      });
      setGame(d.game);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeGame() {
    if (!confirm(`Delete ${game!.name} plus its skins and events? This cannot be undone.`)) return;
    await adminFetch(`/api/admin/games/${game!.id}`, { method: "DELETE" });
    router.push("/admin/games");
  }

  const field = (label: string, key: keyof AdminGame, placeholder = "") => (
    <label className="block">
      <span className={cls.label}>{label}</span>
      <input
        value={String(game[key] ?? "")}
        placeholder={placeholder}
        onChange={(e) => set({ [key]: e.target.value } as Partial<AdminGame>)}
        className={`mt-1.5 ${cls.input}`}
      />
    </label>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold uppercase text-white">{game.name}</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={game.active}
              onChange={(e) => set({ active: e.target.checked })}
              className="accent-[#35e0ff]"
            />
            Active
          </label>
          <button onClick={save} disabled={busy} className={cls.btnSolid}>
            {busy ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
          <button onClick={removeGame} className={cls.btnDanger}>
            Delete
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="clip-card panel mt-6 grid gap-4 p-5 sm:grid-cols-2">
        {field("Name", "name")}
        {field("Publisher", "publisher")}
        {field("Token currency", "currency", "e.g. Diamonds")}
        {field("Accent color", "accent", "#35e0ff")}
        <div className="sm:col-span-2">{field("Tagline", "tagline")}</div>
        <label className="block">
          <span className={cls.label}>Sort order</span>
          <input
            type="number"
            value={game.sort}
            onChange={(e) => set({ sort: Number(e.target.value) })}
            className={`mt-1.5 ${cls.input}`}
          />
        </label>
      </div>

      <h2 className="font-display mt-8 text-xl font-bold uppercase text-white">Auto-sync sources</h2>
      <p className="mt-1 text-xs text-slate-500">
        Used by the sync job to pull real store artwork and detect events for this game.
      </p>
      <div className="clip-card panel mt-3 grid gap-4 p-5 sm:grid-cols-2">
        {field("Google Play package id", "playPackageId", "com.publisher.game")}
        {field("iTunes search term", "itunesTerm", "game name on the App Store")}
      </div>

      <h2 className="font-display mt-8 text-xl font-bold uppercase text-white">Artwork</h2>
      <div className="clip-card panel mt-3 space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {(["icon", "card", "banner"] as const).map((slot) => (
            <div key={slot}>
              <p className={cls.label}>{slot}</p>
              {game[slot] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assetUrl(game[slot])}
                  alt={slot}
                  className="clip-btn mt-1.5 h-24 w-full border border-edge object-cover"
                />
              ) : (
                <div className="clip-btn mt-1.5 flex h-24 items-center justify-center border border-dashed border-edge text-xs text-slate-600">
                  not set
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickTarget(pickTarget === slot ? null : slot)}
                  className={cls.btn}
                >
                  {pickTarget === slot ? "Picking…" : "Pick"}
                </button>
                <input
                  value={game[slot]}
                  onChange={(e) => set({ [slot]: e.target.value } as Partial<AdminGame>)}
                  placeholder="/games/… or https://…"
                  className={`${cls.input} !py-1.5 text-xs`}
                />
              </div>
            </div>
          ))}
        </div>
        {pickTarget && (
          <div>
            <p className="mb-2 text-xs text-slate-400">
              Click a synced screenshot to use it as the <b className="text-neon">{pickTarget}</b>:
            </p>
            <ImagePicker
              images={[...(game.screenshots ?? []), game.icon].filter(Boolean)}
              assetUrl={assetUrl}
              onPick={(img) => {
                set({ [pickTarget]: img } as Partial<AdminGame>);
                setPickTarget(null);
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold uppercase text-white">
          {game.currency} packs
        </h2>
        <button
          type="button"
          className={cls.btn}
          onClick={() =>
            set({
              packs: [
                ...game.packs,
                {
                  id: `${game.id}-${Date.now().toString(36)}`,
                  amount: "",
                  bonus: "",
                  priceNgn: 0,
                  popular: false,
                  sort: game.packs.length,
                  active: true,
                },
              ],
            })
          }
        >
          + Add pack
        </button>
      </div>
      <div className="clip-card panel mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-edge">
            <tr>
              <th className={cls.th}>Amount</th>
              <th className={cls.th}>Bonus</th>
              <th className={cls.th}>Price ₦</th>
              <th className={cls.th}>Bestseller</th>
              <th className={cls.th}>Active</th>
              <th className={cls.th}></th>
            </tr>
          </thead>
          <tbody>
            {game.packs.map((p, i) => (
              <tr key={p.id} className="border-b border-edge/40 last:border-0">
                <td className={cls.td}>
                  <input
                    value={p.amount}
                    placeholder="e.g. 500 Diamonds"
                    onChange={(e) => setPack(i, { amount: e.target.value })}
                    className={`${cls.input} !py-1.5`}
                  />
                </td>
                <td className={cls.td}>
                  <input
                    value={p.bonus}
                    placeholder="+50 bonus"
                    onChange={(e) => setPack(i, { bonus: e.target.value })}
                    className={`${cls.input} !py-1.5 w-28`}
                  />
                </td>
                <td className={cls.td}>
                  <input
                    type="number"
                    value={p.priceNgn}
                    onChange={(e) => setPack(i, { priceNgn: Number(e.target.value) })}
                    className={`${cls.input} !py-1.5 w-28`}
                  />
                </td>
                <td className={`${cls.td} text-center`}>
                  <input
                    type="checkbox"
                    checked={p.popular}
                    onChange={(e) => setPack(i, { popular: e.target.checked })}
                    className="accent-[#35e0ff]"
                  />
                </td>
                <td className={`${cls.td} text-center`}>
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => setPack(i, { active: e.target.checked })}
                    className="accent-[#35e0ff]"
                  />
                </td>
                <td className={cls.td}>
                  <button
                    type="button"
                    onClick={() => set({ packs: game.packs.filter((_, j) => j !== i) })}
                    className="text-slate-500 hover:text-red-400"
                    aria-label="Remove pack"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {game.packs.length === 0 && (
              <tr>
                <td className={cls.td} colSpan={6}>
                  No packs yet — add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">Remember to hit “Save changes” after editing packs.</p>
    </div>
  );
}
