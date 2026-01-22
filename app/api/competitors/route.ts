import { NextResponse } from "next/server";

interface CompetitorData {
    name: string;
    ticker?: string;
    marketCap: number;
    color: string;
    isSolana?: boolean;
}

// Company config with companiesmarketcap.com slugs
const COMPANIES: { name: string; slug: string; ticker: string; color: string; fallback: number }[] = [
    { name: "Apple", slug: "apple", ticker: "AAPL", color: "#A2AAAD", fallback: 3645 },
    { name: "Samsung", slug: "samsung", ticker: "005930.KS", color: "#1428A0", fallback: 658 },
    { name: "Sony", slug: "sony", ticker: "SONY", color: "#000000", fallback: 142 },
    { name: "Xiaomi", slug: "xiaomi", ticker: "1810.HK", color: "#FF6900", fallback: 116 },
    { name: "Foxconn", slug: "foxconn", ticker: "2317.TW", color: "#E31937", fallback: 98 },
    { name: "ZTE", slug: "zte", ticker: "000063.SZ", color: "#0066B3", fallback: 27 },
    { name: "Lenovo", slug: "lenovo", ticker: "0992.HK", color: "#E2231A", fallback: 14 },
    { name: "Asus", slug: "asus", ticker: "2357.TW", color: "#00539B", fallback: 12 },
    { name: "Transsion", slug: "transsion-holdings", ticker: "688036.SS", color: "#FF9933", fallback: 11 },
    { name: "HTC", slug: "htc", ticker: "2498.TW", color: "#84BD00", fallback: 1.2 },
];

// Cache for live data
let cachedData: CompetitorData[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function fetchMarketCap(slug: string): Promise<number | null> {
    try {
        const response = await fetch(
            `https://companiesmarketcap.com/${slug}/marketcap/`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
            }
        );

        if (!response.ok) return null;

        const html = await response.text();

        // Find all market cap values and pick the first reasonable one
        // Pattern: $XXX.XX B or $X.XXX T (company market caps)
        const allMatches = html.matchAll(/\$([0-9,.]+)\s*([BTM])\b/gi);

        for (const match of allMatches) {
            const value = parseFloat(match[1].replace(/,/g, ""));
            const unit = match[2].toUpperCase();

            let billions = 0;
            if (unit === "T") {
                billions = value * 1000;
            } else if (unit === "B") {
                billions = value;
            } else if (unit === "M") {
                billions = value / 1000;
            }

            // Skip obviously wrong values (global market caps > $50T)
            if (billions > 50000) continue;

            // Return first reasonable value
            if (billions > 0) {
                return Math.round(billions * 100) / 100; // Round to 2 decimals
            }
        }

        return null;
    } catch (error) {
        console.error(`Failed to fetch ${slug}:`, error);
        return null;
    }
}

async function fetchLiveData(): Promise<CompetitorData[]> {
    const results: CompetitorData[] = [];

    // Fetch all companies in parallel
    const promises = COMPANIES.map(async (company) => {
        const marketCap = await fetchMarketCap(company.slug);
        return {
            name: company.name,
            ticker: company.ticker,
            marketCap: marketCap ?? company.fallback,
            color: company.color,
        };
    });

    const fetched = await Promise.all(promises);
    results.push(...fetched);

    // Add Solana Mobile (static value)
    results.push({
        name: "Solana Mobile",
        marketCap: 0.125,
        color: "#14F195",
        isSolana: true,
    });

    return results;
}

export async function GET() {
    try {
        // Check cache
        if (cachedData && Date.now() - lastFetch < CACHE_DURATION) {
            return NextResponse.json({
                companies: cachedData,
                lastUpdated: lastFetch,
                cached: true,
            });
        }

        // Try to fetch live data
        let companies: CompetitorData[];
        try {
            companies = await fetchLiveData();
        } catch {
            companies = STATIC_DATA;
        }

        // Update cache
        cachedData = companies;
        lastFetch = Date.now();

        return NextResponse.json({
            companies,
            lastUpdated: lastFetch,
            cached: false,
        });
    } catch (error) {
        console.error("Competitors API error:", error);
        return NextResponse.json({
            companies: STATIC_DATA,
            lastUpdated: Date.now(),
            error: "Using static data",
        });
    }
}
