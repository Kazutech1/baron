import Image from "next/image";
import Link from "next/link";
import type { Game, GameEvent, Skin } from "@/lib/catalog";
import { formatNaira } from "@/lib/catalog";
import Countdown from "./Countdown";
import AddToCartButton from "./AddToCartButton";

export function GameCard({ game }: { game: Game }) {
  const from = game.packs.length > 0 ? Math.min(...game.packs.map((p) => p.priceNgn)) : null;
  return (
    <Link
      href={`/games/${game.id}`}
      className="clip-card panel group block overflow-hidden transition hover:border-neon/60"
    >
      <div className="relative h-36 overflow-hidden">
        <Image
          src={game.card}
          alt={game.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 to-transparent" />
      </div>
      <div className="flex items-center gap-3 p-4">
        <Image
          src={game.icon}
          alt=""
          width={44}
          height={44}
          className="clip-btn shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-white">{game.name}</p>
          <p className="text-xs text-slate-400">
            {game.currency}
            {from !== null && (
              <>
                {" "}· from <span className="font-semibold text-volt">{formatNaira(from)}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function EventCard({ event }: { event: GameEvent }) {
  return (
    <div className="clip-card panel group overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/20 to-transparent" />
        <span className="hud-label absolute left-3 top-3 bg-volt px-2 py-1 text-[10px] font-black text-night-950">
          {event.tag}
        </span>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <p className="font-display text-lg font-bold leading-tight text-white">{event.title}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-xs leading-5 text-slate-400">{event.blurb}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="hud-label text-[10px] text-slate-500">Ends in</p>
            <Countdown endsAt={event.endsAt} />
          </div>
          <Link
            href={`/games/${event.gameId}`}
            className="clip-btn hud-label border border-neon/60 bg-neon/10 px-3 py-2 text-[10px] font-bold text-neon hover:bg-neon/20"
          >
            Top up {event.gameCurrency || "now"}
          </Link>
        </div>
      </div>
    </div>
  );
}

const RARITY_STYLES: Record<Skin["rarity"], string> = {
  Epic: "bg-sky-400/15 text-sky-300 border-sky-400/40",
  Legendary: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  Mythic: "bg-fuchsia-400/15 text-fuchsia-300 border-fuchsia-400/40",
};

export function SkinCard({ skin }: { skin: Skin }) {
  return (
    <div className="clip-card panel group overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <Image
          src={skin.image}
          alt={skin.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-transparent to-transparent" />
        <span
          className={`hud-label absolute left-3 top-3 border px-2 py-0.5 text-[10px] font-bold ${RARITY_STYLES[skin.rarity]}`}
        >
          {skin.rarity}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="truncate font-display text-base font-bold text-white">{skin.name}</p>
        <p className="text-xs text-slate-400">{skin.gameName}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-display text-lg font-bold text-volt">{formatNaira(skin.priceNgn)}</span>
          <AddToCartButton
            item={{
              id: skin.id,
              kind: "skin",
              gameId: skin.gameId,
              gameName: skin.gameName ?? skin.gameId,
              name: skin.name,
              priceNgn: skin.priceNgn,
              image: skin.image,
            }}
          />
        </div>
      </div>
    </div>
  );
}
