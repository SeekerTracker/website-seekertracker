import { Connection } from "@solana/web3.js";

export const BE_URL = "https://api.seeker.solana.charity";
export const WS_URL = "wss://api.seeker.solana.charity/seeker";

export const SEEKER_TOKEN_ADDRESS = 'ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS'
export const CONN_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=38d87a91-14f5-45fa-b517-09d7c89ace29"
export const solanaWSConnection = new Connection(CONN_RPC_URL, "processed")

export const BEPATH = {
    health: `${BE_URL}/health`,
    domain: `${BE_URL}/domain`,
    priceData: `${BE_URL}/priceData`,
}

// Min Required $TRACKER token for gating CSV download
export const REQUIRED_TRACKER_BALANCE = 100_000;