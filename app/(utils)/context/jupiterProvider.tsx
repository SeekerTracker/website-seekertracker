"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useCallback,
    useState,
    useMemo,
} from "react";
import { useConnector, useAccount } from "@solana/connector/react";
import { Transaction, VersionedTransaction, Connection } from "@solana/web3.js";
import { SEEKER_TOKEN_ADDRESS, JUP_REFERRAL } from "../constant";
import type { WalletPassthroughState, IInit } from "../../../types/jupiter-plugin";

type SignTransactionFeature = {
    signTransaction: (params: {
        account: unknown;
        transaction: Uint8Array;
    }) => Promise<{ signedTransaction: Uint8Array }[]>;
};

type SignAndSendTransactionFeature = {
    signAndSendTransaction: (params: {
        account: unknown;
        transaction: Uint8Array;
        options?: { skipPreflight?: boolean };
    }) => Promise<{ signature: string }[]>;
};

type WalletWithFeatures = {
    name: string;
    icon: string;
    features?: Record<string, unknown>;
    accounts?: readonly { address: string }[];
};

type JupiterContextType = {
    openJupiter: () => void;
    closeJupiter: () => void;
    isJupiterReady: boolean;
};

const JupiterContext = createContext<JupiterContextType>({
    openJupiter: () => {},
    closeJupiter: () => {},
    isJupiterReady: false,
});

interface JupiterProviderProps {
    children: ReactNode;
    onRequestConnectWallet: () => void;
}

