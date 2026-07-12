import Link from "next/link";
import HeroSlider from "@/components/HeroSlider";
import { EventCard, GameCard, SkinCard } from "@/components/cards";
import { EVENTS, GAMES, SKINS } from "@/lib/catalog";

const TRUST = [
  { title: "Instant delivery", body: "Tokens land on your game ID in minutes, 7 days a week." },
  { title: "Pay the Naija way", body: "Cards, bank transfer, USSD, OPay & PalmPay — all in Naira." },
  { title: "Official top-ups", body: "Codes and direct top-ups sourced from authorised resellers." },
  { title: "Human support", body: "Real people on WhatsApp when something needs fixing." },
];

const STEPS = [
  { n: "01", title: "Pick your game", body: "CODM, MLBB, PUBG, Free Fire and more." },
  { n: "02", title: "Choose a pack", body: "Tokens, passes or skins — priced in Naira." },
  { n: "03", title: "Drop your game ID", body: "We deliver straight to your account. Booyah." },
];

export default function Home() {
  return (
    <>
      <HeroSlider slides={EVENTS.slice(0, 4)} />

      {/* Trust strip */}
      <section className="border-y border-edge bg-night-900/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex gap-3">
              <span className="mt-1 h-8 w-1 shrink-0 bg-neon" />
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
                  {t.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live events */}
      <section id="events" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="hud-label text-xs font-bold text-volt">Happening now</p>
            <h2 className="font-display mt-1 text-3xl font-bold uppercase text-white">
              Live game events
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-xs leading-5 text-slate-500 sm:block">
            Collab seasons burn out fast — top up before the shop rotates.
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* Games */}
      <section className="border-t border-edge bg-night-900/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="hud-label text-xs font-bold text-volt">Top-ups</p>
              <h2 className="font-display mt-1 text-3xl font-bold uppercase text-white">
                Nigeria&apos;s most played
              </h2>
            </div>
            <Link
              href="/games"
              className="clip-btn hud-label shrink-0 border border-neon/60 bg-neon/10 px-4 py-2 text-xs font-bold text-neon hover:bg-neon/20"
            >
              All games
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GAMES.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </div>
      </section>

      {/* Skins */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="hud-label text-xs font-bold text-volt">Flex different</p>
            <h2 className="font-display mt-1 text-3xl font-bold uppercase text-white">
              Skins &amp; bundles
            </h2>
          </div>
          <Link
            href="/skins"
            className="clip-btn hud-label shrink-0 border border-neon/60 bg-neon/10 px-4 py-2 text-xs font-bold text-neon hover:bg-neon/20"
          >
            All skins
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SKINS.slice(0, 4).map((s) => (
            <SkinCard key={s.id} skin={s} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-edge bg-night-900/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl font-bold uppercase text-white">How Baron works</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="clip-card panel p-6">
                <p className="font-display text-4xl font-bold text-neon/40">{s.n}</p>
                <p className="font-display mt-3 text-lg font-bold uppercase text-white">{s.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="clip-card mt-10 flex flex-col items-start justify-between gap-4 border border-neon/40 bg-gradient-to-r from-neon/10 to-volt/10 p-8 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-2xl font-bold uppercase text-white">
                Ready when you are, chief.
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Join thousands of Nigerian gamers topping up with Baron.
              </p>
            </div>
            <Link
              href="/games"
              className="clip-btn hud-label shrink-0 bg-neon px-6 py-3 text-xs font-bold text-night-950 hover:brightness-110"
            >
              Start shopping
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
