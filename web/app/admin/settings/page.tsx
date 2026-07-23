"use client";

import { useEffect, useState } from "react";
import { adminFetch, cls } from "@/lib/admin";

type Settings = {
  telegramChatId: string;
  telegramChatIdEnv: string;
  telegramTokenSet: boolean;
  autoPublishEvents: boolean;
  syncIntervalHours: number;
};

type SyncResult = {
  gamesSynced: number;
  imagesDownloaded: number;
  eventsDetected: string[];
  errors: string[];
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [chatId, setChatId] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    adminFetch<Settings>("/api/admin/settings")
      .then((s) => {
        setSettings(s);
        setChatId(s.telegramChatId);
        setAutoPublish(s.autoPublishEvents);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save() {
    setMsg(null);
    setError(null);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ telegramChatId: chatId, autoPublishEvents: autoPublish }),
      });
      setMsg("Settings saved.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function testTelegram() {
    setMsg(null);
    setError(null);
    try {
      await adminFetch("/api/admin/telegram/test", { method: "POST" });
      setMsg("Test message sent — check Telegram. ✓");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const d = await adminFetch<{ result: SyncResult }>("/api/admin/sync", { method: "POST" });
      setSyncResult(d.result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  if (!settings) return <p className="text-sm text-slate-500">{error ?? "Loading…"}</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Settings</h1>
      {msg && <p className="mt-3 text-sm font-semibold text-volt">{msg}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <section className="clip-card panel mt-6 space-y-4 p-5">
        <h2 className="hud-label text-xs font-bold text-neon">Telegram notifications</h2>
        <p className="text-xs leading-5 text-slate-400">
          Bot token: {settings.telegramTokenSet ? (
            <span className="font-semibold text-volt">configured ✓</span>
          ) : (
            <span className="font-semibold text-red-400">missing — set TELEGRAM_BOT_TOKEN in server/.env</span>
          )}
          . To get your chat id, open Telegram, message your bot with <code className="text-neon">/start</code> —
          it replies with the id. New orders, plus /orders and /stats commands and the
          delivered/cancel buttons, all run through that chat.
        </p>
        <label className="block max-w-sm">
          <span className={cls.label}>Notification chat id</span>
          <input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder={settings.telegramChatIdEnv || "e.g. 123456789"}
            className={`mt-1.5 ${cls.input}`}
          />
          {settings.telegramChatIdEnv && (
            <span className="mt-1 block text-[11px] text-slate-500">
              Env fallback: {settings.telegramChatIdEnv} (this field overrides it)
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-3">
          <button onClick={save} className={cls.btnSolid}>
            Save settings
          </button>
          <button onClick={testTelegram} className={cls.btn}>
            Send test message
          </button>
        </div>
      </section>

      <section className="clip-card panel mt-6 space-y-4 p-5">
        <h2 className="hud-label text-xs font-bold text-neon">Auto-sync (images &amp; events)</h2>
        <p className="text-xs leading-5 text-slate-400">
          Sync pulls fresh icons and screenshots from the app stores for every active game and
          auto-detects new events from live store titles (collabs, anniversaries, seasons). Runs
          every {settings.syncIntervalHours}h automatically{settings.syncIntervalHours <= 0 && " (disabled)"} —
          or trigger it now.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={autoPublish}
            onChange={(e) => setAutoPublish(e.target.checked)}
            className="accent-[#35e0ff]"
          />
          Publish detected events immediately (otherwise they land as drafts for review)
        </label>
        <div className="flex flex-wrap gap-3">
          <button onClick={save} className={cls.btnSolid}>
            Save settings
          </button>
          <button onClick={syncNow} disabled={syncing} className={cls.btn}>
            {syncing ? "Syncing… (can take a minute)" : "⟳ Sync now"}
          </button>
        </div>
        {syncResult && (
          <div className="border border-edge bg-night-950 p-4 text-xs leading-6 text-slate-300">
            <p>
              Synced <b className="text-white">{syncResult.gamesSynced}</b> games,{" "}
              <b className="text-white">{syncResult.imagesDownloaded}</b> images downloaded.
            </p>
            {syncResult.eventsDetected.length > 0 && (
              <p className="text-volt">New events: {syncResult.eventsDetected.join(" · ")}</p>
            )}
            {syncResult.errors.length > 0 && (
              <p className="text-red-400">Errors: {syncResult.errors.join(" · ")}</p>
            )}
          </div>
        )}
      </section>

      <section className="clip-card panel mt-6 p-5">
        <h2 className="hud-label text-xs font-bold text-neon">Security</h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          The dashboard password is <code className="text-neon">ADMIN_PASSWORD</code> in{" "}
          <code className="text-neon">server/.env</code> — change it there and restart the server.
        </p>
      </section>
    </div>
  );
}
