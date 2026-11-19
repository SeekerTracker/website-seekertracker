/**
 * Live SKR buy-and-burn stats from official on-chain burns.
 *
 * Solana Mobile publishes the program wallet and memo. Every counted burn is
 * an SPL burnChecked of SKR from that wallet with memo "Solana Mobile burn".
 * Numbers are never invented — they come from those transactions + mint supply.
 */
import { rpcCall, rpcCandidates } from "./solanaRpc";

export const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
export const SKR_BUY_AND_BURN_WALLET =
  "AFuZE1beQGWVBHMHUPJf2BSmhj7W5fotjGWeKpi8W3Sf";
/** Official initial / genesis supply from solanamobile.com/skr tokenomics. */
export const SKR_INITIAL_SUPPLY = 10_000_000_000;
export const SKR_DECIMALS = 6;
export const SKR_BURN_MEMO = "Solana Mobile burn";

export const BURN_SOURCES = [
  {
    label: "Solana Mobile blog — program announcement (3 Nov 2026)",
    href: "https://solanamobile.com/blog/skr-buy-and-burns-are-live",
  },
  {
    label: "SKR tokenomics — Buy & Burn dashboard",
    href: "https://solanamobile.com/skr#buyandburn",
  },
  {
    label: "@solanamobile announcement thread",
    href: "https://x.com/solanamobile/status/2117667700986249361",
  },
  {
    label: "Official buy-and-burn wallet (Solscan)",
    href: `https://solscan.io/account/${SKR_BUY_AND_BURN_WALLET}`,
  },
  {
    label: "SKR mint (Solscan)",
    href: `https://solscan.io/token/${SKR_MINT}`,
  },
] as const;

export type SkrBurnTx = {
  signature: string;
  blockTime: number;
  amount: number;
  amountRaw: string;
  memo: string;
};

export type SkrBurnsSnapshot = {
  success: true;
  mint: string;
  buyAndBurnWallet: string;
  decimals: number;
  initialSupply: number;
  currentSupply: number;
  totalBurned: number;
  burnedLast30Days: number;
  percentOfInitialSupply: number;
  burnCount: number;
  firstBurnAt: string | null;
  lastBurnAt: string | null;
  recent: SkrBurnTx[];
  daily: { day: string; amount: number }[];
  fetchedAt: string;
  sources: typeof BURN_SOURCES;
};

type RpcSig = {
  signature: string;
  blockTime?: number | null;
  err?: unknown;
  memo?: string | null;
};

type ParsedIx = {
  program?: string;
  parsed?:
    | string
    | {
        type?: string;
        info?: {
          mint?: string;
          tokenAmount?: { amount?: string; uiAmount?: number | null };
          amount?: string;
          parsed?: string;
        };
        parsed?: string;
      };
};

const CACHE_MS = 5 * 60 * 1000;
let cache: { at: number; data: SkrBurnsSnapshot } | null = null;

async function firstWorkingRpc(): Promise<string> {
  const candidates = rpcCandidates();
  let lastErr: unknown;
  for (const rpc of candidates) {
    try {
      await rpcCall(rpc, "getHealth", [], "burn-health");
      return rpc;
    } catch (e) {
      lastErr = e;
    }
  }
  // Health is optional on some RPCs — fall back to the first candidate.
  if (candidates[0]) return candidates[0];
  throw lastErr instanceof Error ? lastErr : new Error("No Solana RPC");
}

