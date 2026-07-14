"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_URL } from "@/lib/api";
import { cls, setToken } from "@/lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      router.replace("/admin");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <form onSubmit={login} className="clip-card panel p-8">
        <p className="hud-label text-xs font-bold text-volt">Restricted area</p>
        <h1 className="font-display mt-1 text-2xl font-bold uppercase text-white">Baron admin</h1>
        <label className="mt-6 block">
          <span className={cls.label}>Password</span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1.5 ${cls.input}`}
          />
        </label>
        {error && <p className="mt-3 text-xs font-semibold text-red-400">{error}</p>}
        <button type="submit" disabled={busy} className={`mt-6 w-full ${cls.btnSolid}`}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
