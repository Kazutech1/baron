"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/skins", label: "Skins" },
];

export default function Navbar() {
  const { count } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-night-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Image src="/logo-mark.png" alt="" width={184} height={248} priority className="h-7 w-auto sm:h-8" />
          <span className="font-display text-lg font-bold tracking-[0.2em] text-white sm:text-2xl sm:tracking-[0.3em]">
            LOADAX
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hud-label clip-btn px-4 py-2 text-xs font-semibold transition-colors ${
                pathname === l.href
                  ? "bg-neon/15 text-neon"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <nav className="flex min-w-0 items-center sm:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-1.5 py-2 text-[11px] font-semibold uppercase tracking-wider ${
                  pathname === l.href ? "text-neon" : "text-slate-300"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/cart"
            className="clip-btn relative flex shrink-0 items-center gap-2 border border-neon/60 bg-neon/10 px-3 py-2 text-xs font-bold text-neon transition-colors hover:bg-neon/20 sm:px-4"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
              <path d="M3 3h2l2.6 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hud-label hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-volt px-1 text-[10px] font-black text-night-950">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
