"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePicker, StatusBadge } from "@/components/admin-ui";
import { adminFetch, cls, slugify, type AdminEvent, type AdminGame } from "@/lib/admin";
import { assetUrl } from "@/lib/api";

const EMPTY: AdminEvent = {
  id: "",
  gameId: "",
  title: "",
  blurb: "",
  image: "",
  tag: "Event",
  endsAt: "",
  status: "draft",
};

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminFetch<{ events: AdminEvent[] }>("/api/admin/events")
      .then((d) => setEvents(d.events))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    adminFetch<{ games: AdminGame[] }>("/api/admin/games")
      .then((d) => setGames(d.games))
      .catch(() => {});
  }, [load]);

  const gameName = (id: string) => games.find((g) => g.id === id)?.name ?? id;
  const gameShots = (id: string) => {
    const g = games.find((x) => x.id === id);
    return g ? [...(g.screenshots ?? []), g.card, g.banner].filter(Boolean) : [];
  };

  async function saveEvent(event: AdminEvent) {
    const id = event.id || `ev-${event.gameId}-${slugify(event.title)}`;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/events/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...event, id, endsAt: new Date(event.endsAt).toISOString() }),
      });
      setEditing(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function quickStatus(event: AdminEvent, status: AdminEvent["status"]) {
    await saveEvent({ ...event, status });
  }

  async function remove(id: string) {
    if (!confirm("Delete this event?")) return;
    await adminFetch(`/api/admin/events/${id}`, { method: "DELETE" });
    load();
  }

  const groups: { status: AdminEvent["status"]; title: string; hint?: string }[] = [
    { status: "draft", title: "Drafts", hint: "Auto-detected by sync — review, edit and publish." },
    { status: "live", title: "Live on the store" },
    { status: "archived", title: "Archived" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold uppercase text-white">Events</h1>
        <button
          className={cls.btnSolid}
          onClick={() =>
            setEditing({
              ...EMPTY,
              gameId: games[0]?.id ?? "",
              endsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
            })
          }
        >
          + New event
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {editing && (
        <div className="clip-card panel mt-6 space-y-4 border-neon/50 p-5">
          <p className="hud-label text-xs font-bold text-neon">
            {editing.id ? `Editing ${editing.id}` : "New event"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={cls.label}>Title</span>
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className={`mt-1.5 ${cls.input}`}
              />
            </label>
            <label className="block">
              <span className={cls.label}>Game</span>
              <select
                value={editing.gameId}
                onChange={(e) => setEditing({ ...editing, gameId: e.target.value })}
                className={`mt-1.5 ${cls.input}`}
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={cls.label}>Tag</span>
              <input
                value={editing.tag}
                placeholder="Collab / Season / Anniversary"
                onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                className={`mt-1.5 ${cls.input}`}
              />
            </label>
            <label className="block">
              <span className={cls.label}>Ends at</span>
              <input
                type="datetime-local"
                value={toLocalInput(editing.endsAt)}
                onChange={(e) => setEditing({ ...editing, endsAt: e.target.value })}
                className={`mt-1.5 ${cls.input}`}
              />
            </label>
            <label className="block">
              <span className={cls.label}>Status</span>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as AdminEvent["status"] })}
                className={`mt-1.5 ${cls.input}`}
              >
                <option value="draft">draft</option>
                <option value="live">live</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className={cls.label}>Blurb</span>
              <textarea
                value={editing.blurb}
                rows={2}
                onChange={(e) => setEditing({ ...editing, blurb: e.target.value })}
                className={`mt-1.5 ${cls.input}`}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={cls.label}>Image path</span>
              <input
                value={editing.image}
                placeholder="/games/… or https://…"
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                className={`mt-1.5 ${cls.input}`}
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-400">Or pick from {gameName(editing.gameId)} artwork:</p>
            <ImagePicker
              images={gameShots(editing.gameId)}
              assetUrl={assetUrl}
              onPick={(img) => setEditing({ ...editing, image: img })}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => saveEvent(editing)}
              disabled={busy || !editing.title || !editing.gameId || !editing.endsAt}
              className={cls.btnSolid}
            >
              {busy ? "Saving…" : "Save event"}
            </button>
            <button onClick={() => setEditing(null)} className={cls.btn}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {groups.map((group) => {
        const list = events.filter((e) => e.status === group.status);
        return (
          <section key={group.status} className="mt-8">
            <h2 className="font-display text-xl font-bold uppercase text-white">
              {group.title} <span className="text-slate-500">({list.length})</span>
            </h2>
            {group.hint && <p className="mt-1 text-xs text-slate-500">{group.hint}</p>}
            <div className="mt-3 space-y-3">
              {list.map((e) => (
                <div key={e.id} className="clip-card panel flex flex-wrap items-center gap-4 p-4">
                  {e.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={assetUrl(e.image)}
                      alt=""
                      className="clip-btn h-14 w-24 shrink-0 border border-edge object-cover"
                    />
                  ) : (
                    <div className="clip-btn h-14 w-24 shrink-0 border border-dashed border-edge" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {gameName(e.gameId)} · {e.tag} · ends {new Date(e.endsAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={e.status} />
                  <div className="flex flex-wrap gap-2">
                    {e.status !== "live" && (
                      <button onClick={() => quickStatus(e, "live")} className={cls.btnSolid}>
                        Publish
                      </button>
                    )}
                    {e.status === "live" && (
                      <button onClick={() => quickStatus(e, "archived")} className={cls.btn}>
                        Archive
                      </button>
                    )}
                    <button onClick={() => setEditing(e)} className={cls.btn}>
                      Edit
                    </button>
                    <button onClick={() => remove(e.id)} className="px-1 text-slate-500 hover:text-red-400">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {list.length === 0 && <p className="text-xs text-slate-600">None.</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
