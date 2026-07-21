import type { MetadataRoute } from "next";
import { hasTurso, listDappPackages } from "app/(utils)/lib/dappStore";

const SITE = "https://seekertracker.com";

const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/apps", changeFrequency: "daily", priority: 0.9 },
  { path: "/explore", changeFrequency: "daily", priority: 0.9 },
  { path: "/lookup", changeFrequency: "weekly", priority: 0.8 },
  { path: "/skr", changeFrequency: "daily", priority: 0.8 },
  { path: "/whales", changeFrequency: "daily", priority: 0.7 },
  { path: "/activations", changeFrequency: "weekly", priority: 0.7 },
  { path: "/winners", changeFrequency: "weekly", priority: 0.6 },
  { path: "/brand", changeFrequency: "monthly", priority: 0.5 },
  { path: "/whitepaper", changeFrequency: "monthly", priority: 0.6 },
  { path: "/seeker-fund", changeFrequency: "weekly", priority: 0.7 },
  { path: "/competitors", changeFrequency: "weekly", priority: 0.6 },
  { path: "/getdapp", changeFrequency: "weekly", priority: 0.7 },
  { path: "/das", changeFrequency: "weekly", priority: 0.6 },
  { path: "/pack", changeFrequency: "weekly", priority: 0.6 },
  { path: "/sweep", changeFrequency: "weekly", priority: 0.6 },
  { path: "/snake", changeFrequency: "monthly", priority: 0.4 },
  { path: "/usage", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/license", changeFrequency: "yearly", priority: 0.3 },
  { path: "/copyright", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${SITE}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  let appEntries: MetadataRoute.Sitemap = [];
  if (hasTurso()) {
    try {
      const packages = await listDappPackages("active");
      appEntries = packages.map((pkg) => ({
        url: `${SITE}/apps/${encodeURIComponent(pkg)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } catch (e) {
      console.error("[sitemap] dapp packages", e);
    }
  }

  return [...staticEntries, ...appEntries];
}
