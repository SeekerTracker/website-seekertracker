import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { SEEKER_TOKEN_ADDRESS } from "../constant";

export async function getTrackerTokenBalance(
    connection: Connection,
    walletPubkey: PublicKey
): Promise<number> {
    try {
        const mintPubkey = new PublicKey(SEEKER_TOKEN_ADDRESS);
        const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
        const account = await getAccount(connection, ata);

        // TRACKER has 6 decimals (standard SPL token)
        const decimals = 6;
        return Number(account.amount) / Math.pow(10, decimals);
    } catch (error) {
        // Account doesn't exist = 0 balance
        if ((error as Error).message?.includes("could not find account")) {
            return 0;
        }
        // TokenAccountNotFoundError also means 0 balance
        if ((error as Error).name === "TokenAccountNotFoundError") {
            return 0;
        }
        throw error;
    }
}
