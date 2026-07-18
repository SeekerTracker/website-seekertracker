import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql";
const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`;
const R2_KEY = "cache/dappstore-explore.json";

// In-memory (per isolate) — only non-empty success
const MEM_TTL_MS = 15 * 60 * 1000;
// R2 durable cache — survives cold starts
const R2_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const FETCH_BUDGET_MS = 22_000;
const PAGE_SIZE = 20;
const MAX_PAGES = 30;
const PARALLEL = 5;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const memCache: Map<string, CacheEntry> = new Map();

// List/catalog fields — skip long description (fetched per-app if needed)
const APP_FIELDS = `
    androidPackage
    rating {
        rating
        reviewsByRating
    }
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
`;

function getExploreQuery(after?: string): string {
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
                                edges {
                                    node { ${APP_FIELDS} }
                                }
                            }
                        }
                    }
                }
            }
        }
    }`;
}

function getSearchQuery(searchText: string) {
  const sanitized = searchText.replace(/"/g, '\\"').replace(/\n/g, " ");
  return `query { search { results(systemContext: ${SC}, searchText: "${sanitized}", first: 25) { __typename ... on DAppsUnit { dApps { edges { node { ${APP_FIELDS} } } } } } } }`;
}

function getPackageQuery(androidPackage: string) {
  const pkg = androidPackage.replace(/"/g, '\\"');
  return `query {
    dAppByAndroidPackage(systemContext: ${SC}, androidPackage: "${pkg}") {
      ${APP_FIELDS}
    }
  }`;
}

async function fetchFromDAppStore(query: string): Promise<{
  data?: unknown;
  errors?: Array<{ message?: string }>;
}> {
  const response = await fetch(DAPPSTORE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent":
        "SeekerTracker/1.0 (+https://seekertracker.com; dApp catalog mirror)",
      Origin: "https://seekertracker.com",
      Referer: "https://seekertracker.com/apps",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`dApp Store HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text) as {
      data?: unknown;
      errors?: Array<{ message?: string }>;
    };
  } catch {
    throw new Error(`dApp Store non-JSON: ${text.slice(0, 200)}`);
  }
}

interface DAppNode {
  androidPackage: string;
  [key: string]: unknown;
}

interface CategoryUnit {
  category: { id: string; name: string };
  dApps: { edges: Array<{ node: DAppNode }> };
}

type ExploreUnitEdge = {
  node: { __typename: string } & Partial<CategoryUnit>;
};

function mergePage(
  categoryMap: Map<
    string,
    {
      category: { id: string; name: string };
      dApps: { edges: Array<{ node: DAppNode }> };
    }
  >,
  units: ExploreUnitEdge[]
): { newApps: number; exhausted: string[] } {
  const newlyExhausted: string[] = [];
  let newApps = 0;

  for (const edge of units) {
    const node = edge.node;
    if (node.__typename !== "DAppsByCategoryUnit") continue;
    const catId = node.category!.id;
    const apps = node.dApps!.edges;

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        category: node.category!,
        dApps: { edges: [] },
      });
    }

    const existing = categoryMap.get(catId)!;
    const existingPackages = new Set(
      existing.dApps.edges.map((e) => e.node.androidPackage)
    );

    for (const appEdge of apps) {
      if (!existingPackages.has(appEdge.node.androidPackage)) {
        existing.dApps.edges.push(appEdge);
        existingPackages.add(appEdge.node.androidPackage);
        newApps++;
      }
    }

    if (apps.length < PAGE_SIZE) {
      newlyExhausted.push(catId);
    }
  }

  return { newApps, exhausted: newlyExhausted };
}

async function fetchAllDapps(deadline: number) {
  const categoryMap = new Map<
    string,
    {
      category: { id: string; name: string };
      dApps: { edges: Array<{ node: DAppNode }> };
    }
  >();
  const exhausted = new Set<string>();
  let lastError: string | null = null;
  let pagesOk = 0;

  // Page 0 first (discover categories)
  try {
    const first = await fetchFromDAppStore(getExploreQuery(undefined));
    if (first.errors?.length) {
      lastError = first.errors.map((e) => e.message).join("; ");
      return { categories: [], pagesOk: 0, lastError };
    }
    const units =
      (
        first.data as {
          explore?: { units?: { edges?: ExploreUnitEdge[] } };
        } | null
      )?.explore?.units?.edges || [];
    if (!units.length) {
      return {
        categories: [],
        pagesOk: 0,
        lastError: "empty explore.units.edges",
      };
    }
    const m = mergePage(categoryMap, units);
    m.exhausted.forEach((id) => exhausted.add(id));
    pagesOk = 1;
  } catch (e) {
    return {
      categories: [],
      pagesOk: 0,
      lastError: e instanceof Error ? e.message : String(e),
    };
  }

  // Remaining pages in parallel batches (API uses offset-style `after`)
  for (let start = 1; start < MAX_PAGES; start += PARALLEL) {
    if (Date.now() > deadline) {
      lastError = lastError || "time budget exceeded";
      break;
    }

    const pageIndexes = Array.from(
      { length: PARALLEL },
      (_, i) => start + i
    ).filter((p) => p < MAX_PAGES);

    const results = await Promise.all(
      pageIndexes.map(async (page) => {
        try {
          const payload = await fetchFromDAppStore(
            getExploreQuery(String(page * PAGE_SIZE))
          );
          if (payload.errors?.length) {
            return {
              page,
              error: payload.errors.map((e) => e.message).join("; "),
              units: [] as ExploreUnitEdge[],
            };
          }
          const units =
            (
              payload.data as {
                explore?: { units?: { edges?: ExploreUnitEdge[] } };
              } | null
            )?.explore?.units?.edges || [];
          return { page, error: null as string | null, units };
        } catch (e) {
          return {
            page,
            error: e instanceof Error ? e.message : String(e),
            units: [] as ExploreUnitEdge[],
          };
        }
      })
    );

    let batchNew = 0;
    for (const r of results.sort((a, b) => a.page - b.page)) {
      if (r.error) {
        lastError = r.error;
        continue;
      }
      if (!r.units.length) continue;
      pagesOk++;
      const m = mergePage(categoryMap, r.units);
      batchNew += m.newApps;
      m.exhausted.forEach((id) => exhausted.add(id));
    }

    // No new apps across the batch → catalog complete
    if (batchNew === 0) break;
  }

  return {
    categories: Array.from(categoryMap.values()),
    pagesOk,
    lastError,
  };
}

function buildExploreResponse(
  categories: Array<{
    category: { id: string; name: string };
    dApps: { edges: Array<{ node: DAppNode }> };
  }>
) {
  const seen = new Set<string>();
  categories.forEach((cat) =>
    cat.dApps.edges.forEach((e) => seen.add(e.node.androidPackage))
  );

  return {
    data: {
      explore: {
        units: {
          edges: categories.map((cat) => ({
            node: { __typename: "DAppsByCategoryUnit", ...cat },
          })),
        },
      },
    },
    totalApps: seen.size,
  };
}

type R2Bucket = {
  get: (k: string) => Promise<{ text: () => Promise<string> } | null>;
  put: (
    k: string,
    v: string,
    opts?: { httpMetadata?: { contentType?: string } }
  ) => Promise<unknown>;
};

async function getR2(): Promise<R2Bucket | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((env as any).DOWNLOADS as R2Bucket) || null;
  } catch {
    return null;
  }
}

async function readR2Catalog(): Promise<{
  body: ReturnType<typeof buildExploreResponse>;
  timestamp: number;
} | null> {
  try {
    const bucket = await getR2();
    if (!bucket) return null;
    const obj = await bucket.get(R2_KEY);
    if (!obj) return null;
    const raw = await obj.text();
    const parsed = JSON.parse(raw) as {
      timestamp: number;
      body: ReturnType<typeof buildExploreResponse>;
    };
    if (!parsed?.body?.totalApps || parsed.body.totalApps < 50) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeR2Catalog(
  body: ReturnType<typeof buildExploreResponse>
): Promise<boolean> {
  try {
    const bucket = await getR2();
    if (!bucket) {
      console.error("dappstore R2: no DOWNLOADS binding");
      return false;
    }
    await bucket.put(
      R2_KEY,
      JSON.stringify({ timestamp: Date.now(), body }),
      { httpMetadata: { contentType: "application/json" } }
    );
    return true;
  } catch (e) {
    console.error("dappstore R2 write failed", e);
    return false;
  }
}

function jsonOk(data: object, opts?: { cacheSeconds?: number }) {
  const s = opts?.cacheSeconds ?? 300;
  return NextResponse.json(data, {
    headers: {
      // Browser + CF edge can reuse successful catalog
      "Cache-Control": `public, s-maxage=${s}, stale-while-revalidate=${s * 6}`,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "explore";
    const searchText = searchParams.get("q") || "";
    const packageName = searchParams.get("package") || "";
    const debug = searchParams.get("debug") === "1";
    const force = searchParams.get("refresh") === "1";

    // ── Search ──
    if (action === "search" && searchText) {
      const memKey = `search:${searchText}`;
      const mem = memCache.get(memKey);
      if (!force && mem && Date.now() - mem.timestamp < MEM_TTL_MS) {
        return jsonOk({ ...(mem.data as object), cached: true, cache: "memory" });
      }
      const data = await fetchFromDAppStore(getSearchQuery(searchText));
      if (data.errors?.length) {
        return NextResponse.json(
          {
            error: "dApp Store search failed",
            detail: data.errors.map((e) => e.message).join("; "),
          },
          { status: 502 }
        );
      }
      memCache.set(memKey, { data, timestamp: Date.now() });
      return jsonOk({ ...data, cached: false }, { cacheSeconds: 120 });
    }

    // ── Single package (deep link / modal) — one GraphQL call, not full catalog ──
    if (packageName) {
      const memKey = `package:${packageName}`;
      const mem = memCache.get(memKey);
      if (!force && mem && Date.now() - mem.timestamp < MEM_TTL_MS) {
        return jsonOk({ ...(mem.data as object), cached: true, cache: "memory" });
      }

      try {
        const data = await fetchFromDAppStore(getPackageQuery(packageName));
        const app = (
          data.data as { dAppByAndroidPackage?: DAppNode } | null
        )?.dAppByAndroidPackage;
        if (app) {
          const responseData = { app, package: packageName };
          memCache.set(memKey, { data: responseData, timestamp: Date.now() });
          return jsonOk({ ...responseData, cached: false }, { cacheSeconds: 600 });
        }
      } catch (e) {
        console.error("package GraphQL failed", e);
      }

      // Fallback: search fragment
      try {
        const data = await fetchFromDAppStore(
          getSearchQuery(packageName.replace(/^com\./, ""))
        );
        const results = (
          data.data as {
            search?: {
              results?: { dApps?: { edges?: Array<{ node: DAppNode }> } };
            };
          }
        )?.search?.results;
        const edges = results?.dApps?.edges || [];
        const found =
          edges.find((e) => e.node.androidPackage === packageName)?.node ||
          edges[0]?.node ||
          null;
        if (found) {
          const responseData = { app: found, package: packageName };
          memCache.set(memKey, { data: responseData, timestamp: Date.now() });
          return jsonOk({ ...responseData, cached: false }, { cacheSeconds: 300 });
        }
      } catch {
        /* ignore */
      }

      return NextResponse.json(
        { error: "App not found", package: packageName },
        { status: 404 }
      );
    }

    // ── Full catalog explore ──
    const memKey = "explore";
    if (!force) {
      const mem = memCache.get(memKey);
      if (mem && Date.now() - mem.timestamp < MEM_TTL_MS) {
        const body = mem.data as { totalApps?: number };
        if ((body.totalApps ?? 0) > 0) {
          return jsonOk({
            ...(mem.data as object),
            cached: true,
            cache: "memory",
            cacheAge: Math.round((Date.now() - mem.timestamp) / 1000 / 60),
          });
        }
      }

      const r2 = await readR2Catalog();
      if (r2 && Date.now() - r2.timestamp < R2_TTL_MS) {
        memCache.set(memKey, { data: r2.body, timestamp: r2.timestamp });
        // Stale-while-revalidate: kick off background refresh if older than 30m
        if (Date.now() - r2.timestamp > 30 * 60 * 1000) {
          void refreshCatalogInBackground();
        }
        return jsonOk({
          ...r2.body,
          cached: true,
          cache: "r2",
          cacheAge: Math.round((Date.now() - r2.timestamp) / 1000 / 60),
        });
      }
      // Serve stale R2 rather than empty while refreshing
      if (r2 && r2.body.totalApps > 0) {
        void refreshCatalogInBackground();
        return jsonOk({
          ...r2.body,
          cached: true,
          cache: "r2-stale",
          cacheAge: Math.round((Date.now() - r2.timestamp) / 1000 / 60),
        });
      }
    }

    const deadline = Date.now() + FETCH_BUDGET_MS;
    const { categories, pagesOk, lastError } = await fetchAllDapps(deadline);
    const responseData = buildExploreResponse(categories);

    if (responseData.totalApps === 0) {
      return NextResponse.json(
        {
          ...responseData,
          cached: false,
          error: "Failed to fetch dApp catalog from Solana Mobile",
          detail: lastError,
          pagesOk,
          ...(debug ? { hint: "upstream empty or blocked from this edge" } : {}),
        },
        { status: 502 }
      );
    }

    memCache.set(memKey, { data: responseData, timestamp: Date.now() });
    // Must await R2 put — voided writes die when the Worker freezes after response
    const r2Ok = await writeR2Catalog(responseData);

    return jsonOk({
      ...responseData,
      cached: false,
      pagesOk,
      r2: r2Ok,
      ...(debug ? { detail: lastError } : {}),
    });
  } catch (error) {
    console.error("dApp Store API error:", error);
    // Last resort: any R2 catalog
    const r2 = await readR2Catalog();
    if (r2?.body?.totalApps) {
      return jsonOk({
        ...r2.body,
        cached: true,
        cache: "r2-fallback",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    return NextResponse.json(
      {
        error: "Failed to fetch from dApp Store",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

let refreshInFlight: Promise<void> | null = null;

function refreshCatalogInBackground() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const { categories, lastError } = await fetchAllDapps(
        Date.now() + FETCH_BUDGET_MS
      );
      const body = buildExploreResponse(categories);
      if (body.totalApps > 0) {
        memCache.set("explore", { data: body, timestamp: Date.now() });
        await writeR2Catalog(body);
      } else {
        console.error("background refresh empty", lastError);
      }
    } catch (e) {
      console.error("background refresh failed", e);
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}
