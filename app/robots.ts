import type { MetadataRoute } from "next";

/**
 * App-owned robots rules. Cloudflare may inject additional managed AI-bot
 * rules / Content-Signals at the edge — our Sitemap + Allow still apply.
 *
 * AEO: prefer JSON APIs + /llms.txt over bulk HTML scrapes, but allow major
 * search + AI crawlers on product pages.
 */
export default function robots(): MetadataRoute.Robots {
  const allowCommon = [
    "/",
    "/api",
    "/api/",
    "/llms.txt",
    "/llms-full.txt",
    "/openapi.json",
    "/solana.txt",
    "/developers",
    "/dapps",
    "/dapps/",
    "/snake",
    "/skr",
    "/sweep",
    "/das",
    "/whales",
    "/id/",
    "/explore",
    "/lookup",
    "/brand",
    "/whitepaper",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowCommon,
        disallow: ["/api/admin", "/api/cron", "/export", "/pack"],
      },
      // Explicit allow for major AI / answer-engine crawlers (AEO)
      {
        userAgent: "GPTBot",
        allow: allowCommon,
      },
      {
        userAgent: "ChatGPT-User",
        allow: allowCommon,
      },
      {
        userAgent: "ClaudeBot",
        allow: allowCommon,
      },
      {
        userAgent: "anthropic-ai",
        allow: allowCommon,
      },
      {
        userAgent: "PerplexityBot",
        allow: allowCommon,
      },
      {
        userAgent: "Google-Extended",
        allow: allowCommon,
      },
      {
        userAgent: "Googlebot",
        allow: allowCommon,
      },
      {
        userAgent: "Bingbot",
        allow: allowCommon,
      },
      {
        userAgent: "Applebot",
        allow: allowCommon,
      },
    ],
    sitemap: "https://seekertracker.com/sitemap.xml",
    host: "https://seekertracker.com",
  };
}
