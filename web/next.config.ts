import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000" },
    ],
    // The Baron API serves game artwork from localhost:4000; Next 16's image
    // optimizer blocks loopback/private upstream IPs by default. Safe here since
    // the only remote pattern is our own API. Remove once the API lives on a
    // public domain.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
