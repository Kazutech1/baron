"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin-ui";
import { adminFetch, cls, slugify, type AdminGame } from "@/lib/admin";

export default function AdminGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<AdminGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch<{ games: AdminGame[] }>("/api/admin/games")
      .then((d) => setGames(d.games))
      .catch((e) => setError(e.message));
  }, []);

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    const id = slugify(newName);
    if (!id) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/games/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: newName.trim(), packs: [] }),
      });
      router.push(`/admin/games/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Games</h1>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <form onSubmit={createGame} className="clip-card panel mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className={cls.label}>New game name</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Honor of Kings"
            className={`mt-1.5 ${cls.input}`}
          />
        </label>
        <button type="submit" disabled={busy || !newName.trim()} className={cls.btnSolid}>
          Add game
        </button>
      </form>

      <div className="clip-card panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-edge">
            <tr>
              <th className={cls.th}>Game</th>
              <th className={cls.th}>Currency</th>
              <th className={cls.th}>Packs</th>
              <th className={cls.th}>Sort</th>
              <th className={cls.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className="border-b border-edge/40 last:border-0 hover:bg-white/2">
                <td className={cls.td}>
                  <Link href={`/admin/games/${g.id}`} className="font-semibold text-neon hover:underline">
                    {g.name}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-slate-500">{g.id}</span>
                </td>
                <td className={cls.td}>{g.currency}</td>
                <td className={cls.td}>{g.packs.length}</td>
                <td className={cls.td}>{g.sort}</td>
                <td className={cls.td}>
                  <StatusBadge status={g.active ? "live" : "archived"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
