import { NextRequest, NextResponse } from "next/server";
import { SEEKER_TOKEN_ADDRESS } from "../../../(utils)/constant";
import { rpcCandidates } from "../../../(utils)/lib/solanaRpc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * TRACKER holder leaderboard for /whales
 * - Balance via getTokenAccounts (paginated)
 * - Hold duration via oldest signature on each owner's TRACKER ATA(s)
 *   (enriched for top N by balance to stay within Worker limits)
 */

const TRACKER_MINT = SEEKER_TOKEN_ADDRESS;
const TOKEN_DECIMALS = 9;

type TokenAccount = {
  address?: string;
  amount?: number | string;
  owner?: string;
};

type HolderRow = {
  rank: number;
  wallet: string;
  balance: number;
  /** Primary ATA used for hold-time probe */
  ata: string | null;
  /** Unix seconds of first TRACKER activity (ATA), if resolved */
  heldSince: number | null;
  heldDays: number | null;
};

// Module cache (warm isolate)
let cache: {
  at: number;
  holders: HolderRow[];
  totalSupplyHeld: number;
  accountsScanned: number;
  rpc: string;
} | null = null;

const CACHE_MS = 5 * 60 * 1000;

async function rpcCall<T>(
  rpc: string,
  method: string,
  params: unknown,
  id = "1"
): Promise<T> {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.result as T;
}

async function pickRpc(): Promise<string> {
  const candidates = rpcCandidates();
  for (const rpc of candidates) {
    try {
      // Prefer Helius-style getTokenAccounts
      await rpcCall(rpc, "getTokenAccounts", {
        mint: TRACKER_MINT,
        limit: 1,
      });
      return rpc;
    } catch {
      /* try next */
    }
  }
  // Fallback: any that answers getHealth
  for (const rpc of candidates) {
    try {
      await rpcCall(rpc, "getHealth", []);
      return rpc;
    } catch {
      /* */
    }
  }
  throw new Error("No working RPC");
}

async function fetchAllTokenAccounts(rpc: string): Promise<TokenAccount[]> {
  const all: TokenAccount[] = [];
  let cursor: string | undefined;
  let pages = 0;
  const maxPages = 80; // up to 80k ATAs

  do {
    const params: { mint: string; limit: number; cursor?: string } = {
      mint: TRACKER_MINT,
      limit: 1000,
    };
    if (cursor) params.cursor = cursor;

    const result = await rpcCall<{
      token_accounts?: TokenAccount[];
      cursor?: string;
    }>(rpc, "getTokenAccounts", params, `ta-${pages}`);

    const batch = result?.token_accounts || [];
    all.push(...batch);
    cursor = result?.cursor;
    pages += 1;
    if (batch.length === 0) break;
  } while (cursor && pages < maxPages);

  return all;
}

/** Oldest signature blockTime for an ATA (seconds). Caps pagination. */
async function oldestAtaActivity(
  rpc: string,
  ata: string
): Promise<number | null> {
  try {
    type Sig = { signature: string; blockTime: number | null };
    let before: string | undefined;
    let oldest: number | null = null;
    let pages = 0;
    const maxPages = 8; // 8 * 1000 sigs max

    while (pages < maxPages) {
      const opts: {
        limit: number;
        before?: string;
        commitment?: string;
      } = { limit: 1000, commitment: "confirmed" };
      if (before) opts.before = before;

      const sigs = await rpcCall<Sig[]>(
        rpc,
        "getSignaturesForAddress",
        [ata, opts],
        `sig-${ata.slice(0, 6)}-${pages}`
      );

      if (!sigs?.length) break;

      const last = sigs[sigs.length - 1];
      if (last.blockTime != null) {
        oldest =
          oldest == null
            ? last.blockTime
            : Math.min(oldest, last.blockTime);
      }
      // Also check min across page
      for (const s of sigs) {
        if (s.blockTime != null) {
          oldest =
            oldest == null ? s.blockTime : Math.min(oldest, s.blockTime);
        }
      }

      if (sigs.length < 1000) break;
      before = last.signature;
      pages += 1;
    }
    return oldest;
  } catch (e) {
    console.warn("oldestAtaActivity failed", ata.slice(0, 8), e);
    return null;
  }
}

