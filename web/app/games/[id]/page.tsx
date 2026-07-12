import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Countdown from "@/components/Countdown";
import { SkinCard } from "@/components/cards";
import { EVENTS, GAMES, formatNaira, getGame, skinsFor } from "@/lib/catalog";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const game = getGame((await params).id);
  return { title: game ? `${game.name} ${game.currency} — Baron` : "Game — Baron" };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  const skins = skinsFor(game.id);
  const events = EVENTS.filter((e) => e.gameId === game.id);

  return (
    <>
      {/* Banner */}
      <div className="relative h-64 overflow-hidden sm:h-80">
        <Image
          src={game.banner}
          alt={game.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-6xl items-end gap-4 px-4 pb-6 sm:px-6">
            <Image
              src={game.icon}
              alt=""
              width={72}
              height={72}
              className="clip-btn border border-edge"
            />
            <div>
              <p className="hud-label text-xs font-bold text-volt">{game.publisher}</p>
              <h1 className="font-display text-3xl font-bold uppercase text-white sm:text-4xl">
                {game.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="max-w-2xl text-sm leading-6 text-slate-400">{game.tagline}</p>

        {events.length > 0 && (
          <div className="clip-card mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border border-volt/40 bg-volt/5 px-5 py-4">
            {events.map((e) => (
              <p key={e.id} className="flex items-center gap-3 text-sm">
                <span className="hud-label bg-volt px-2 py-0.5 text-[10px] font-black text-night-950">
                  {e.tag}
                </span>
                <span className="font-semibold text-white">{e.title}</span>
                <span className="text-slate-400">ends in</span>
                <Countdown endsAt={e.endsAt} />
              </p>
            ))}
          </div>
        )}

        {/* Packs */}
        <h2 className="font-display mt-10 text-2xl font-bold uppercase text-white">
          {game.currency} packs
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {game.packs.map((pack) => (
            <div
              key={pack.id}
              className={`clip-card panel relative flex items-center justify-between gap-3 p-5 ${
                pack.popular ? "border-neon/70" : ""
              }`}
            >
              {pack.popular && (
                <span className="hud-label absolute -top-px right-6 bg-neon px-2 py-0.5 text-[10px] font-black text-night-950">
                  Bestseller
                </span>
              )}
              <div>
                <p className="font-display text-xl font-bold text-white">{pack.amount}</p>
                {pack.bonus && <p className="text-xs font-semibold text-volt">{pack.bonus}</p>}
                <p className="mt-1 font-display text-lg font-bold text-neon">
                  {formatNaira(pack.priceNgn)}
                </p>
              </div>
              <AddToCartButton
                item={{
                  id: pack.id,
                  kind: "pack",
                  gameId: game.id,
                  gameName: game.name,
                  name: `${pack.amount}${pack.bonus ? ` (${pack.bonus})` : ""}`,
                  priceNgn: pack.priceNgn,
                  image: game.icon,
                }}
              />
            </div>
          ))}
        </div>

        {/* Game skins */}
        {skins.length > 0 && (
          <>
            <h2 className="font-display mt-12 text-2xl font-bold uppercase text-white">
              {game.name} skins
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {skins.map((s) => (
                <SkinCard key={s.id} skin={s} />
              ))}
            </div>
          </>
        )}

        <p className="mt-10 text-xs leading-5 text-slate-500">
          Top-ups are delivered to the player ID you provide at checkout. Double-check your UID —
          deliveries to a wrong ID can&apos;t be reversed.
        </p>
      </div>
    </>
  );
}
