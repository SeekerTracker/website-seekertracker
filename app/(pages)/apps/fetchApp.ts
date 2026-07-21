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
        publisherDetails { name website supportEmail }
        androidDetails { version versionCode minSdk }
      }
    }
  }`;
}

export async function fetchAppByPackage(
  androidPackage: string
): Promise<DApp | null> {
  const pkg = androidPackage.trim();
  if (!pkg) return null;

  if (hasTurso()) {
    try {
      const app = await getDappByPackage(pkg);
      if (app) return app as DApp;
    } catch {
      /* fall through */
    }
  }

  try {
    const res = await fetch(DAPPSTORE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "SeekerTracker/1.0 (+https://seekertracker.com; dApp detail)",
        Origin: "https://seekertracker.com",
        Referer: "https://seekertracker.com/apps",
      },
      body: JSON.stringify({ query: getPackageQuery(pkg) }),
      next: { revalidate: 1800 },
    });
    if (res.ok) {
      const data = await res.json();
      const app = data?.data?.dAppByAndroidPackage;
      if (app) return app as DApp;
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch(
      `${SITE_ORIGIN}/api/dappstore?package=${encodeURIComponent(pkg)}`,
      { next: { revalidate: 600 } }
    );
    if (res.ok) {
      const j = await res.json();
      if (j.app) return j.app as DApp;
    }
  } catch {
    /* ignore */
  }

  return null;
}
