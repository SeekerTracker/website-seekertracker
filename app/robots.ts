import type { MetadataRoute } from "next";

/**
 * App-owned robots rules. Cloudflare may inject additional managed AI-bot
 * rules at the edge. Public product data is meant to be consumed via JSON
 * APIs (/api, /llms.txt, /openapi.json), not bulk HTML scrapes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/api",
          "/api/",
          "/llms.txt",
          "/llms-full.txt",
          "/openapi.json",
          "/developers",
          "/apps",
          "/id/",
        ],
      },
    ],
    sitemap: "https://seekertracker.com/sitemap.xml",
    host: "https://seekertracker.com",
  };
}
