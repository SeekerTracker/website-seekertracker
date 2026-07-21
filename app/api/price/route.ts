import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

/**
 * POST/GET /api/price
 * Returns SOL + SKR USD prices.
 * Jupiter Price API v2 is retired; use v3 (+ DexScreener fallback).
 */
export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}));

    const { prices, source } = await fetchTokenPrices([SOL_MINT, SKR_MINT]);
    const solPrice = prices[SOL_MINT] ?? 0;
    const skrPrice = prices[SKR_MINT] ?? 0;

    if (solPrice <= 0 && skrPrice <= 0) {
      return NextResponse.json(
        { usdPrice: 0, solPrice: 0, skrPrice: 0, ticker: "SOLUSDC" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      // Back-compat for getBasicData / dataProvider
      usdPrice: solPrice,
      solPrice,
      skrPrice,
      ticker: "SOLUSDC",
      source,
    });
  } catch (e) {
    console.error("POST /api/price", e);
    return NextResponse.json(
      { usdPrice: 0, solPrice: 0, skrPrice: 0 },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(
    new NextRequest("http://local/api/price", { method: "POST", body: "{}" })
  );
}

type PriceMap = { prices: Record<string, number>; source: string };

async function fetchTokenPrices(mints: string[]): Promise<PriceMap> {
  const fromJup = await fetchJupiterV3(mints);
  const missing = mints.filter((m) => !(fromJup[m] > 0));

  if (missing.length === 0) {
    return { prices: fromJup, source: "jupiter-v3" };
  }

  const fromDex: Record<string, number> = {};
  await Promise.all(
    missing.map(async (mint) => {
      const p = await fetchDexScreenerPrice(mint);
      if (p > 0) fromDex[mint] = p;
    })
  );

  const prices = { ...fromJup, ...fromDex };
  const hasJup = mints.some((m) => fromJup[m] > 0);
  const hasDex = mints.some((m) => fromDex[m] > 0);
  const source =
    hasJup && hasDex
      ? "jupiter-v3+dexscreener"
      : hasDex
        ? "dexscreener"
        : "jupiter-v3";
  return { prices, source };
}

async function fetchJupiterV3(mints: string[]): Promise<Record<string, number>> {
  try {
    const url = `https://api.jup.ag/price/v3?ids=${mints.join(",")}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 20 },
    });
    if (!res.ok) {
      console.warn("jupiter price v3 HTTP", res.status);
      return {};
    }
    const data = (await res.json()) as Record<
      string,
      { usdPrice?: number | string; price?: number | string }
    >;
    const out: Record<string, number> = {};
    for (const mint of mints) {
      const row = data?.[mint];
      const n = Number(row?.usdPrice ?? row?.price ?? 0);
      if (Number.isFinite(n) && n > 0) out[mint] = n;
    }
    return out;
  } catch (e) {
    console.warn("jupiter price v3 failed", e);
    return {};
  }
}

async function fetchDexScreenerPrice(mint: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const pairs = (data?.pairs || []) as Array<{
      priceUsd?: string;
      liquidity?: { usd?: number };
    }>;
    if (!pairs.length) return 0;
    pairs.sort(
      (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    );
    const n = Number(pairs[0]?.priceUsd || 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}
