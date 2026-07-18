import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql";

const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`;

// Success cache only (never cache empty/error)
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 min
const FETCH_BUDGET_MS = 25_000; // stay under Worker wall time

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

// Module-scope cache — fine on CF isolates; only stores non-empty success.
const cache: Map<string, CacheEntry> = new Map();

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
                            dApps(systemContext: ${SC}, first: 20${afterArg}) {
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

async function fetchFromDAppStore(query: string): Promise<{
  data?: unknown;
  errors?: Array<{ message?: string }>;
}> {
  const response = await fetch(DAPPSTORE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Some edges reject bare server clients
      "User-Agent":
        "SeekerTracker/1.0 (+https://seekertracker.com; dApp catalog mirror)",
      Origin: "https://seekertracker.com",
      Referer: "https://seekertracker.com/apps",
    },
    body: JSON.stringify({ query }),
    // Avoid CF caching error responses as 200 empty
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `dApp Store HTTP ${response.status}: ${text.slice(0, 200)}`
    );
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

async function fetchAllDapps(deadline: number) {
  const categoryMap = new Map<
    string,
    {
      category: { id: string; name: string };
      dApps: { edges: Array<{ node: DAppNode }> };
    }
  >();

  const exhausted = new Set<string>();
  let offset = 0;
  const MAX_PAGES = 40;
  let lastError: string | null = null;
  let pagesOk = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    if (Date.now() > deadline) {
      lastError = lastError || "time budget exceeded";
      break;
    }

    const after = page === 0 ? undefined : String(offset);
    let payload: Awaited<ReturnType<typeof fetchFromDAppStore>>;
    try {
      payload = await fetchFromDAppStore(getExploreQuery(after));
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error("dappstore page fetch failed", page, lastError);
      // Keep partial data if we already have some pages
      break;
    }

    if (payload.errors?.length) {
      lastError = payload.errors.map((x) => x.message).join("; ");
      console.error("dappstore GraphQL errors", lastError);
      break;
    }

    const root = payload.data as {
      explore?: { units?: { edges?: Array<{ node: { __typename: string } & Partial<CategoryUnit> }> } };
    } | null;

    const units = root?.explore?.units?.edges;
    if (!units?.length) {
      lastError = lastError || "empty explore.units.edges";
      break;
    }

    pagesOk++;
    let newAppsThisRound = 0;

    for (const edge of units) {
      const node = edge.node;
      if (node.__typename !== "DAppsByCategoryUnit") continue;
      const catId = node.category!.id;
      if (exhausted.has(catId)) continue;

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
          newAppsThisRound++;
        }
      }

      if (apps.length < 20) {
        exhausted.add(catId);
      }
    }

    if (newAppsThisRound === 0) break;

    const allCategoryIds = units
      .filter((e) => e.node.__typename === "DAppsByCategoryUnit")
      .map((e) => (e.node as Partial<CategoryUnit>).category!.id);

    if (allCategoryIds.every((id) => exhausted.has(id))) break;

    offset += 20;
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "explore";
    const searchText = searchParams.get("q") || "";
    const packageName = searchParams.get("package") || "";
    const debug = searchParams.get("debug") === "1";

    const cacheKey =
      action === "search"
        ? `search:${searchText}`
        : packageName
          ? `package:${packageName}`
          : "explore";

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      const body = cached.data as { totalApps?: number };
      // Never serve a poisoned empty explore cache
      if (action === "explore" && !packageName && (body.totalApps ?? 0) === 0) {
        cache.delete(cacheKey);
      } else {
        return NextResponse.json({
          ...(cached.data as object),
          cached: true,
          cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60),
        });
      }
    }

    if (action === "search" && searchText) {
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
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return NextResponse.json({ ...data, cached: false });
    }

    // Single-package deep link: scan explore pages until found (or budget)
    if (packageName) {
      const deadline = Date.now() + Math.min(FETCH_BUDGET_MS, 20_000);
      const { categories, lastError, pagesOk } = await fetchAllDapps(deadline);
      let found: DAppNode | null = null;
      for (const cat of categories) {
        const hit = cat.dApps.edges.find(
          (e) => e.node.androidPackage === packageName
        );
        if (hit) {
          found = hit.node;
          break;
        }
      }
      if (!found) {
        // Fallback: search by package fragment
        try {
          const data = await fetchFromDAppStore(
            getSearchQuery(packageName.replace(/^com\./, ""))
          );
          const results = (data.data as {
            search?: {
              results?: {
                dApps?: { edges?: Array<{ node: DAppNode }> };
              };
            };
          })?.search?.results;
          const edges = results?.dApps?.edges || [];
          found =
            edges.find((e) => e.node.androidPackage === packageName)?.node ||
            edges[0]?.node ||
            null;
        } catch {
          /* ignore */
        }
      }

      if (!found) {
        return NextResponse.json(
          {
            error: "App not found",
            package: packageName,
            pagesOk,
            detail: lastError,
          },
          { status: 404 }
        );
      }

      const responseData = { app: found, package: packageName };
      cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      return NextResponse.json({ ...responseData, cached: false });
    }

    // Full catalog explore
    const deadline = Date.now() + FETCH_BUDGET_MS;
    const { categories, pagesOk, lastError } = await fetchAllDapps(deadline);
    const responseData = buildExploreResponse(categories);

    // Never cache empty catalog — that poisoned CF for 6h previously
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

    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return NextResponse.json({
      ...responseData,
      cached: false,
      pagesOk,
      ...(debug ? { detail: lastError } : {}),
    });
  } catch (error) {
    console.error("dApp Store API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch from dApp Store",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
