// Downloads real game artwork for the Baron store.
//  - App icon: Apple iTunes Search API (artworkUrl512)
//  - Wide banner: Google Play page og:image (the store feature graphic)
//  - Screenshots: Google Play page (landscape preferred)
// Re-run any time with: node scripts/fetch-assets.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "public", "games");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const GAMES = [
  { id: "codm", itunes: "call of duty mobile", match: /call of duty/i, play: "com.activision.callofduty.shooter" },
  { id: "mlbb", itunes: "mobile legends bang bang", match: /mobile legends/i, play: "com.mobile.legends" },
  { id: "pubgm", itunes: "pubg mobile", match: /pubg/i, play: "com.tencent.ig" },
  { id: "freefire", itunes: "garena free fire", match: /free fire/i, play: "com.dts.freefireth" },
  { id: "bloodstrike", itunes: "blood strike netease", match: /blood strike/i, play: "com.netease.newspike" },
  { id: "fcmobile", itunes: "ea sports fc mobile", match: /(ea sports fc|fc mobile)/i, play: "com.ea.gp.fifamobile" },
  { id: "efootball", itunes: "efootball", match: /efootball/i, play: "jp.konami.pesam" },
  { id: "deltaforce", itunes: "delta force", match: /delta force/i, play: "com.proxima.dfm" },
];

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function download(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

async function itunesIcon(game) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(game.itunes)}&entity=software&limit=10&country=us`;
  const data = JSON.parse(await fetchText(url));
  const hit = data.results.find((r) => game.match.test(r.trackName));
  if (!hit) throw new Error(`no itunes match for ${game.id}`);
  return hit.artworkUrl512.replace("512x512bb", "1024x1024bb");
}

function meta(html, prop) {
  const m = html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`));
  return m ? m[1] : null;
}

async function playAssets(game) {
  const html = await fetchText(`https://play.google.com/store/apps/details?id=${game.play}&hl=en&gl=NG`);
  const banner = meta(html, "og:image");
  const ogTitle = (meta(html, "og:title") || "").replace(/ - Apps on Google Play$/, "");
  const ogDescription = meta(html, "og:description");

  const seen = new Map(); // base url -> {w,h}
  for (const m of html.matchAll(/https:\/\/play-lh\.googleusercontent\.com\/([A-Za-z0-9_-]+)=w(\d+)-h(\d+)/g)) {
    const [, base, w, h] = m;
    const prev = seen.get(base);
    const cur = { w: +w, h: +h };
    if (!prev || cur.w > prev.w) seen.set(base, cur);
  }
  const shots = [...seen.entries()]
    .filter(([, d]) => d.w >= 500)
    .sort((a, b) => b[1].w / b[1].h - a[1].w / a[1].h) // landscape first
    .map(([base]) => `https://play-lh.googleusercontent.com/${base}=w1296`);
  return { banner: banner ? `${banner}=w1024` : null, shots, ogTitle, ogDescription };
}

const manifest = {};
for (const game of GAMES) {
  const dir = path.join(OUT, game.id);
  await mkdir(dir, { recursive: true });
  const entry = { files: [], ogTitle: null, ogDescription: null };
  try {
    await download(await itunesIcon(game), path.join(dir, "icon.jpg"));
    entry.files.push("icon.jpg");
  } catch (e) {
    console.error(`  ${game.id} icon FAILED: ${e.message}`);
  }
  try {
    const { banner, shots, ogTitle, ogDescription } = await playAssets(game);
    entry.ogTitle = ogTitle;
    entry.ogDescription = ogDescription;
    if (banner) {
      await download(banner, path.join(dir, "banner.jpg"));
      entry.files.push("banner.jpg");
    }
    let n = 0;
    for (const shot of shots.slice(0, 5)) {
      n += 1;
      const name = `shot-${n}.jpg`;
      await download(shot, path.join(dir, name));
      entry.files.push(name);
    }
  } catch (e) {
    console.error(`  ${game.id} play assets FAILED: ${e.message}`);
  }
  manifest[game.id] = entry;
  console.log(`${game.id}: ${entry.files.join(", ")} | ${entry.ogTitle}`);
}
await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("done");
