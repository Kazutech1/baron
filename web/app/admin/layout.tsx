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

  const logout = () => {
    clearToken();
    router.replace("/admin/login");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between lg:hidden">
        <p className="hud-label text-xs font-bold text-volt">Loadax admin</p>
        <button onClick={logout} className="text-xs font-semibold text-slate-500 hover:text-red-300">
          Log out
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-6 lg:mt-0 lg:flex-row lg:gap-8">
        <aside className="lg:w-40 lg:shrink-0">
          <p className="hud-label hidden text-xs font-bold text-volt lg:block">Loadax admin</p>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:mt-4 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`clip-btn shrink-0 px-3 py-2 text-sm font-semibold transition ${
                  pathname === n.href
                    ? "bg-neon/15 text-neon"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="clip-btn mt-6 hidden shrink-0 px-3 py-2 text-left text-sm font-semibold text-slate-500 hover:bg-white/5 hover:text-red-300 lg:block"
            >
              Log out
            </button>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
