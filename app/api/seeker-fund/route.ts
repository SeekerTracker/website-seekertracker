import { NextResponse } from "next/server";
import { SEEKER_TOKEN_ADDRESS } from "app/(utils)/constant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight fund stats for the client shell.
 * Never blocks HTML — layout does not await this.
 * Short timeouts + soft failures so the homepage paints fast.
 */
const TIMEOUT_MS = 2500;

async function fetchJson(
  url: string,
  init?: RequestInit
): Promise<unknown | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const bagsKey =
    process.env.BAGS_API_KEY ||
    "bags_prod_YSeO3hc_FZ2g0myg7ppNtBSxR6zetFKg41xlpFwtpP8";

  const [feesRaw, volRaw] = await Promise.all([
    fetchJson(
      `https://public-api-v2.bags.fm/api/v1/token-launch/lifetime-fees?tokenMint=${SEEKER_TOKEN_ADDRESS}`,
      { headers: { "x-api-key": bagsKey } }
    ),
    fetchJson(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent("TRACKER")}`
    ),
  ]);

  let lifeTimeSolFees = 0;
  try {
    const lamports = (feesRaw as { response?: number } | null)?.response ?? 0;
    lifeTimeSolFees = Number(lamports) / 1e9;
    if (!Number.isFinite(lifeTimeSolFees)) lifeTimeSolFees = 0;
  } catch {
    lifeTimeSolFees = 0;
  }

  let token24hVol = 0;
  try {
    const pairs =
      ((volRaw as { pairs?: Array<Record<string, unknown>> })?.pairs as Array<{
        baseToken?: { symbol?: string };
        quoteToken?: { symbol?: string };
        volume?: { h24?: number };
        volume24h?: number;
      }>) || [];
    const pair = pairs.find(
      (p) =>
        (p.baseToken?.symbol || "").toUpperCase() === "TRACKER" ||
        (p.quoteToken?.symbol || "").toUpperCase() === "TRACKER"
    );
    const vol = pair?.volume?.h24 ?? pair?.volume24h;
    if (typeof vol === "number") token24hVol = vol;
  } catch {
    token24hVol = 0;
  }

  // Fund balance via RPC is often capped/slow — omit from critical path (0 is fine).
  const fundBalance = 0;

  return NextResponse.json(
    {
      lifeTimeSolFees: Number(lifeTimeSolFees.toFixed(4)),
      token24hVol,
      fundBalance,
      asOf: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    }
  );
}
