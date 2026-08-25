import { NextResponse } from "next/server";
import { SEEKER_TOKEN_ADDRESS } from "../../../(utils)/constant";
import { HELIUS_FAST_RPC, rpcCall } from "../../../(utils)/lib/solanaRpc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACKER_TOKEN = SEEKER_TOKEN_ADDRESS;
const HELIUS_RPC =
  process.env.HELIUS_RPC_URL ||
  process.env.SOLANA_RPC_URL ||
  HELIUS_FAST_RPC;
const MIN_BALANCE = 1_000_000;
const MAX_COUNTED = 20_000_000;
const TOKEN_DECIMALS = 9;

/** Protocol / LP / treasury wallets that must never enter the sweep pool */
const EXCLUDED_WALLETS = new Set(
  [
    // TRACKER LP (Bags pool)
    "HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC",
  ].map((w) => w.trim())
);

const REWARD_WALLET =
  process.env.SWEEP_REWARD_WALLET ||
  "rwdkZmr8wDN2b2dNLnaTCkTThUBzRdMJJCqtqgbvMug";
/** Must match tracker-sweep-bot — prize is SKR; keep a little SOL for gas */
const WALLET_RESERVE_SOL = 0.01;
const MIN_PRIZE_SKR = 1;
const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

interface TokenAccount {
  address?: string;
  amount: number;
  owner: string;
}

interface Contestant {
  wallet: string;
  balance: number;
  counted: number;
  weight: number;
  eligible: boolean;
  capped: boolean;
}

/**
 * Eligible holders for TRACKER sweep drip.
 * - Min hold 1M TRACKER
 * - Max 20M TRACKER (above 20M not eligible — same as bot)
 * - LP / protocol wallets excluded
 */
export async function GET() {
  try {
    let allAccounts: TokenAccount[] = [];
    let cursor: string | undefined;
    let pages = 0;
    const maxPages = 50;

    do {
      const body: {
        jsonrpc: string;
        id: string;
        method: string;
        params: { mint: string; limit: number; cursor?: string };
      } = {
        jsonrpc: "2.0",
        id: "sweep-contestants",
        method: "getTokenAccounts",
        params: {
          mint: TRACKER_TOKEN,
          limit: 1000,
        },
      };
      if (cursor) body.params.cursor = cursor;

      const response = await fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      if (data.result?.token_accounts) {
        allAccounts = allAccounts.concat(data.result.token_accounts);
      }

      cursor = data.result?.cursor;
      pages += 1;
    } while (cursor && pages < maxPages);

    // Aggregate by owner (multiple ATAs possible)
    const byOwner = new Map<string, number>();
    for (const account of allAccounts) {
      const bal = Number(account.amount) / Math.pow(10, TOKEN_DECIMALS);
      if (!Number.isFinite(bal) || bal <= 0) continue;
      const owner = account.owner;
      if (!owner) continue;
      byOwner.set(owner, (byOwner.get(owner) || 0) + bal);
    }

    const raw: Contestant[] = [];
    for (const [wallet, balance] of byOwner) {
      if (EXCLUDED_WALLETS.has(wallet)) continue;
      // Same band as tracker-sweep-bot: 1M–20M inclusive
      if (balance < MIN_BALANCE || balance > MAX_COUNTED) continue;
      const counted = balance; // already ≤ 20M
      raw.push({
        wallet,
        balance,
        counted,
        weight: 0,
        eligible: true,
        capped: false,
      });
    }

    raw.sort((a, b) => b.counted - a.counted || b.balance - a.balance);

    const totalCounted = raw.reduce((s, c) => s + c.counted, 0);
    const contestants = raw.map((c) => ({
      ...c,
      weight: totalCounted > 0 ? c.counted / totalCounted : 0,
    }));

    // Reward wallet: prize is SKR; SOL is gas only
    let rewardWalletSol: number | null = null;
    let rewardWalletSkr: number | null = null;
    try {
      const bal = await rpcCall<{ value: number }>(
        HELIUS_RPC,
        "getBalance",
        [REWARD_WALLET, { commitment: "confirmed" }],
        "sweep-reward-bal"
      );
      rewardWalletSol = (bal?.value ?? 0) / 1e9;
    } catch {
      rewardWalletSol = null;
    }
    try {
      const atas = await rpcCall<{
        value?: Array<{
          account?: {
            data?: {
              parsed?: {
                info?: { tokenAmount?: { uiAmount?: number | null } };
              };
            };
          };
        }>;
      }>(
        HELIUS_RPC,
        "getTokenAccountsByOwner",
        [
          REWARD_WALLET,
          { mint: SKR_MINT },
          { encoding: "jsonParsed", commitment: "confirmed" },
        ],
        "sweep-reward-skr"
      );
      rewardWalletSkr = (atas?.value || []).reduce((s, a) => {
        const n = a?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
        return s + (typeof n === "number" && Number.isFinite(n) ? n : 0);
      }, 0);
    } catch {
      rewardWalletSkr = null;
    }
    const dripActive =
      rewardWalletSkr == null ? null : rewardWalletSkr >= MIN_PRIZE_SKR - 1e-12;

    return NextResponse.json(
      {
        success: true,
        contestants,
        stats: {
          totalEligible: contestants.length,
          totalBalance: contestants.reduce((s, c) => s + c.balance, 0),
          totalCounted,
          minRequired: MIN_BALANCE,
          maxCounted: MAX_COUNTED,
          holdersScanned: byOwner.size,
          accountsScanned: allAccounts.length,
          rewardWallet: REWARD_WALLET,
          rewardWalletSol,
          rewardWalletSkr,
          rewardMint: SKR_MINT,
          rewardSymbol: "SKR",
          walletReserveSol: WALLET_RESERVE_SOL,
          minPrizeSkr: MIN_PRIZE_SKR,
          dripActive,
          dripStatus:
            dripActive === false
              ? "paused_unfunded"
              : dripActive === true
                ? "active"
                : "unknown",
        },
        lastUpdated: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Sweep contestants API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contestants", details: String(error) },
      { status: 500 }
    );
  }
}
