"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearToken, getToken } from "@/lib/admin";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/games", label: "Games" },
  { href: "/admin/skins", label: "Skins" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!isLogin && !getToken()) router.replace("/admin/login");
  }, [isLogin, router, pathname]);

  if (isLogin) return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <aside className="w-40 shrink-0">
        <p className="hud-label text-xs font-bold text-volt">Loadax admin</p>
        <nav className="mt-4 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`clip-btn px-3 py-2 text-sm font-semibold transition ${
                pathname === n.href
                  ? "bg-neon/15 text-neon"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <button
            onClick={() => {
              clearToken();
              router.replace("/admin/login");
            }}
            className="clip-btn mt-6 px-3 py-2 text-left text-sm font-semibold text-slate-500 hover:bg-white/5 hover:text-red-300"
          >
            Log out
          </button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
