/**
 * Server-side Solana RPC helpers for Seeker Tracker.
 *
 * Primary: Helius dedicated (viviyan) — full indexes, getTokenAccountsByOwner + GPA.
 * Fallback: rpc.aex402.com (needs User-Agent; ATA getAccountInfo preferred).
 * Shared HELIUS_API_KEY mainnet URL is often 403 — deprioritized.
 */
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { CONN_RPC_URL } from "../constant";

/** Best available dedicated Helius endpoint (full indexes, fast). */
export const HELIUS_FAST_RPC =
  "https://viviyan-bkj12u-fast-mainnet.helius-rpc.com";

export const AEX402_RPC = "https://rpc.aex402.com/";

const RPC_UA = "SeekerTracker/1.0 (+https://seekertracker.com)";

export function rpcCandidates(): string[] {
  const list: string[] = [];
  // Explicit env first (ops override)
  if (process.env.SOLANA_RPC_URL) list.push(process.env.SOLANA_RPC_URL);
  if (process.env.HELIUS_RPC_URL) list.push(process.env.HELIUS_RPC_URL);
  // Dedicated Helius — proven working for balances + staked GPA
  list.push(HELIUS_FAST_RPC);
  // aex402 — fine for ATA reads; slower GPA
  list.push(AEX402_RPC);
  // Shared Helius API key (may 403 if plan/key dead)
  if (process.env.HELIUS_API_KEY) {
    list.push(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    );
  }
  if (CONN_RPC_URL) list.push(CONN_RPC_URL);
  list.push(
    "https://solana-rpc.publicnode.com",
    "https://api.mainnet-beta.solana.com"
  );
  return Array.from(new Set(list.filter(Boolean)));
}

export async function rpcCall<T>(
  rpc: string,
  method: string,
  params: unknown,
  id: string | number = 1
): Promise<T> {
  const res = await fetch(rpc, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": RPC_UA,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const data = (await res.json()) as {
    error?: { message?: string; code?: number };
    result?: T;
  };
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return data.result as T;
}

function ataFor(wallet: string, mint: string): string | null {
  try {
    return getAssociatedTokenAddressSync(
      new PublicKey(mint),
      new PublicKey(wallet),
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ).toBase58();
  } catch {
    return null;
  }
}

function uiAmountFromAccountInfo(value: unknown): number | null {
  if (value == null) return 0; // no ATA = 0 balance (known)
  const v = value as {
    data?: {
      parsed?: {
        info?: { tokenAmount?: { uiAmount?: number | null; amount?: string; decimals?: number } };
      };
    };
  };
  const ta = v?.data?.parsed?.info?.tokenAmount;
  if (!ta) return null;
  if (typeof ta.uiAmount === "number" && Number.isFinite(ta.uiAmount)) {
    return ta.uiAmount;
  }
  if (ta.amount != null && ta.decimals != null) {
    const raw = Number(ta.amount);
    if (Number.isFinite(raw)) return raw / Math.pow(10, Number(ta.decimals));
  }
  return null;
}

/** Single-wallet mint balance via ATA getAccountInfo (aex402-safe). */
export async function fetchMintBalanceAta(
  rpc: string,
  wallet: string,
  mint: string
): Promise<number | null> {
  const ata = ataFor(wallet, mint);
  if (!ata) return null;
  try {
    const result = await rpcCall<{ value: unknown }>(
      rpc,
      "getAccountInfo",
      [ata, { encoding: "jsonParsed", commitment: "confirmed" }],
      `ata-${wallet.slice(0, 6)}`
    );
    return uiAmountFromAccountInfo(result?.value);
  } catch {
    return null;
  }
}

/**
 * Batch mint balances. null = RPC/parse failure (unknown).
 * 0 = confirmed empty (no ATA or zero amount).
 */
export async function fetchMintBalancesAta(
  wallets: string[],
  mint: string
): Promise<{ balances: Record<string, number | null>; rpc: string | null }> {
  const unique = Array.from(new Set(wallets.filter(Boolean)));
  const balances: Record<string, number | null> = Object.fromEntries(
    unique.map((w) => [w, null])
  );
  if (unique.length === 0) return { balances, rpc: null };

  const candidates = rpcCandidates();
  let rpc: string | null = null;

  // Probe first wallet on each RPC
  for (const candidate of candidates) {
    const probe = await fetchMintBalanceAta(candidate, unique[0], mint);
    if (probe !== null) {
      rpc = candidate;
      balances[unique[0]] = probe;
      break;
    }
  }
  if (!rpc) {
    console.error("fetchMintBalancesAta: all RPCs failed for mint", mint);
    return { balances, rpc: null };
  }

  const rest = unique.slice(1);
  // getMultipleAccounts in chunks of 100
  const CHUNK = 100;
  for (let i = 0; i < rest.length; i += CHUNK) {
    const chunk = rest.slice(i, i + CHUNK);
    const atas = chunk.map((w) => ataFor(w, mint));
    const validIdx: number[] = [];
    const keys: string[] = [];
    chunk.forEach((w, j) => {
      if (atas[j]) {
        validIdx.push(j);
        keys.push(atas[j]!);
      } else {
        balances[w] = null;
      }
    });
    if (!keys.length) continue;

    try {
      const result = await rpcCall<{ value: Array<unknown | null> }>(
        rpc,
        "getMultipleAccounts",
        [keys, { encoding: "jsonParsed", commitment: "confirmed" }],
        `macc-${i}`
      );
      const values = result?.value || [];
      validIdx.forEach((wj, ki) => {
        const w = chunk[wj];
        const ui = uiAmountFromAccountInfo(values[ki] ?? null);
        // getMultipleAccounts null value = no account = 0
        balances[w] = ui;
      });
    } catch (e) {
      console.warn("getMultipleAccounts failed, falling back one-by-one", e);
      const CONCURRENCY = 8;
      for (let j = 0; j < chunk.length; j += CONCURRENCY) {
        const sub = chunk.slice(j, j + CONCURRENCY);
        const results = await Promise.all(
          sub.map((w) => fetchMintBalanceAta(rpc!, w, mint))
        );
        sub.forEach((w, k) => {
          balances[w] = results[k];
        });
      }
    }
  }

  return { balances, rpc };
}

