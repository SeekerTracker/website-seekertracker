import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CompetitorData {
  name: string;
  ticker?: string;
  marketCap: number; // USD billions
  color: string;
  isSolana?: boolean;
}

const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

/** Equity OEM caps. fallback = USD billions (Aug 2026). */
const COMPANIES: {
  name: string;
  slug: string;
  ticker: string;
  color: string;
  fallback: number;
}[] = [
  { name: "Apple", slug: "apple", ticker: "AAPL", color: "#A2AAAD", fallback: 4580 },
  { name: "Samsung", slug: "samsung", ticker: "005930.KS", color: "#1428A0", fallback: 420 },
  { name: "Sony", slug: "sony", ticker: "SONY", color: "#000000", fallback: 150 },
  { name: "Xiaomi", slug: "xiaomi", ticker: "1810.HK", color: "#FF6900", fallback: 160 },
  { name: "Foxconn", slug: "foxconn", ticker: "2317.TW", color: "#E31937", fallback: 90 },
  { name: "ZTE", slug: "zte", ticker: "000063.SZ", color: "#0066B3", fallback: 30 },
  { name: "Lenovo", slug: "lenovo", ticker: "0992.HK", color: "#E2231A", fallback: 16 },
  { name: "Asus", slug: "asus", ticker: "2357.TW", color: "#00539B", fallback: 12 },
  { name: "Transsion", slug: "transsion-holdings", ticker: "688036.SS", color: "#FF9933", fallback: 12 },
  { name: "HTC", slug: "htc", ticker: "2498.TW", color: "#84BD00", fallback: 1.08 },
];

const SKR_FALLBACK_B = 0.142; // ~$142M circulating

function getFallbackData(): CompetitorData[] {
  return [
    ...COMPANIES.map((c) => ({
      name: c.name,
      ticker: c.ticker,
      marketCap: c.fallback,
      color: c.color,
    })),
    {
      name: "SKR",
      ticker: "SKR",
      marketCap: SKR_FALLBACK_B,
      color: "#00ffd9",
      isSolana: true,
    },
  ];
}

let cachedData: CompetitorData[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000;

function billionsFromUsd(usd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.round((usd / 1_000_000_000) * 1000) / 1000;
}

async function fetchYahooMarketCap(ticker: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 SeekerTracker/competitors" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      quoteResponse?: { result?: Array<{ marketCap?: number }> };
    };
    const mcap = json.quoteResponse?.result?.[0]?.marketCap;
    if (typeof mcap === "number" && mcap > 0) return billionsFromUsd(mcap);
    return null;
  } catch {
    return null;
  }
}

async function fetchCompaniesMarketCap(slug: string): Promise<number | null> {
  try {
    const response = await fetch(`https://companiesmarketcap.com/${slug}/marketcap/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const html = await response.text();
    const allMatches = html.matchAll(/\$([0-9,.]+)\s*([BTM])\b/gi);
    for (const match of allMatches) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      const unit = match[2].toUpperCase();
      let billions = 0;
      if (unit === "T") billions = value * 1000;
      else if (unit === "B") billions = value;
      else if (unit === "M") billions = value / 1000;
      if (billions > 50000) continue;
      if (billions > 0) return Math.round(billions * 100) / 100;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchEquityCap(company: (typeof COMPANIES)[number]): Promise<number> {
  const yahoo = await fetchYahooMarketCap(company.ticker);
  if (yahoo && yahoo > 0) return yahoo;
  const scraped = await fetchCompaniesMarketCap(company.slug);
  if (scraped && scraped > 0) return scraped;
  return company.fallback;
}

/** Circulating SKR mcap (not FDV). Dexscreener `marketCap` is circ. */
async function fetchSkrCirculatingBillions(): Promise<number> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${SKR_MINT}`,
      { cache: "no-store" }
    );
    if (!res.ok) return SKR_FALLBACK_B;
    const json = (await res.json()) as {
      pairs?: Array<{
        marketCap?: number;
        fdv?: number;
        liquidity?: { usd?: number };
      }>;
    };
    const pairs = [...(json.pairs || [])].sort(
      (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    );
    const best = pairs[0];
    const usd = Number(best?.marketCap || 0);
    if (usd > 0) return billionsFromUsd(usd);
    return SKR_FALLBACK_B;
  } catch {
    return SKR_FALLBACK_B;
  }
}

async function fetchLiveData(): Promise<CompetitorData[]> {
  const [companiesData, skrCap] = await Promise.all([
    Promise.all(
      COMPANIES.map(async (company) => ({
        name: company.name,
        ticker: company.ticker,
        marketCap: await fetchEquityCap(company),
        color: company.color,
      }))
    ),
    fetchSkrCirculatingBillions(),
  ]);

  return [
    ...companiesData,
    {
      name: "SKR",
      ticker: "SKR",
      marketCap: skrCap,
      color: "#00ffd9",
      isSolana: true,
    },
  ];
}

export async function GET() {
  try {
    if (cachedData && Date.now() - lastFetch < CACHE_DURATION) {
      return NextResponse.json({
        companies: cachedData,
        lastUpdated: lastFetch,
        cached: true,
        note: "SKR is circulating token mcap, not Solana Mobile Inc equity",
      });
    }

    let companies: CompetitorData[];
    try {
      companies = await fetchLiveData();
    } catch {
      companies = getFallbackData();
    }

    cachedData = companies;
    lastFetch = Date.now();

    return NextResponse.json({
      companies,
      lastUpdated: lastFetch,
      cached: false,
      note: "SKR is circulating token mcap, not Solana Mobile Inc equity",
    });
  } catch {
    return NextResponse.json({
      companies: getFallbackData(),
      lastUpdated: Date.now(),
      error: "Using static data",
    });
  }
}
