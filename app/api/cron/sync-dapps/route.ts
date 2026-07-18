import { NextRequest, NextResponse } from "next/server";
import {
  ensureDappSchema,
  syncDappsFromCategories,
  type UpstreamCategory,
} from "app/(utils)/lib/dappStore";
import { getTurso, hasTurso } from "app/(utils)/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql";
const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`;
const PAGE_SIZE = 20;
const MAX_PAGES = 30;
const PARALLEL = 5;

const APP_FIELDS = `
    androidPackage
    rating { rating reviewsByRating }
    lastRelease(systemContext: ${SC}) {
        displayName subtitle description updatedOn newInVersion privacyPolicyUrl
        icon { uri }
        publisherDetails { name website supportEmail }
        androidDetails { version versionCode minSdk }
    }
`;

function exploreQuery(after?: string) {
  const afterArg = after ? `, after: "${after}"` : "";
  return `query {
    explore {
      units(systemContext: ${SC}) {
        edges {
          node {
            __typename
            ... on DAppsByCategoryUnit {
              category { id name }
              dApps(systemContext: ${SC}, first: ${PAGE_SIZE}${afterArg}) {
                edges { node { ${APP_FIELDS} } }
              }
            }
          }
        }
      }
    }
  }`;
}

async function gql(query: string) {
  const res = await fetch(DAPPSTORE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "SeekerTracker/1.0 dapp-sync",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  return res.json();
}

function auth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const h = req.headers.get("authorization") || "";
  return h === `Bearer ${secret}` || req.nextUrl.searchParams.get("secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasTurso()) {
    return NextResponse.json({ error: "Turso not configured" }, { status: 503 });
  }

  try {
    type Edge = {
      node: {
        __typename: string;
        category?: { id: string; name: string };
        dApps?: { edges: Array<{ node: unknown }> };
      };
    };

    const map = new Map<string, UpstreamCategory>();
    const merge = (units: Edge[]) => {
      let n = 0;
      for (const e of units) {
        if (e.node.__typename !== "DAppsByCategoryUnit") continue;
        const id = e.node.category!.id;
        if (!map.has(id)) {
          map.set(id, {
            category: e.node.category!,
            dApps: { edges: [] },
          });
        }
        const bucket = map.get(id)!;
        const have = new Set(
          bucket.dApps.edges.map((x) => (x.node as { androidPackage: string }).androidPackage)
        );
        for (const app of e.node.dApps?.edges || []) {
          const pkg = (app.node as { androidPackage: string }).androidPackage;
          if (!have.has(pkg)) {
            bucket.dApps.edges.push(app as { node: UpstreamCategory["dApps"]["edges"][0]["node"] });
            have.add(pkg);
            n++;
          }
        }
      }
      return n;
    };

    const first = await gql(exploreQuery());
    const units0: Edge[] =
      first?.data?.explore?.units?.edges || [];
    merge(units0);

    for (let start = 1; start < MAX_PAGES; start += PARALLEL) {
      const pages = Array.from({ length: PARALLEL }, (_, i) => start + i).filter(
        (p) => p < MAX_PAGES
      );
      const results = await Promise.all(
        pages.map(async (page) => {
          try {
            const j = await gql(exploreQuery(String(page * PAGE_SIZE)));
            return (j?.data?.explore?.units?.edges || []) as Edge[];
          } catch {
            return [] as Edge[];
          }
        })
      );
      let batch = 0;
      for (const edges of results) batch += merge(edges);
      if (batch === 0) break;
    }

    const categories = Array.from(map.values());
    const db = getTurso();
    await ensureDappSchema(db);
    const stats = await syncDappsFromCategories(categories, db);

    return NextResponse.json({
      ok: true,
      categories: categories.length,
      ...stats,
    });
  } catch (e) {
    console.error("sync-dapps", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export const POST = GET;
