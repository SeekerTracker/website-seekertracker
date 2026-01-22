import { NextResponse } from "next/server";

interface CompetitorData {
    name: string;
    ticker?: string;
    marketCap: number;
    color: string;
    isSolana?: boolean;
}

// Static fallback data (billions USD)
const STATIC_DATA: CompetitorData[] = [
    { name: "Apple", ticker: "AAPL", marketCap: 3645, color: "#A2AAAD" },
    { name: "Samsung", ticker: "005930.KS", marketCap: 658, color: "#1428A0" },
    { name: "Sony", ticker: "SONY", marketCap: 142, color: "#000000" },
    { name: "Xiaomi", ticker: "1810.HK", marketCap: 116, color: "#FF6900" },
    { name: "Foxconn", ticker: "2317.TW", marketCap: 98, color: "#E31937" },
    { name: "ZTE", ticker: "000063.SZ", marketCap: 27, color: "#0066B3" },
    { name: "Lenovo", ticker: "0992.HK", marketCap: 14, color: "#E2231A" },
    { name: "Asus", ticker: "2357.TW", marketCap: 12, color: "#00539B" },
    { name: "Transsion", ticker: "688036.SS", marketCap: 11, color: "#FF9933" },
    { name: "HTC", ticker: "2498.TW", marketCap: 1.2, color: "#84BD00" },
    { name: "Solana Mobile", marketCap: 0.125, color: "#14F195", isSolana: true },
];

// Ticker mapping for Yahoo Finance API
const YAHOO_TICKERS: { [key: string]: string } = {
    "Apple": "AAPL",
    "Samsung": "005930.KS",
    "Sony": "SONY",
    "Xiaomi": "1810.HK",
    "Foxconn": "2317.TW",
    "ZTE": "000063.SZ",
    "Lenovo": "0992.HK",
    "Asus": "2357.TW",
    "Transsion": "688036.SS",
    "HTC": "2498.TW",
};

// Cache for live data
let cachedData: CompetitorData[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

async function fetchYahooQuote(ticker: string): Promise<number | null> {
    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (meta?.marketCap) {
            return meta.marketCap / 1_000_000_000; // Convert to billions
        }

        // Fallback: calculate from price and shares
        const price = meta?.regularMarketPrice || meta?.previousClose;
        // This won't work without share count, so return null
        return null;
    } catch (error) {
        console.error(`Failed to fetch ${ticker}:`, error);
        return null;
    }
}

async function fetchLiveData(): Promise<CompetitorData[]> {
    const results: CompetitorData[] = [];

    // Fetch US stocks (more reliable)
    const usStocks = ["Apple", "Sony"];

    for (const company of STATIC_DATA) {
        if (company.isSolana) {
            // Solana Mobile - keep static or fetch from another source
            results.push(company);
            continue;
        }

        const ticker = YAHOO_TICKERS[company.name];
        if (ticker && usStocks.includes(company.name)) {
            const marketCap = await fetchYahooQuote(ticker);
            if (marketCap) {
                results.push({ ...company, marketCap });
                continue;
            }
        }

        // Fallback to static data
        results.push(company);
    }

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
