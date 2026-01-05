import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
} from "@solana/web3.js";
import type { TransactionSigner } from "@solana/connector";
import bs58 from "bs58";
import { CONN_RPC_URL } from "../constant";

export type SigningResult = {
    signedTransaction: string; // base58 encoded signed transaction
    message: string; // the verification message (for display/logging)
};

/**
 * Creates and signs a verification transaction for wallet ownership proof.
 * Works with all wallets including Ledger hardware wallets.
 * The transaction is NOT broadcast - it's only used to prove ownership.
 */
export async function signVerificationTransaction(
    signer: TransactionSigner,
    walletAddress: string,
    purpose: string = "Verification Request"
): Promise<SigningResult> {
    const timestamp = Date.now();
    const message = `${purpose}\nTimestamp: ${timestamp}\nWallet: ${walletAddress}`;

    const connection = new Connection(CONN_RPC_URL);
    const publicKey = new PublicKey(walletAddress);

    // Create a simple verification transaction (0 SOL transfer to self)
    const transaction = new Transaction();

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = publicKey;

    // Add a 0 SOL transfer to self - minimal instruction just for signing
    transaction.add(
        SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: publicKey,
            lamports: 0,
        })
    );

    // Sign the transaction using the signer
    let signedTransaction: Transaction;
    try {
        signedTransaction = await signer.signTransaction(transaction) as Transaction;
    } catch (error) {
        const errorMsg = (error as Error).message?.toLowerCase() || "";
        if (errorMsg.includes("user rejected") || errorMsg.includes("cancelled") || errorMsg.includes("denied")) {
            throw new Error("Transaction signing cancelled by user");
        }
        throw error;
    }

    // Return the signed transaction as base58
    const signedTxBase58 = bs58.encode(signedTransaction.serialize());

    return {
        signedTransaction: signedTxBase58,
        message,
    };
}