export function rpcLabel(rpc: string | null): string {
  if (!rpc) return "none";
  if (rpc.includes("viviyan") || rpc.includes("bkj12u")) return "helius-fast";
  if (rpc.includes("aex402")) return "aex402";
  if (rpc.includes("helius") || rpc.includes("api-key")) return "helius";
  if (rpc.includes("publicnode")) return "publicnode";
  if (rpc.includes("mainnet-beta")) return "solana-public";
  return rpc.replace(/^https?:\/\//, "").slice(0, 40);
}

/** Official SKR stake program (Seeker) */
export const SKR_STAKING_PROGRAM = "SKRskrmtL83pcL4YqLWt6iPefDqwXQWHSw9S9vz94BZ";
/** Stake account data layout (confirmed on-chain) */
const SKR_STAKE_DATA_SIZE = 169;
const SKR_STAKE_OWNER_OFFSET = 41;
const SKR_STAKE_AMOUNT_OFFSET = 105;
const SKR_STAKE_DECIMALS = 9;

/** RPCs that support getProgramAccounts for the stake program */
function gpaRpcCandidates(): string[] {
  const list: string[] = [];
  if (process.env.SOLANA_RPC_URL) list.push(process.env.SOLANA_RPC_URL);
  if (process.env.HELIUS_RPC_URL) list.push(process.env.HELIUS_RPC_URL);
  // viviyan first — full indexes + fast GPA
  list.push(HELIUS_FAST_RPC);
  if (process.env.HELIUS_API_KEY) {
    list.push(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    );
  }
  list.push(AEX402_RPC, "https://api.mainnet-beta.solana.com");
  return Array.from(new Set(list.filter(Boolean)));
}

/**
 * Staked SKR per wallet via stake program accounts (owner @ offset 41).
 * null = lookup failed; 0 = no stake accounts.
 */
export async function fetchSkrStakedBalances(
  wallets: string[]
): Promise<{ balances: Record<string, number | null>; rpc: string | null }> {
  const unique = Array.from(new Set(wallets.filter(Boolean)));
  const balances: Record<string, number | null> = Object.fromEntries(
    unique.map((w) => [w, null])
  );
  if (unique.length === 0) return { balances, rpc: null };

  const candidates = gpaRpcCandidates();
  let rpc: string | null = null;

  // Probe first wallet
  for (const candidate of candidates) {
    const probe = await fetchSkrStakedOne(candidate, unique[0]);
    if (probe !== null) {
      rpc = candidate;
      balances[unique[0]] = probe;
      break;
    }
  }
  if (!rpc) {
    console.error("fetchSkrStakedBalances: all GPA RPCs failed");
    return { balances, rpc: null };
  }

  const rest = unique.slice(1);
  const CONCURRENCY = 6;
  for (let i = 0; i < rest.length; i += CONCURRENCY) {
    const chunk = rest.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map((w) => fetchSkrStakedOne(rpc!, w))
    );
    chunk.forEach((w, j) => {
      balances[w] = results[j];
    });
  }
  return { balances, rpc };
}

async function fetchSkrStakedOne(
  rpc: string,
  wallet: string
): Promise<number | null> {
  try {
    const result = await rpcCall<
      Array<{
        account?: { data?: [string, string] | string };
      }>
    >(
      rpc,
      "getProgramAccounts",
      [
        SKR_STAKING_PROGRAM,
        {
          encoding: "base64",
          filters: [
            { dataSize: SKR_STAKE_DATA_SIZE },
            {
              memcmp: {
                offset: SKR_STAKE_OWNER_OFFSET,
                bytes: wallet,
              },
            },
          ],
        },
      ],
      `skr-stake-${wallet.slice(0, 8)}`
    );

    const accounts = Array.isArray(result) ? result : [];
    if (accounts.length === 0) return 0;

    let totalRaw = 0;
    for (const acc of accounts) {
      const dataField = acc.account?.data;
      const b64 = Array.isArray(dataField) ? dataField[0] : dataField;
      if (!b64 || typeof b64 !== "string") continue;
      const raw = Buffer.from(b64, "base64");
      if (raw.length < SKR_STAKE_AMOUNT_OFFSET + 8) continue;
      const amount = raw.readBigUInt64LE(SKR_STAKE_AMOUNT_OFFSET);
      totalRaw += Number(amount);
    }
    return totalRaw / Math.pow(10, SKR_STAKE_DECIMALS);
  } catch (e) {
    console.warn("fetchSkrStakedOne failed", wallet.slice(0, 8), e);
    return null;
  }
}
