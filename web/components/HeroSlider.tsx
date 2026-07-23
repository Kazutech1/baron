"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GameEvent } from "@/lib/catalog";

export default function HeroSlider({ slides }: { slides: GameEvent[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative h-[480px] overflow-hidden sm:h-[560px]">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-night-950 via-night-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-transparent to-night-950/40" />
        </div>
      ))}

      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 sm:px-6">
        <p className="hud-label text-xs font-bold text-volt">
          Live event · ends soon
        </p>
        <p className="font-display mt-3 max-w-xl text-3xl font-bold uppercase leading-tight text-white sm:text-5xl lg:text-6xl">
          {slides[index].title}
        </p>
        <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
          {slides[index].blurb}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/games/${slides[index].gameId}`}
            className="clip-btn hud-label bg-neon px-6 py-3 text-xs font-bold text-night-950 transition hover:brightness-110"
          >
            Top up now
          </Link>
          <a
            href="#events"
            className="clip-btn hud-label border border-neon/60 bg-night-950/50 px-6 py-3 text-xs font-bold text-neon transition hover:bg-neon/10"
          >
            View events
          </a>
        </div>

        <div className="mt-10 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              className={`h-1.5 transition-all ${
                i === index ? "w-10 bg-neon" : "w-5 bg-slate-600 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
