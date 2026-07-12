import type { Metadata } from "next";
import { SkinCard } from "@/components/cards";
import { SKINS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Skins & bundles — Baron",
  description: "Legendary and Mythic skins, crates and bundles for Nigeria's top mobile games.",
};

export default function SkinsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="hud-label text-xs font-bold text-volt">Cosmetics</p>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase text-white">
        Skins &amp; bundles
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        Collab crates, event bundles and rare drops. Delivered as in-game redemptions to your
        player ID.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SKINS.map((s) => (
          <SkinCard key={s.id} skin={s} />
        ))}
      </div>
    </div>
  );
}
