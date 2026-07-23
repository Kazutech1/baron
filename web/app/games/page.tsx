import type { Metadata } from "next";
import { GameCard } from "@/components/cards";
import { getCatalog } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All games",
  description: "Top up CODM, MLBB, PUBG Mobile, Free Fire, Blood Strike, FC Mobile, eFootball and Delta Force in Naira.",
  alternates: { canonical: "/games" },
};

export default async function GamesPage() {
  const { games } = await getCatalog();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="hud-label text-xs font-bold text-volt">Catalogue</p>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase text-white">All games</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        Every title we stock tokens for. Pick a game to see packs, prices and current events.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
