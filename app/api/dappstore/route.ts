import { NextRequest, NextResponse } from "next/server";

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql";

const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`;

// Cache for 6 hours
const CACHE_DURATION = 6 * 60 * 60 * 1000;

interface CacheEntry {
    data: unknown;
    timestamp: number;
}

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

// Search query uses inline parameters due to API quirks with variables
function getSearchQuery(searchText: string) {
    const sanitized = searchText.replace(/"/g, '\\"').replace(/\n/g, ' ');
    return `query { search { results(systemContext: ${SC}, searchText: "${sanitized}", first: 10) { __typename ... on DAppsUnit { dApps { edges { node { ${APP_FIELDS} } } } } } } }`;
}

async function fetchFromDAppStore(query: string) {
    const response = await fetch(DAPPSTORE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ query }),
    });
    if (!response.ok) throw new Error(`dApp Store API error: ${response.status}`);
    return response.json();
}

interface DAppNode {
    androidPackage: string;
    [key: string]: unknown;
}

interface CategoryUnit {
    category: { id: string; name: string };
    dApps: { edges: Array<{ node: DAppNode }> };
}

async function fetchAllDapps() {
    const categoryMap = new Map<string, {
        category: { id: string; name: string };
        dApps: { edges: Array<{ node: DAppNode }> };
    }>();

    const exhausted = new Set<string>(); // category IDs with no more pages
    let offset = 0;
    const MAX_PAGES = 40; // safety cap (800 slots per category max)

    for (let page = 0; page < MAX_PAGES; page++) {
        const after = page === 0 ? undefined : String(offset);
        let data;
        try {
            data = await fetchFromDAppStore(getExploreQuery(after));
        } catch {
            break;
        }

        if (data.errors || !data.data?.explore?.units?.edges) break;

        const units: Array<{ node: { __typename: string } & Partial<CategoryUnit> }> =
            data.data.explore.units.edges;

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
            const existingPackages = new Set(existing.dApps.edges.map(e => e.node.androidPackage));

            for (const appEdge of apps) {
                if (!existingPackages.has(appEdge.node.androidPackage)) {
                    existing.dApps.edges.push(appEdge);
                    newAppsThisRound++;
                }
            }

            // If this page returned < 20, this category is exhausted
            if (apps.length < 20) {
                exhausted.add(catId);
            }
        }

        // If no new apps found this round, we're done
        if (newAppsThisRound === 0) break;

        // If all categories are exhausted, stop
        const allCategoryIds = units
            .filter(e => e.node.__typename === "DAppsByCategoryUnit")
            .map(e => (e.node as Partial<CategoryUnit>).category!.id);

        if (allCategoryIds.every(id => exhausted.has(id))) break;

        offset += 20;
    }

    return Array.from(categoryMap.values());
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action") || "explore";
        const searchText = searchParams.get("q") || "";

        const cacheKey = action === "search" ? `search:${searchText}` : "explore";

        // Check cache
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json({
                ...(cached.data as object),
                cached: true,
                cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60),
            });
        }

        if (action === "search" && searchText) {
            const data = await fetchFromDAppStore(getSearchQuery(searchText));
            cache.set(cacheKey, { data, timestamp: Date.now() });
            return NextResponse.json({ ...data, cached: false });
        }

        // Fetch all dapps with pagination
        const categories = await fetchAllDapps();

        // Count unique apps
        const seen = new Set<string>();
        categories.forEach(cat => cat.dApps.edges.forEach(e => seen.add(e.node.androidPackage)));

        const responseData = {
            data: {
                explore: {
                    units: {
                        edges: categories.map(cat => ({ node: { __typename: "DAppsByCategoryUnit", ...cat } })),
                    },
                },
            },
            totalApps: seen.size,
        };

        cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

        return NextResponse.json({ ...responseData, cached: false });

    } catch (error) {
        console.error("dApp Store API error:", error);
        return NextResponse.json({ error: "Failed to fetch from dApp Store" }, { status: 500 });
    }
}
