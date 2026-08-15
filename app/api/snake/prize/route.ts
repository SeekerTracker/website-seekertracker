import { NextResponse } from "next/server";
import {
  fetchMintBalanceAta,
  rpcCandidates,
  rpcCall,
  rpcLabel,
} from "../../../(utils)/lib/solanaRpc";

const PRIZE_WALLET = "snkTEcbUVW5EURccMjBo1YDfW8M8uDZ4b8Li9yeNXsq";
/** Win / airdrop mint (Seeker SKR) */
const SKR_TOKEN = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
/** Hold gate mint — returned only for eligibility UI, not the prize pool */
const TRACKER_TOKEN = "ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS";
const AIRDROP_API = "https://snake-airdrop-api.gm-4e8.workers.dev";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Prefer live airdrop worker (already SKR)
    try {
      const apiRes = await fetch(AIRDROP_API + "/", { cache: "no-store" });
      if (apiRes.ok) {
        const api = await apiRes.json();
        if (typeof api.rewardPool === "number") {
          return NextResponse.json({
            skrBalance: api.rewardPool,
            trackerBalance: api.rewardPool, // legacy field — same SKR value for old clients
            rewardMint: SKR_TOKEN,
            rewardSymbol: "SKR",
            solBalance: 0,
            wallet: PRIZE_WALLET,
            source: "airdrop-api",
          });
        }
      }
    } catch {
      /* fall through to RPC */
    }

    let skrBalance: number | null = null;
    let usedRpc: string | null = null;
    for (const rpc of rpcCandidates()) {
      const bal = await fetchMintBalanceAta(rpc, PRIZE_WALLET, SKR_TOKEN);
      if (bal !== null) {
        skrBalance = bal;
        usedRpc = rpc;
        break;
      }
    }

    let solBalance = 0;
    if (usedRpc) {
      try {
        const lamports = await rpcCall<number>(usedRpc, "getBalance", [
          PRIZE_WALLET,
        ]);
        solBalance = (lamports || 0) / 1e9;
      } catch {
        /* soft */
      }
    }

    return NextResponse.json({
      skrBalance: skrBalance ?? 0,
      trackerBalance: skrBalance ?? 0, // legacy alias — now SKR
      rewardMint: SKR_TOKEN,
      rewardSymbol: "SKR",
      holdMint: TRACKER_TOKEN,
      solBalance,
      wallet: PRIZE_WALLET,
      rpc: rpcLabel(usedRpc),
      balancesOk: skrBalance !== null,
    });
  } catch (error) {
    console.error("Snake prize API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prize pool" },
      { status: 500 }
    );
  }
}
