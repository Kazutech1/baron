import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-edge bg-night-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Image src="/logo-full.png" alt="Loadax" width={1288} height={535} className="h-16 w-auto" />
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Nigeria&apos;s player-first store for game tokens, passes and skins.
            Instant delivery to your game ID — pay in Naira.
          </p>
        </div>
        <div>
          <p className="hud-label text-xs font-bold text-neon">Store</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li><Link href="/games" className="hover:text-white">All games</Link></li>
            <li><Link href="/skins" className="hover:text-white">Skins &amp; bundles</Link></li>
            <li><Link href="/cart" className="hover:text-white">Cart</Link></li>
          </ul>
        </div>
        <div>
          <p className="hud-label text-xs font-bold text-neon">Payments</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Cards (Paystack)</li>
            <li>Bank transfer</li>
            <li>USSD</li>
          </ul>
        </div>
        <div>
          <p className="hud-label text-xs font-bold text-neon">Support</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <a href="https://wa.me/2348068539935" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp: 0806 853 9935
              </a>
            </li>
            <li>support@loadax.ng</li>
            <li>7 days a week, 8:00–23:00 WAT</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-edge/60 py-5">
        <p className="mx-auto max-w-6xl px-4 text-xs leading-5 text-slate-500 sm:px-6">
          © 2026 Loadax · Powered by Philotex Group. Payments are processed securely via Paystack;
          orders are delivered to your game ID once payment is confirmed. All game names, artwork
          and trademarks belong to their respective publishers.
        </p>
      </div>
    </footer>
  );
}
