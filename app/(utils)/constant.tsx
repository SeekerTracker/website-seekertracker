import { Connection } from "@solana/web3.js";

export const BE_URL = "https://api.seeker.solana.charity";
export const WS_URL = "wss://api.seeker.solana.charity/seeker";

export const SEEKER_TOKEN_ADDRESS = 'ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS'
// NOTE: this endpoint is exposed client-side, so every visitor's browser hits it
// directly — a capped plan drains fast (the previous viviyan-bkj12u endpoint hit
// "max usage reached" and 404'd all /id pages). Consider proxying RPC through a
// server route with the key in an env var to avoid exposure + draining.
export const CONN_RPC_URL = "https://cassandra-bq5oqs-fast-mainnet.helius-rpc.com"
export const solanaWSConnection = new Connection(CONN_RPC_URL, "processed")

export const BEPATH = {
    health: `${BE_URL}/health`,
    domain: `${BE_URL}/domain`,
    allDomains: `${BE_URL}/allDomains`,
    priceData: `${BE_URL}/priceData`,
}

// Min Required $TRACKER token for gating CSV download
export const REQUIRED_TRACKER_BALANCE = 100 * 1000;

// Jupiter Referral Account
export const JUP_REFERRAL = 'Fgs9yynnDLCcUqkn3LswxcCrWGb3E1h4qFzEd5A8FJEE'