export function JupiterProvider({ children, onRequestConnectWallet }: JupiterProviderProps) {
    const { connected, connecting, selectedWallet } = useConnector();
    const { address } = useAccount();
    const [isJupiterReady, setIsJupiterReady] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const wallet = selectedWallet as WalletWithFeatures | null;

    // Create a PublicKey-like object for Jupiter
    const publicKeyObj = useMemo(() => {
        if (!address) return null;
        return {
            toBase58: () => address,
            toString: () => address,
        };
    }, [address]);

    // Helper to check if transaction is versioned (works across different instances)
    const isVersionedTransaction = (tx: unknown): boolean => {
        // Check for version property or message with versioned structure
        const txAny = tx as Record<string, unknown>;
        if (txAny.version !== undefined) return true;
        if (txAny.message && typeof (txAny.message as Record<string, unknown>).version === 'number') return true;
        // Check for compiledInstructions which indicates versioned transaction
        if (txAny.message && (txAny.message as Record<string, unknown>).compiledInstructions) return true;
        return false;
    };

    // Create signTransaction function compatible with Jupiter
    const signTransaction = useCallback(
        async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
            if (!wallet || !address) {
                throw new Error("Wallet not connected");
            }

            const accounts = wallet.accounts;
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found in wallet");
            }
            const account = accounts.find((acc) => acc.address === address) || accounts[0];

            const signTransactionFeature = wallet.features?.[
                "solana:signTransaction"
            ] as SignTransactionFeature | undefined;

            if (!signTransactionFeature) {
                throw new Error("Wallet does not support transaction signing");
            }

            const isVersioned = isVersionedTransaction(transaction);

            // Serialize the transaction
            let serializedTransaction: Uint8Array;
            if (isVersioned) {
                // For versioned transactions, use serialize() method
                serializedTransaction = (transaction as VersionedTransaction).serialize();
            } else {
                // For legacy transactions
                serializedTransaction = (transaction as Transaction).serialize({
                    requireAllSignatures: false,
                    verifySignatures: false,
                });
            }

            const result = await signTransactionFeature.signTransaction({
                account,
                transaction: serializedTransaction,
            });

            // Deserialize back to original transaction type
            const signedBytes = result[0].signedTransaction;
            if (isVersioned) {
                return VersionedTransaction.deserialize(signedBytes) as T;
            } else {
                return Transaction.from(signedBytes) as T;
            }
        },
        [wallet, address]
    );

    // Create signAllTransactions function
    const signAllTransactions = useCallback(
        async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
            const signedTransactions: T[] = [];
            for (const tx of transactions) {
                const signed = await signTransaction(tx);
                signedTransactions.push(signed);
            }
            return signedTransactions;
        },
        [signTransaction]
    );

    // Create sendTransaction function
    const sendTransaction = useCallback(
        async (transaction: Transaction | VersionedTransaction, connection: Connection): Promise<string> => {
            if (!wallet || !address) {
                throw new Error("Wallet not connected");
            }

            const accounts = wallet.accounts;
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found in wallet");
            }
            const account = accounts.find((acc) => acc.address === address) || accounts[0];

            const signAndSendFeature = wallet.features?.[
                "solana:signAndSendTransaction"
            ] as SignAndSendTransactionFeature | undefined;

            const isVersioned = isVersionedTransaction(transaction);

            if (signAndSendFeature) {
                // Serialize the transaction
                let serializedTransaction: Uint8Array;
                if (isVersioned) {
                    serializedTransaction = (transaction as VersionedTransaction).serialize();
                } else {
                    serializedTransaction = (transaction as Transaction).serialize({
                        requireAllSignatures: false,
                        verifySignatures: false,
                    });
                }

                const result = await signAndSendFeature.signAndSendTransaction({
                    account,
                    transaction: serializedTransaction,
                });

                return result[0].signature;
            } else {
                // Fallback: sign and send manually
                const signed = await signTransaction(transaction);
                const signedIsVersioned = isVersionedTransaction(signed);
                let serialized: Uint8Array;
                if (signedIsVersioned) {
                    serialized = (signed as VersionedTransaction).serialize();
                } else {
                    serialized = (signed as Transaction).serialize();
                }
                const signature = await connection.sendRawTransaction(serialized);
                return signature;
            }
        },
        [wallet, address, signTransaction]
    );

    // Build the passthrough wallet state
    const passthroughWalletContextState: WalletPassthroughState | undefined = useMemo(() => {
        if (!connected || !wallet || !address) {
            return {
                publicKey: null,
                connected: false,
                connecting,
                disconnecting: false,
                wallet: null,
                signTransaction: undefined,
                signAllTransactions: undefined,
                sendTransaction: undefined,
            };
        }

        return {
            publicKey: publicKeyObj,
            connected: true,
            connecting: false,
            disconnecting: false,
            wallet: {
                adapter: {
                    name: wallet.name,
                    icon: wallet.icon,
                    publicKey: publicKeyObj,
                },
            },
            signTransaction: signTransaction as WalletPassthroughState["signTransaction"],
            signAllTransactions: signAllTransactions as WalletPassthroughState["signAllTransactions"],
            sendTransaction: sendTransaction as WalletPassthroughState["sendTransaction"],
        };
    }, [connected, connecting, wallet, address, publicKeyObj, signTransaction, signAllTransactions, sendTransaction]);

    // Initialize Jupiter when ready
    useEffect(() => {
        if (typeof window === "undefined" || !window.Jupiter) {
            // Check periodically if Jupiter is loaded
            const checkInterval = setInterval(() => {
                if (window.Jupiter) {
                    setIsJupiterReady(true);
                    clearInterval(checkInterval);
                }
            }, 100);

            return () => clearInterval(checkInterval);
        } else {
            setIsJupiterReady(true);
        }
    }, []);

    // Initialize Jupiter plugin
    useEffect(() => {
        if (!isJupiterReady || isInitialized) return;

        const initProps: IInit = {
            displayMode: "modal",
            defaultExplorer: "Solscan",
            enableWalletPassthrough: true,
            passthroughWalletContextState,
            onRequestConnectWallet,
            formProps: {
                initialInputMint: "So11111111111111111111111111111111111111112", // SOL
                initialOutputMint: SEEKER_TOKEN_ADDRESS,
                fixedMint: SEEKER_TOKEN_ADDRESS,
                referralAccount: JUP_REFERRAL,
                referralFee: 100, // 1% fee (100 basis points)
            },
            onSuccess: ({ txid }) => {
                console.log("Swap successful:", txid);
            },
            onSwapError: ({ error }) => {
                console.error("Swap error:", error);
            },
        };

        window.Jupiter.init(initProps);
        // Close immediately after init to prevent auto-open
        window.Jupiter.close();
        setIsInitialized(true);
    }, [isJupiterReady, isInitialized, passthroughWalletContextState, onRequestConnectWallet]);

    // Sync wallet state with Jupiter when it changes
    useEffect(() => {
        if (!isJupiterReady || !isInitialized) return;

        window.Jupiter.syncProps({
            passthroughWalletContextState,
        });
    }, [isJupiterReady, isInitialized, passthroughWalletContextState]);

    const openJupiter = useCallback(() => {
        if (isJupiterReady && window.Jupiter) {
            window.Jupiter.resume();
        }
    }, [isJupiterReady]);

    const closeJupiter = useCallback(() => {
        if (isJupiterReady && window.Jupiter) {
            window.Jupiter.close();
        }
    }, [isJupiterReady]);

    const value = useMemo(
        () => ({ openJupiter, closeJupiter, isJupiterReady }),
        [openJupiter, closeJupiter, isJupiterReady]
    );

    return (
        <JupiterContext.Provider value={value}>
            {children}
        </JupiterContext.Provider>
    );
}

export const useJupiter = () => useContext(JupiterContext);
