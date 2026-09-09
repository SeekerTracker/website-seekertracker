import { NextResponse } from "next/server";
import { rpcCall, rpcCandidates } from "../../../(utils)/lib/solanaRpc";
import { getDomainsByOwner } from "../../../(utils)/lib/domainStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MINT = "9ZrGHKCdX2Bf5GWiGb9wSGGdBTMoZQqdEyzChapwE2Cx";

/** Display names we already know (SNS v2 uses .sns, not .sol). */
const KNOWN_NAMES: Record<string, { name: string; tld: string }> = {
  TRKRnnQLFtRrQutViLgqjCXWjk8YeFje88dEw2CoxP3: {
    name: "seekertracker.sns",
    tld: "sns",
  },
  HRWj4gdAds2QtdjzwVejDavbsr1a8tmRT5HoNpF2H7jy: {
    name: "rekees.sns",
    tld: "sns",
  },
};

type Largest = {
  address: string;
  uiAmount?: number;
  amount?: string;
  decimals?: number;
};

type Holder = {
  rank: number;
  wallet: string;
  balance: number;
  pct: number;
  name: string | null;
  tld: string | null;
};

let cache: { at: number; holders: Holder[]; supply: number } | null = null;
const CACHE_MS = 60_000;

async function pickRpc(): Promise<string> {
  const candidates = rpcCandidates();
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

async function jsonGet(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "SeekerTracker/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function pickName(raw: unknown): { name: string; tld: string } | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const m = raw
      .trim()
      .toLowerCase()
      .match(/^([a-z0-9][a-z0-9_-]{0,62})\.(sns|sol|bonk)$/i);
    if (m) {
      const tld = m[2].toLowerCase() === "sol" ? "sns" : m[2].toLowerCase();
      return { name: `${m[1]}.${tld}`, tld };
    }
    if (/^[a-z0-9][a-z0-9_-]{0,62}$/i.test(raw.trim())) {
      return { name: `${raw.trim().toLowerCase()}.sns`, tld: "sns" };
    }
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const cand =
      o.result ??
      o.domain ??
      o.name ??
      o.favorite ??
      (Array.isArray(o.domains) ? o.domains[0] : null) ??
      (Array.isArray(o.names) ? o.names[0] : null);
    return pickName(cand);
  }
  return null;
}

async function resolveSns(wallet: string): Promise<{ name: string; tld: string } | null> {
  const urls = [
    `https://sns-sdk-proxy.bonfida.workers.dev/primary-domain/${wallet}`,
    `https://sns-sdk-proxy.bonfida.workers.dev/domains/${wallet}`,
    `https://sns-sdk-proxy.bonfida.workers.dev/favorite-domain/${wallet}`,
    `https://sns-sdk-proxy.bonfida.workers.dev/reverse-lookup/${wallet}`,
    `https://api.alldomains.id/name-service/owner/${wallet}`,
  ];
  for (const u of urls) {
    const j = await jsonGet(u);
    const n = pickName(j);
    if (n) return n;
  }
  return null;
}

async function resolveId(
  wallet: string,
): Promise<{ name: string; tld: string } | null> {
  if (KNOWN_NAMES[wallet]) return KNOWN_NAMES[wallet];
  try {
    const skr = await getDomainsByOwner(wallet);
    if (skr[0]?.subdomain) {
      const sub = skr[0].subdomain.replace(/\.skr$/i, "");
      return { name: `${sub}.skr`, tld: "skr" };
    }
  } catch {
    /* sns next */
  }
  return resolveSns(wallet);
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
    const largest = await rpcCall<{ value: Largest[] }>(
      rpc,
      "getTokenLargestAccounts",
      [MINT],
    );
    const rows = (largest?.value || []).slice(0, 20);
    const atas = rows.map((r) => r.address);
    const accs = await rpcCall<{
      value: Array<{
        data?: { parsed?: { info?: { owner?: string; tokenAmount?: { uiAmount?: number } } } };
      } | null>;
    }>(rpc, "getMultipleAccounts", [atas, { encoding: "jsonParsed" }]);

    const supplyRaw = rows.reduce((s, r) => s + (r.uiAmount || 0), 0);
    // Full mint supply ~ 1e9; use sum of largest as display pct base? User wants % of supply.
    const mintInfo = await rpcCall<{
      value?: { data?: { parsed?: { info?: { supply?: string; decimals?: number } } } };
    }>(rpc, "getAccountInfo", [MINT, { encoding: "jsonParsed" }]);
    const info = mintInfo?.value?.data?.parsed?.info;
    const decimals = info?.decimals ?? 6;
    const supply = info?.supply ? Number(info.supply) / 10 ** decimals : supplyRaw;

    const holders: Holder[] = [];
    const vals = accs?.value || [];
    for (let i = 0; i < rows.length; i++) {
      const parsed = vals[i]?.data?.parsed?.info;
      const wallet = parsed?.owner;
      if (!wallet) continue;
      const balance = parsed?.tokenAmount?.uiAmount ?? rows[i].uiAmount ?? 0;
      holders.push({
        rank: holders.length + 1,
        wallet,
        balance,
        pct: supply > 0 ? (balance / supply) * 100 : 0,
        name: null,
        tld: null,
      });
    }

    const ids = await Promise.all(holders.map((h) => resolveId(h.wallet)));
    ids.forEach((id, i) => {
      if (!id) return;
      holders[i].name = id.name;
      holders[i].tld = id.tld;
    });

    cache = { at: Date.now(), holders, supply };
    return NextResponse.json({ ok: true, holders, supply, cached: false });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "holders_failed" },
      { status: 502 },
    );
  }
}
