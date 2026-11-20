import type { NextConfig } from "next";

// Static export: Cloudflare serves the pages from its edge cache, and the Worker in worker/ answers /api/*.
const nextConfig: NextConfig = {
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
