import { NextResponse } from "next/server";
import { CONN_RPC_URL } from "../../../(utils)/constant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REWARD_WALLET =
  process.env.SWEEP_REWARD_WALLET ||
  "rwdkZmr8wDN2b2dNLnaTCkTThUBzRdMJJCqtqgbvMug";

const RPC =
  process.env.HELIUS_RPC_URL ||
  CONN_RPC_URL ||
  "https://cassandra-bq5oqs-fast-mainnet.helius-rpc.com";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const SIG_SCAN = 80; // scan enough sigs to fill winners

type Winner = {
  wallet: string;
  sol: number;
  lamports: number;
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

/**
 * Past sweep winners = outbound SOL transfers from the reward wallet.
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
          fee?: number;
          preBalances?: number[];
          postBalances?: number[];
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

      const keys = (tx.transaction?.message?.accountKeys || [])
        .map(keyStr)
        .filter(Boolean);
      const pre = tx.meta.preBalances || [];
      const post = tx.meta.postBalances || [];
      if (keys.length === 0 || pre.length !== keys.length || post.length !== keys.length) {
        continue;
      }

      const ri = keys.indexOf(REWARD_WALLET);
      if (ri < 0) continue;

      const outflow = pre[ri] - post[ri];
      // skip fee-only / dust
      if (outflow <= 10_000) continue;

      let bestI = -1;
      let bestGain = 0;
      for (let i = 0; i < keys.length; i++) {
        if (i === ri) continue;
        const gain = post[i] - pre[i];
        if (gain > bestGain) {
          bestGain = gain;
          bestI = i;
        }
      }
      if (bestI < 0 || bestGain <= 0) continue;

      winners.push({
        wallet: keys[bestI],
        sol: bestGain / 1e9,
        lamports: bestGain,
        signature: s.signature,
        blockTime: s.blockTime ?? null,
        receiptUrl: `https://sol.new/receipt/${s.signature}`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        rewardWallet: REWARD_WALLET,
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
