// Single source of truth for the site's public URL — used by metadata, robots.ts and sitemap.ts.
// Update NEXT_PUBLIC_SITE_URL (in .env.local / Vercel project settings) when the domain changes.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://baron-sable.vercel.app";
