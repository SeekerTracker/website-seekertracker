import { Connection } from "@solana/web3.js";

/**
 * Domain data now lives in Turso and is served by this Next app.
 * Legacy charity API kept only as optional import/sync source (scripts + cron).
 */
export const SITE_ORIGIN =
    process.env.NEXT_PUBLIC_SITE_URL || "https://seekertracker.com";

/** @deprecated Use BEPATH — no longer points at Supabase/charity host for domains */
export const BE_URL = SITE_ORIGIN;

/** WebSocket live feed retired with charity API; UI polls /api/domains instead */
export const WS_URL = "";

export const LEGACY_DOMAIN_API =
    process.env.LEGACY_DOMAIN_API || "https://api.seeker.solana.charity";

export const SEEKER_TOKEN_ADDRESS = 'ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS'
// NOTE: this endpoint is exposed client-side, so every visitor's browser hits it
// directly — a capped plan drains fast (the previous viviyan-bkj12u endpoint hit
// "max usage reached" and 404'd all /id pages). Consider proxying RPC through a
// server route with the key in an env var to avoid exposure + draining.
export const CONN_RPC_URL = "https://cassandra-bq5oqs-fast-mainnet.helius-rpc.com"
export const solanaWSConnection = new Connection(CONN_RPC_URL, "processed")

/** Absolute paths so server components / edge can call own APIs */
export const BEPATH = {
    health: `${SITE_ORIGIN}/api/health`,
    domain: `${SITE_ORIGIN}/api/domain`,
    allDomains: `${SITE_ORIGIN}/api/domains`,
    // SOL price via our proxy (no charity backend)
    priceData: `${SITE_ORIGIN}/api/price`,
}

// Min Required $TRACKER token for gating CSV download
export const REQUIRED_TRACKER_BALANCE = 100 * 1000;

// Jupiter Referral Account
export const JUP_REFERRAL = 'Fgs9yynnDLCcUqkn3LswxcCrWGb3E1h4qFzEd5A8FJEE'
