import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

// Catalog changes as admins add/remove games, so keep this off the static build cache.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { games } = await getCatalog().catch(() => ({ games: [] }));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/games`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/skins`, changeFrequency: "daily", priority: 0.8 },
  ];

  const gameRoutes: MetadataRoute.Sitemap = games.map((g) => ({
    url: `${SITE_URL}/games/${g.id}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...gameRoutes];
}
