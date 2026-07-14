// Auto-sync: refresh real store artwork and detect new game events.
//  - App icon:   Apple iTunes Search API (1024px artwork)
//  - Screenshots: Google Play page (landscape, >=500px wide)
//  - Events:      the Play og:title carries live collab/season names
//                 (e.g. "Blood Strike x One-Punch Man"); new titles become
//                 draft events for admin review (or go live with autoPublishEvents).
import { events, games, getSetting, saveImage, syncLog } from "./db.ts";
import type { GameDoc } from "./types.ts";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/** Download an image and store it in Mongo under its public path (e.g. /games/codm/icon.jpg). */
async function download(url: string, pathKey: string): Promise<void> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const contentType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  await saveImage(pathKey, contentType, Buffer.from(await res.arrayBuffer()));
}

async function itunesIconUrl(game: GameDoc): Promise<string | null> {
  if (!game.itunesTerm) return null;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(game.itunesTerm)}&entity=software&limit=10&country=us`;
  const data = JSON.parse(await fetchText(url)) as {
    results: { trackName: string; artworkUrl512: string }[];
  };
  const firstWord = game.name.split(/[:\s]/)[0].toLowerCase();
  const hit =
    data.results.find((r) => r.trackName.toLowerCase().includes(firstWord)) ?? data.results[0];
  return hit ? hit.artworkUrl512.replace("512x512bb", "1024x1024bb") : null;
}

function metaContent(html: string, prop: string): string | null {
  const m = html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`));
  return m ? m[1] : null;
}

type PlayAssets = { ogTitle: string; iconUrl: string | null; shotUrls: string[] };

async function playAssets(game: GameDoc): Promise<PlayAssets> {
  const html = await fetchText(
    `https://play.google.com/store/apps/details?id=${game.playPackageId}&hl=en&gl=NG`
  );
  const ogTitle = (metaContent(html, "og:title") ?? "").replace(/ - Apps on Google Play$/, "");
  const iconUrl = metaContent(html, "og:image");

  // Landscape screenshots: unique base URLs that appear with w>=500 and w>h.
  const seen = new Map<string, { w: number; h: number }>();
  for (const m of html.matchAll(
    /https:\/\/play-lh\.googleusercontent\.com\/([A-Za-z0-9_-]+)=w(\d+)-h(\d+)/g
  )) {
    const base = m[1];
    const w = Number(m[2]);
    const h = Number(m[3]);
    const prev = seen.get(base);
    if (!prev || w > prev.w) seen.set(base, { w, h });
  }
  const shotUrls = [...seen.entries()]
    .filter(([, d]) => d.w >= 500 && d.w > d.h)
    .map(([base]) => `https://play-lh.googleusercontent.com/${base}=w1296-h729`);
  return { ogTitle, iconUrl, shotUrls };
}

// Words that don't signal an event by themselves (store-name filler + collab separators).
const STOP_WORDS = new Set([
  "x", "tm", "r", "mobile", "game", "games", "soccer", "football", "the", "of", "and",
  "25", "26", "2025", "2026", "bang",
]);

function titleTokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((t) => t && !STOP_WORDS.has(t))
  );
}

function sameTokens(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((t) => b.has(t));
}

function guessTag(title: string): string {
  if (/x|×/.test(title)) return "Collab";
  if (/anniversary/i.test(title)) return "Anniversary";
  if (/season/i.test(title)) return "Season";
  return "Update";
}

export type SyncResult = {
  gamesSynced: number;
  imagesDownloaded: number;
  eventsDetected: string[];
  errors: string[];
};

export async function runSync(): Promise<SyncResult> {
  const result: SyncResult = { gamesSynced: 0, imagesDownloaded: 0, eventsDetected: [], errors: [] };
  const autoPublish = (await getSetting("autoPublishEvents")) === "true";
  const list = await games().find({ active: true }).toArray();

  for (const game of list) {
    if (!game.playPackageId && !game.itunesTerm) continue;
    const update: Partial<GameDoc> = {};

    try {
      const iconUrl = await itunesIconUrl(game);
      if (iconUrl) {
        await download(iconUrl, `/games/${game._id}/icon.jpg`);
        update.icon = `/games/${game._id}/icon.jpg`;
        result.imagesDownloaded += 1;
      }
    } catch (err) {
      result.errors.push(`${game._id} icon: ${(err as Error).message}`);
    }

    if (game.playPackageId) {
      try {
        const play = await playAssets(game);

        const shots: string[] = [];
        for (let i = 0; i < Math.min(play.shotUrls.length, 6); i++) {
          const name = `shot-${i + 1}.jpg`;
          try {
            await download(play.shotUrls[i], `/games/${game._id}/${name}`);
            shots.push(`/games/${game._id}/${name}`);
            result.imagesDownloaded += 1;
          } catch (err) {
            result.errors.push(`${game._id} ${name}: ${(err as Error).message}`);
          }
        }
        if (shots.length > 0) {
          update.screenshots = shots;
          // Fill art slots that were never set, without clobbering admin choices.
          if (!game.card) update.card = shots[0];
          if (!game.banner) update.banner = shots[0];
        }

        // Event detection from the live store title: it's an event only if the
        // title carries meaningful words beyond the game's own name.
        const cleanTitle = play.ogTitle.trim();
        const nameTokens = titleTokens(game.name);
        const extraTokens = [...titleTokens(cleanTitle)].filter((t) => !nameTokens.has(t));
        if (cleanTitle && extraTokens.length > 0) {
          const existing = await events().find({ gameId: game._id }).toArray();
          const titleSet = titleTokens(cleanTitle);
          const exists = existing.some((e) => sameTokens(titleTokens(e.title), titleSet));
          if (!exists) {
            const endsAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
            await events().insertOne({
              _id: `ev-${game._id}-${Date.now().toString(36)}`,
              gameId: game._id,
              title: cleanTitle,
              blurb: `Detected from the ${game.name} store page — edit this description before publishing.`,
              image: shots[0] ?? game.banner ?? game.card,
              tag: guessTag(cleanTitle),
              endsAt,
              status: autoPublish ? "live" : "draft",
            });
            result.eventsDetected.push(`${game.name}: ${cleanTitle}${autoPublish ? " (live)" : " (draft)"}`);
          }
        }
      } catch (err) {
        result.errors.push(`${game._id} play: ${(err as Error).message}`);
      }
    }

    if (Object.keys(update).length > 0) {
      await games().updateOne({ _id: game._id }, { $set: update });
    }
    result.gamesSynced += 1;
  }

  const summary =
    `synced ${result.gamesSynced} games, ${result.imagesDownloaded} images` +
    (result.eventsDetected.length ? `, new events: ${result.eventsDetected.join("; ")}` : "") +
    (result.errors.length ? `, errors: ${result.errors.length}` : "");
  await syncLog().insertOne({ at: new Date(), summary });
  console.log(`[sync] ${summary}`);
  return result;
}

let timer: ReturnType<typeof setInterval> | null = null;

export function scheduleSync(hours: number) {
  if (hours <= 0) return;
  timer = setInterval(() => {
    runSync().catch((err) => console.error("[sync] scheduled run failed:", err.message));
  }, hours * 3600 * 1000);
  // don't keep the process alive just for the schedule
  if (timer.unref) timer.unref();
}
