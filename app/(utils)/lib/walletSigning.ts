import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
} from "@solana/web3.js";
import bs58 from "bs58";
import { CONN_RPC_URL } from "../constant";

type SignTransactionFeature = {
    signTransaction: (params: {
        account: unknown;
        transaction: Uint8Array
    }) => Promise<{ signedTransaction: Uint8Array }[]>;
};

export type SigningResult = {
    signedTransaction: string; // base58 encoded signed transaction
    message: string; // the verification message (for display/logging)
};

// Use generic type for wallet to avoid type conflicts with wallet-standard
type WalletWithFeatures = {
    features?: Record<string, unknown>;
    accounts?: readonly { address: string }[];
};

/**
 * Creates and signs a verification transaction for wallet ownership proof.
 * Works with all wallets including Ledger hardware wallets.
 * The transaction is NOT broadcast - it's only used to prove ownership.
 */
export async function signVerificationTransaction(
    wallet: WalletWithFeatures,
    walletAddress: string,
    purpose: string = "Verification Request"
): Promise<SigningResult> {
    const timestamp = Date.now();
    const message = `${purpose}\nTimestamp: ${timestamp}\nWallet: ${walletAddress}`;

    // Get the account
    const accounts = wallet.accounts;
    if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in wallet");
    }
    const account = accounts.find((acc) => acc.address === walletAddress) || accounts[0];

    // Get signTransaction feature
    const signTransactionFeature = wallet.features?.["solana:signTransaction"] as SignTransactionFeature | undefined;

    if (!signTransactionFeature) {
        throw new Error("Wallet does not support transaction signing");
    }

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

    // Serialize the transaction for signing
    const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
    });

    // Sign the transaction
    let result;
    try {
        result = await signTransactionFeature.signTransaction({
            account,
            transaction: serializedTransaction,
        });
    } catch (error) {
        const errorMsg = (error as Error).message?.toLowerCase() || "";
        if (errorMsg.includes("user rejected") || errorMsg.includes("cancelled") || errorMsg.includes("denied")) {
            throw new Error("Transaction signing cancelled by user");
        }
        throw error;
    }

    // Return the signed transaction as base58
    const signedTxBase58 = bs58.encode(result[0].signedTransaction);

    return {
        signedTransaction: signedTxBase58,
        message,
    };
}
