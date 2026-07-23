import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Deployed Loadax API (Render)
      { protocol: "https", hostname: "*.onrender.com" },
      // Local dev API
      { protocol: "http", hostname: "localhost", port: "4000" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000" },
    ],
    // Next 16 blocks loopback upstreams by default; needed for the localhost:4000
    // API during local dev. Harmless in prod — remotePatterns still applies.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
