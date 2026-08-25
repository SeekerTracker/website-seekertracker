import { NextResponse } from "next/server";
import { HELIUS_FAST_RPC } from "../../../(utils)/lib/solanaRpc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REWARD_WALLET =
  process.env.SWEEP_REWARD_WALLET ||
  "rwdkZmr8wDN2b2dNLnaTCkTThUBzRdMJJCqtqgbvMug";

const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

const RPC =
  process.env.HELIUS_RPC_URL ||
  process.env.SOLANA_RPC_URL ||
  HELIUS_FAST_RPC;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const SIG_SCAN = 80;

type Winner = {
  wallet: string;
  skr: number;
  amount: number;
  symbol: "SKR";
  sol: number; // alias of skr for older clients
  signature: string;
  blockTime: number | null;
  receiptUrl: string;
};

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "RPC error");
  return data.result as T;
}

function keyStr(k: unknown): string {
  if (typeof k === "string") return k;
  if (k && typeof k === "object" && "pubkey" in (k as object)) {
    return String((k as { pubkey: string }).pubkey);
  }
  return "";
}

type TokenBal = {
  mint?: string;
  owner?: string;
  uiTokenAmount?: { uiAmount?: number | null };
};

function skrDeltas(bals: TokenBal[] | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const b of bals || []) {
    if (b.mint !== SKR_MINT) continue;
    const owner = b.owner || "";
    if (!owner) continue;
    const n = b.uiTokenAmount?.uiAmount;
    const amt = typeof n === "number" && Number.isFinite(n) ? n : 0;
    m.set(owner, (m.get(owner) || 0) + amt);
  }
  return m;
}

/**
 * Past sweep winners = outbound SKR transfers from the reward wallet.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(url.searchParams.get("limit") || DEFAULT_LIMIT) || DEFAULT_LIMIT)
    );

    type Sig = { signature: string; blockTime: number | null; err: unknown };
    const sigs = await rpc<Sig[]>("getSignaturesForAddress", [
      REWARD_WALLET,
      { limit: SIG_SCAN },
    ]);

    const winners: Winner[] = [];

    for (const s of sigs) {
      if (winners.length >= limit) break;
      if (s.err) continue;

      type Tx = {
        meta?: {
          err: unknown;
          preTokenBalances?: TokenBal[];
          postTokenBalances?: TokenBal[];
        };
        transaction?: {
          message?: { accountKeys?: unknown[] };
        };
      };

      const tx = await rpc<Tx | null>("getTransaction", [
        s.signature,
        { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
      ]);
      if (!tx?.meta || tx.meta.err) continue;

      const pre = skrDeltas(tx.meta.preTokenBalances);
      const post = skrDeltas(tx.meta.postTokenBalances);
      const owners = new Set([...pre.keys(), ...post.keys()]);
      const rewardOut = (pre.get(REWARD_WALLET) || 0) - (post.get(REWARD_WALLET) || 0);
      if (rewardOut <= 0.000001) continue;

      let bestWallet = "";
      let bestGain = 0;
      for (const owner of owners) {
        if (owner === REWARD_WALLET) continue;
        const gain = (post.get(owner) || 0) - (pre.get(owner) || 0);
        if (gain > bestGain) {
          bestGain = gain;
          bestWallet = owner;
        }
      }
      if (!bestWallet || bestGain <= 0) continue;

      winners.push({
        wallet: bestWallet,
        skr: bestGain,
        amount: bestGain,
        symbol: "SKR",
        sol: bestGain,
        signature: s.signature,
        blockTime: s.blockTime ?? null,
        receiptUrl: `https://sol.new/receipt/${s.signature}`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        rewardWallet: REWARD_WALLET,
        rewardMint: SKR_MINT,
        rewardSymbol: "SKR",
        winners,
        count: winners.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (e) {
    console.error("[sweep/winners]", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Failed to load winners",
      },
      { status: 500 }
    );
  }
}
