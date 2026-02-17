import { Connection } from "@solana/web3.js";

export const BE_URL = "https://api.seeker.solana.charity";
export const WS_URL = "wss://api.seeker.solana.charity/seeker";

export const SEEKER_TOKEN_ADDRESS = 'ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS'
export const CONN_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=38d87a91-14f5-45fa-b517-09d7c89ace29"
export const solanaWSConnection = new Connection(CONN_RPC_URL, "processed")

export const BEPATH = {
    health: `${BE_URL}/health`,
    domain: `${BE_URL}/domain`,
    allDomains: `${BE_URL}/allDomains`,
    priceData: `${BE_URL}/priceData`,
}

// Min Required $TRACKER token for gating CSV download
// Configurable via NEXT_PUBLIC_REQUIRED_TRACKER env var (default: 100,000)
export const REQUIRED_TRACKER_BALANCE = Number(process.env.NEXT_PUBLIC_REQUIRED_TRACKER ?? 100_000);

// Jupiter Referral Account
export const JUP_REFERRAL = 'Fgs9yynnDLCcUqkn3LswxcCrWGb3E1h4qFzEd5A8FJEE'
