"use client";

import { useEffect, useState } from "react";

function parts(msLeft: number) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export default function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Render a stable placeholder on the server to avoid hydration mismatch
  if (now === null) {
    return <span className="font-mono text-xs text-slate-400">--d --:--:--</span>;
  }

  const left = new Date(endsAt).getTime() - now;
  if (left <= 0) {
    return <span className="hud-label text-xs font-bold text-slate-500">Ended</span>;
  }
  const { d, h, m, s } = parts(left);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono text-xs font-semibold text-volt">
      {d}d {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
