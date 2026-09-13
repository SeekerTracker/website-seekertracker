import { NextResponse } from "next/server";
import { rpcCall, rpcCandidates } from "../../../(utils)/lib/solanaRpc";
import { getTurso, hasTurso } from "../../../(utils)/lib/turso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MINT = "9ZrGHKCdX2Bf5GWiGb9wSGGdBTMoZQqdEyzChapwE2Cx";
const TOP_N = 100;

/** Display names we already know (SNS v2 uses .sns). */
const KNOWN_NAMES: Record<string, { name: string; tld: string }> = {
  TRKRnnQLFtRrQutViLgqjCXWjk8YeFje88dEw2CoxP3: {
    name: "seekertracker.sns",
    tld: "sns",
  },
  HRWj4gdAds2QtdjzwVejDavbsr1a8tmRT5HoNpF2H7jy: {
    name: "rekees.sns",
    tld: "sns",
  },
  GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL: {
    name: "Raydium CPMM",
    tld: "lp",
  },
};

const KNOWN_FOMO: Record<string, string> = {
  "1eMe7KodeNghErV9AbHSq7j2gzvSTPP2kgFp3C5r4eb": "ADPtheGreat",
};

type TokenAccount = { address?: string; amount?: number | string; owner?: string };

type Holder = {
  rank: number;
  wallet: string;
  balance: number;
  pct: number;
  name: string | null;
  tld: string | null;
  skr: string | null;
  sns: string | null;
  fomo: string | null;
};

let cache: { at: number; holders: Holder[]; supply: number } | null = null;
const CACHE_MS = 120_000;

async function pickRpc(): Promise<string> {
  const candidates = rpcCandidates();
  for (const rpc of candidates) {
    try {
      await rpcCall(rpc, "getTokenAccounts", { mint: MINT, limit: 1 });
      return rpc;
    } catch {
      /* next */
    }
  }
  for (const rpc of candidates) {
    try {
      await rpcCall(rpc, "getHealth", []);
      return rpc;
    } catch {
      /* next */
    }
  }
  throw new Error("No working RPC");
}

async function fetchTokenAccounts(rpc: string): Promise<TokenAccount[]> {
  const all: TokenAccount[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const params: { mint: string; limit: number; cursor?: string } = {
      mint: MINT,
      limit: 1000,
    };
    if (cursor) params.cursor = cursor;
    const result = await rpcCall<{
      token_accounts?: TokenAccount[];
      cursor?: string;
    }>(rpc, "getTokenAccounts", params, `rks-${page}`);
    const batch = result?.token_accounts || [];
    all.push(...batch);
    cursor = result?.cursor;
    if (!cursor || batch.length === 0) break;
  }
  return all;
}

async function batchSkr(wallets: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!wallets.length || !hasTurso()) return out;
  const db = getTurso();
  const chunk = 80;
  for (let i = 0; i < wallets.length; i += chunk) {
    const slice = wallets.slice(i, i + chunk);
    const ph = slice.map(() => "?").join(",");
    try {
      const res = await db.execute({
        sql: `SELECT owner, subdomain FROM seeker_domains
              WHERE owner IN (${ph})
              ORDER BY LENGTH(subdomain) ASC`,
        args: slice,
      });
      for (const r of res.rows) {
        const owner = String((r as Record<string, unknown>).owner);
        const sub = String((r as Record<string, unknown>).subdomain || "")
          .replace(/\.skr$/i, "");
        if (owner && sub && !out.has(owner)) out.set(owner, `${sub}.skr`);
      }
    } catch {
      /* skip chunk */
    }
  }
  return out;
}

function pickFomoHandle(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const s = raw.trim().replace(/^@/, "");
    if (/^[a-zA-Z0-9_]{2,32}$/.test(s)) return s;
    return null;
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return (
      pickFomoHandle(o.handle) ||
      pickFomoHandle(o.username) ||
      pickFomoHandle(o.fomo) ||
      pickFomoHandle(o.result)
    );
  }
  return null;
}

async function batchFomo(wallets: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  try {
    const res = await fetch("https://api.fomotags.xyz/v1/resolve", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "SeekerTracker/1.0",
      },
      body: JSON.stringify({ addresses: wallets }),
      cache: "no-store",
    });
    if (!res.ok) return out;
    const j = (await res.json()) as unknown;
    const rows = Array.isArray(j)
      ? j
      : Array.isArray((j as { results?: unknown[] })?.results)
        ? (j as { results: unknown[] }).results
        : Array.isArray((j as { data?: unknown[] })?.data)
          ? (j as { data: unknown[] }).data
          : [];
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const addr = String(o.address || o.wallet || o.solana || "");
      const handle = pickFomoHandle(o);
      if (addr && handle) out.set(addr, handle);
    }
  } catch {
    /* FOMO index optional */
  }
  return out;
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json({
      ok: true,
      holders: cache.holders,
      supply: cache.supply,
      cached: true,
    });
  }
  try {
    const rpc = await pickRpc();
    const accounts = await fetchTokenAccounts(rpc);
    const byOwner = new Map<string, number>();
    for (const a of accounts) {
      const owner = a.owner;
      if (!owner) continue;
      const raw = Number(a.amount || 0);
      if (!Number.isFinite(raw) || raw <= 0) continue;
      byOwner.set(owner, (byOwner.get(owner) || 0) + raw);
    }

    const mintInfo = await rpcCall<{
      value?: { data?: { parsed?: { info?: { supply?: string; decimals?: number } } } };
    }>(rpc, "getAccountInfo", [MINT, { encoding: "jsonParsed" }]);
    const info = mintInfo?.value?.data?.parsed?.info;
    const decimals = info?.decimals ?? 6;
    const supply = info?.supply ? Number(info.supply) / 10 ** decimals : 0;
    const div = 10 ** decimals;

    const ranked = [...byOwner.entries()]
      .map(([wallet, raw]) => ({ wallet, balance: raw / div }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, TOP_N);

    const wallets = ranked.map((r) => r.wallet);
    const [skrMap, fomoMap] = await Promise.all([
      batchSkr(wallets),
      batchFomo(wallets),
    ]);

    const holders: Holder[] = ranked.map((r, i) => {
      const known = KNOWN_NAMES[r.wallet];
      const skr = skrMap.get(r.wallet) || null;
      const sns =
        known && known.tld === "sns"
          ? known.name
          : known && known.tld !== "lp" && known.tld !== "skr"
            ? known.name
            : null;
      const fomo = KNOWN_FOMO[r.wallet] || fomoMap.get(r.wallet) || null;
      const lp = known && known.tld === "lp" ? known : null;
      const name = lp?.name || skr || sns || (fomo ? `@${fomo}` : null);
      const tld = lp?.tld || (skr ? "skr" : sns ? "sns" : fomo ? "fomo" : null);
      return {
        rank: i + 1,
        wallet: r.wallet,
        balance: r.balance,
        pct: supply > 0 ? (r.balance / supply) * 100 : 0,
        name,
        tld,
        skr,
        sns,
        fomo,
      };
    });

    cache = { at: Date.now(), holders, supply };
    return NextResponse.json({
      ok: true,
      holders,
      supply,
      scanned: byOwner.size,
      cached: false,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "holders_failed" },
      { status: 502 },
    );
  }
}
