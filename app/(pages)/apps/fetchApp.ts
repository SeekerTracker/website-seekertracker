/**
 * Shared server-side dApp lookup for /apps and /apps/[package].
 * Prefer Turso catalog, then Solana Mobile GraphQL, then own API mirror.
 */
import {
  getDappByPackage,
  hasTurso,
  type ApiDapp,
} from "app/(utils)/lib/dappStore";
import { SITE_ORIGIN } from "app/(utils)/constant";

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql";
const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`;

export type DApp = ApiDapp | {
  androidPackage: string;
  status?: string;
  removedAt?: string | null;
  rating?: {
    rating: number;
    reviewsByRating?: number[];
  } | null;
  lastRelease?: {
    displayName?: string;
    subtitle?: string;
    description?: string;
    updatedOn?: string;
    newInVersion?: string;
    privacyPolicyUrl?: string;
    icon?: { uri?: string } | null;
    banner?: { uri?: string } | null;
    featureGraphic?: { uri?: string } | null;
    screenshots?: { uri?: string }[] | null;
    publisherDetails?: {
      name?: string;
      website?: string;
      supportEmail?: string;
      twitter?: string;
      telegram?: string;
      websiteOverride?: string;
    };
    blurb?: string;
    claimed?: boolean;
    androidDetails?: {
      version?: string;
      versionCode?: number | null;
      minSdk?: number | null;
    };
  } | null;
};

function getPackageQuery(androidPackage: string) {
  const pkg = androidPackage.replace(/"/g, '\\"');
  return `query {
    dAppByAndroidPackage(systemContext: ${SC}, androidPackage: "${pkg}") {
      androidPackage
      rating { rating reviewsByRating }
      lastRelease(systemContext: ${SC}) {
        displayName
        subtitle
        description
        updatedOn
        newInVersion
        privacyPolicyUrl
        icon { uri }
        banner { uri }
        featureGraphic { uri }
        screenshots { uri }
        publisherDetails { name website supportEmail }
        androidDetails { version versionCode minSdk }
      }
    }
  }`;
}

type StoreMedia = {
  banner?: { uri?: string } | null;
  featureGraphic?: { uri?: string } | null;
  screenshots?: { uri?: string }[] | null;
};

function mergeMedia(app: DApp, media: StoreMedia | null): DApp {
  if (!media || !app.lastRelease) return app;
  const rel = app.lastRelease as NonNullable<DApp["lastRelease"]> & StoreMedia;
  if (media.banner?.uri) rel.banner = media.banner;
  if (media.featureGraphic?.uri) rel.featureGraphic = media.featureGraphic;
  if (media.screenshots?.length) rel.screenshots = media.screenshots;
  return app;
}

async function fetchStoreMedia(pkg: string): Promise<StoreMedia | null> {
  try {
    const res = await fetch(DAPPSTORE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "SeekerTracker/1.0 (+https://seekertracker.com; dApp detail)",
        Origin: "https://seekertracker.com",
        Referer: "https://seekertracker.com/dapps",
      },
      body: JSON.stringify({ query: getPackageQuery(pkg) }),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rel = data?.data?.dAppByAndroidPackage?.lastRelease;
    if (!rel) return null;
    return {
      banner: rel.banner || null,
      featureGraphic: rel.featureGraphic || null,
      screenshots: Array.isArray(rel.screenshots) ? rel.screenshots : null,
    };
  } catch {
    return null;
  }
}

export async function fetchAppByPackage(
  androidPackage: string
): Promise<DApp | null> {
  const pkg = androidPackage.trim();
  if (!pkg) return null;

  let app: DApp | null = null;

  if (hasTurso()) {
    try {
      const row = await getDappByPackage(pkg);
      if (row) app = row as DApp;
    } catch {
      /* fall through */
    }
  }

  const media = await fetchStoreMedia(pkg);
  if (!app && media) {
    try {
      const res = await fetch(DAPPSTORE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent":
            "SeekerTracker/1.0 (+https://seekertracker.com; dApp detail)",
          Origin: "https://seekertracker.com",
          Referer: "https://seekertracker.com/dapps",
        },
        body: JSON.stringify({ query: getPackageQuery(pkg) }),
        next: { revalidate: 1800 },
      });
      if (res.ok) {
        const data = await res.json();
        const gqlApp = data?.data?.dAppByAndroidPackage;
        if (gqlApp) app = gqlApp as DApp;
      }
    } catch {
      /* fall through */
    }
  } else if (app) {
    app = mergeMedia(app, media);
  }

  if (!app) {
    try {
      const res = await fetch(
        `${SITE_ORIGIN}/api/dappstore?package=${encodeURIComponent(pkg)}`,
        { next: { revalidate: 600 } }
      );
      if (res.ok) {
        const j = await res.json();
        if (j.app) app = mergeMedia(j.app as DApp, media);
      }
    } catch {
      /* ignore */
    }
  }

  return app;
}
