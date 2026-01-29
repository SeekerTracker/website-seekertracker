import { NextRequest, NextResponse } from "next/server";

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql";

const SYSTEM_CONTEXT = {
    locale: "en-US",
    platformSdk: 34,
    pixelDensity: 480,
    model: "SEEKER"
};

// Cache for 6 hours
const CACHE_DURATION = 6 * 60 * 60 * 1000;

interface CacheEntry {
    data: unknown;
    timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();

const EXPLORE_QUERY = `
query Explore($systemContext: SystemContext!) {
    explore {
        units(systemContext: $systemContext) {
            edges {
                node {
                    __typename
                    ... on DAppsByCategoryUnit {
                        category {
                            id
                            name
                        }
                        dApps(systemContext: $systemContext, first: 20) {
                            edges {
                                node {
                                    androidPackage
                                    rating {
                                        rating
                                        reviewsByRating
                                    }
                                    lastRelease(systemContext: $systemContext) {
                                        displayName
                                        subtitle
                                        description
                                        updatedOn
                                        newInVersion
                                        privacyPolicyUrl
                                        icon {
                                            uri
                                        }
                                        publisherDetails {
                                            name
                                            website
                                            supportEmail
                                        }
                                        androidDetails {
                                            version
                                            versionCode
                                            minSdk
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
`;

// Search query uses inline parameters due to API quirks with variables
function getSearchQuery(searchText: string) {
    const sanitized = searchText.replace(/"/g, '\\"').replace(/\n/g, ' ');
    return `query { search { results(systemContext: {locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}, searchText: "${sanitized}", first: 10) { __typename ... on DAppsUnit { dApps { edges { node { androidPackage rating { rating reviewsByRating } lastRelease(systemContext: {locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}) { displayName subtitle description updatedOn newInVersion privacyPolicyUrl icon { uri } publisherDetails { name website supportEmail } androidDetails { version versionCode minSdk } } } } } } } } }`;
}

async function fetchFromDAppStore(query: string, variables?: Record<string, unknown>) {
    const body = variables && Object.keys(variables).length > 0
        ? JSON.stringify({ query, variables })
        : JSON.stringify({ query });

    const response = await fetch(DAPPSTORE_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body,
    });

    if (!response.ok) {
        throw new Error(`dApp Store API error: ${response.status}`);
    }

    return response.json();
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action") || "explore";
        const searchText = searchParams.get("q") || "";

        // Create cache key based on action and search
        const cacheKey = action === "search" ? `search:${searchText}` : "explore";

        // Check cache
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json({
                ...cached.data as object,
                cached: true,
                cacheAge: Math.round((Date.now() - cached.timestamp) / 1000 / 60),
            });
        }

        let data;

        if (action === "search" && searchText) {
            data = await fetchFromDAppStore(getSearchQuery(searchText), {});
        } else {
            data = await fetchFromDAppStore(EXPLORE_QUERY, {
                systemContext: SYSTEM_CONTEXT,
            });
        }

        // Store in cache
        cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
        });

        return NextResponse.json({
            ...data,
            cached: false,
        });
    } catch (error) {
        console.error("dApp Store API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch from dApp Store" },
            { status: 500 }
        );
    }
}