async function rpcBatch<T>(
  rpc: string,
  calls: { method: string; params: unknown[] }[]
): Promise<(T | null)[]> {
  const res = await fetch(rpc, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "SeekerTracker/1.0 (+https://seekertracker.com)",
    },
    body: JSON.stringify(
      calls.map((c, id) => ({
        jsonrpc: "2.0",
        id,
        method: c.method,
        params: c.params,
      }))
    ),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC batch HTTP ${res.status}`);
  const data = (await res.json()) as Array<{
    id: number;
    result?: T;
    error?: unknown;
  }>;
  const out: (T | null)[] = Array(calls.length).fill(null);
  for (const item of data) {
    if (typeof item.id === "number") {
      out[item.id] = item.error ? null : (item.result ?? null);
    }
  }
  return out;
}

function iso(ts: number | null | undefined): string | null {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

function memoFromIx(ix: ParsedIx): string | null {
  if (ix.program !== "spl-memo") return null;
  const p = ix.parsed;
  if (typeof p === "string") return p;
  if (p && typeof p === "object") {
    if (typeof p.parsed === "string") return p.parsed;
    if (typeof p.info?.parsed === "string") return p.info.parsed;
  }
  return null;
}

function burnedSkrFromIx(ix: ParsedIx): number {
  const p = ix.parsed;
  if (!p || typeof p === "string") return 0;
  if (p.type !== "burn" && p.type !== "burnChecked") return 0;
  if (p.info?.mint !== SKR_MINT) return 0;
  const raw = p.info.tokenAmount?.amount ?? p.info.amount;
  if (raw == null) return 0;
  try {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function fetchSkrBurns(force = false): Promise<SkrBurnsSnapshot> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const rpc = await firstWorkingRpc();

  const sigs: RpcSig[] = [];
  let before: string | undefined;
  for (;;) {
    const batch = await rpcCall<RpcSig[]>(
      rpc,
      "getSignaturesForAddress",
      [
        SKR_BUY_AND_BURN_WALLET,
        { limit: 1000, ...(before ? { before } : {}) },
      ],
      `burn-sigs-${sigs.length}`
    );
    if (!batch?.length) break;
    sigs.push(...batch);
    if (batch.length < 1000) break;
    before = batch[batch.length - 1].signature;
  }

  const ok = sigs.filter((s) => !s.err);
  const burns: SkrBurnTx[] = [];

  for (let i = 0; i < ok.length; i += 20) {
    const chunk = ok.slice(i, i + 20);
    const txs = await rpcBatch<{
      blockTime?: number;
      transaction?: { message?: { instructions?: ParsedIx[] } };
    }>(
      rpc,
      chunk.map((s) => ({
        method: "getTransaction",
        params: [
          s.signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
        ],
      }))
    );

    for (let j = 0; j < chunk.length; j++) {
      const tx = txs[j];
      if (!tx) continue;
      const ixs = tx.transaction?.message?.instructions || [];
      let memo = "";
      let raw = 0;
      for (const ix of ixs) {
        const m = memoFromIx(ix);
        if (m) memo = m;
        raw += burnedSkrFromIx(ix);
      }
      if (raw <= 0) continue;
      if (memo !== SKR_BURN_MEMO) continue;
      const ui = raw / 10 ** SKR_DECIMALS;
      burns.push({
        signature: chunk[j].signature,
        blockTime: tx.blockTime || chunk[j].blockTime || 0,
        amount: ui,
        amountRaw: String(Math.trunc(raw)),
        memo,
      });
    }
  }

  burns.sort((a, b) => b.blockTime - a.blockTime);

  let currentSupply = 0;
  try {
    const supply = await rpcCall<{
      value?: { uiAmount?: number | null; uiAmountString?: string };
    }>(rpc, "getTokenSupply", [SKR_MINT], "skr-supply");
    const v = supply?.value;
    if (typeof v?.uiAmount === "number" && Number.isFinite(v.uiAmount)) {
      currentSupply = v.uiAmount;
    } else if (v?.uiAmountString) {
      currentSupply = Number(v.uiAmountString);
    }
  } catch (e) {
    console.error("SKR getTokenSupply failed", e);
  }

  const totalBurned = burns.reduce((s, b) => s + b.amount, 0);
  const latest = burns[0]?.blockTime || Math.floor(Date.now() / 1000);
  const cut = latest - 30 * 86400;
  const burnedLast30Days = burns
    .filter((b) => b.blockTime >= cut)
    .reduce((s, b) => s + b.amount, 0);

  const byDay = new Map<string, number>();
  for (const b of burns) {
    if (!b.blockTime) continue;
    const day = new Date(b.blockTime * 1000).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + b.amount);
  }
  const days = [...byDay.keys()].sort();
  const daily: { day: string; amount: number }[] = [];
  if (days.length) {
    const start = new Date(`${days[0]}T00:00:00.000Z`);
    const end = new Date(`${days[days.length - 1]}T00:00:00.000Z`);
    for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
      const day = new Date(t).toISOString().slice(0, 10);
      daily.push({ day, amount: byDay.get(day) || 0 });
    }
  }

  const snapshot: SkrBurnsSnapshot = {
    success: true,
    mint: SKR_MINT,
    buyAndBurnWallet: SKR_BUY_AND_BURN_WALLET,
    decimals: SKR_DECIMALS,
    initialSupply: SKR_INITIAL_SUPPLY,
    currentSupply,
    totalBurned,
    burnedLast30Days,
    percentOfInitialSupply:
      SKR_INITIAL_SUPPLY > 0 ? (totalBurned / SKR_INITIAL_SUPPLY) * 100 : 0,
    burnCount: burns.length,
    firstBurnAt: iso(burns.length ? burns[burns.length - 1].blockTime : null),
    lastBurnAt: iso(burns[0]?.blockTime),
    recent: burns.slice(0, 14),
    daily,
    fetchedAt: new Date().toISOString(),
    sources: BURN_SOURCES,
  };

  cache = { at: Date.now(), data: snapshot };
  return snapshot;
}