async function enrichHoldTimes(
  rpc: string,
  holders: HolderRow[],
  limit: number
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const slice = holders.slice(0, limit);
  const CONCURRENCY = 5;

  for (let i = 0; i < slice.length; i += CONCURRENCY) {
    const chunk = slice.slice(i, i + CONCURRENCY);
    const times = await Promise.all(
      chunk.map((h) =>
        h.ata ? oldestAtaActivity(rpc, h.ata) : Promise.resolve(null)
      )
    );
    chunk.forEach((h, j) => {
      const t = times[j];
      h.heldSince = t;
      h.heldDays =
        t != null && t > 0 ? Math.max(0, Math.floor((now - t) / 86400)) : null;
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page") || 1));
    const pageSize = Math.min(200, Math.max(10, Number(sp.get("pageSize") || 50)));
    const minBal = Math.max(0, Number(sp.get("min") || 0));
    const enrich = Math.min(
      150,
      Math.max(0, Number(sp.get("enrich") || 75))
    );
    const force = sp.get("refresh") === "1";

    const now = Date.now();
    if (!force && cache && now - cache.at < CACHE_MS) {
      const filtered = cache.holders.filter((h) => h.balance >= minBal);
      const start = (page - 1) * pageSize;
      const slice = filtered.slice(start, start + pageSize);
      return NextResponse.json(
        {
          success: true,
          mint: TRACKER_MINT,
          page,
          pageSize,
          total: filtered.length,
          totalSupplyHeld: cache.totalSupplyHeld,
          accountsScanned: cache.accountsScanned,
          holders: slice,
          cached: true,
          cachedAt: cache.at,
          rpc: cache.rpc.includes("api-key") ? "helius" : cache.rpc.slice(0, 40),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    const rpc = await pickRpc();
    const accounts = await fetchAllTokenAccounts(rpc);

    // Aggregate by owner; keep largest ATA for hold probe
    type Agg = { balance: number; ata: string | null; ataAmount: number };
    const byOwner = new Map<string, Agg>();

    for (const acc of accounts) {
      const owner = acc.owner;
      if (!owner) continue;
      const raw = Number(acc.amount);
      if (!Number.isFinite(raw) || raw <= 0) continue;
      const bal = raw / Math.pow(10, TOKEN_DECIMALS);
      const ata = acc.address || null;
      const prev = byOwner.get(owner);
      if (!prev) {
        byOwner.set(owner, { balance: bal, ata, ataAmount: bal });
      } else {
        prev.balance += bal;
        if (ata && bal >= prev.ataAmount) {
          prev.ata = ata;
          prev.ataAmount = bal;
        }
      }
    }

    let holders: HolderRow[] = Array.from(byOwner.entries()).map(
      ([wallet, v]) => ({
        rank: 0,
        wallet,
        balance: v.balance,
        ata: v.ata,
        heldSince: null,
        heldDays: null,
      })
    );

    holders.sort((a, b) => b.balance - a.balance);
    holders = holders.map((h, i) => ({ ...h, rank: i + 1 }));

    const totalSupplyHeld = holders.reduce((s, h) => s + h.balance, 0);

    // Hold duration for top holders
    if (enrich > 0) {
      await enrichHoldTimes(rpc, holders, enrich);
    }

    cache = {
      at: Date.now(),
      holders,
      totalSupplyHeld,
      accountsScanned: accounts.length,
      rpc,
    };

    const filtered = holders.filter((h) => h.balance >= minBal);
    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    return NextResponse.json(
      {
        success: true,
        mint: TRACKER_MINT,
        page,
        pageSize,
        total: filtered.length,
        totalSupplyHeld,
        accountsScanned: accounts.length,
        holders: slice,
        cached: false,
        cachedAt: cache.at,
        rpc: rpc.includes("api-key") ? "helius" : rpc.slice(0, 48),
        enriched: enrich,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("TRACKER holders API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch TRACKER holders",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
