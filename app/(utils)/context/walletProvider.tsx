"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useMemo,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    AppProvider,
    useConnector,
    useAccount,
} from "@solana/connector/react";
import { getDefaultConfig } from "@solana/connector/headless";
import { Connection, PublicKey } from "@solana/web3.js";
import { CONN_RPC_URL, REQUIRED_TRACKER_BALANCE } from "../constant";
import { getTrackerTokenBalance } from "../lib/tokenBalance";

type WalletContextType = {
    trackerBalance: number;
    isEligible: boolean;
    isLoadingBalance: boolean;
    refreshBalance: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType>({
    trackerBalance: 0,
    isEligible: false,
    isLoadingBalance: false,
    refreshBalance: async () => {},
});

function WalletContextProvider({ children }: { children: ReactNode }) {
    const { connected } = useConnector();
    const { address } = useAccount();
    const [trackerBalance, setTrackerBalance] = useState(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    const isEligible = trackerBalance >= REQUIRED_TRACKER_BALANCE;

    const refreshBalance = useCallback(async () => {
        if (!address || !connected) {
            setTrackerBalance(0);
            return;
        }
        setIsLoadingBalance(true);
        try {
            const connection = new Connection(CONN_RPC_URL);
            const publicKey = new PublicKey(address);
            const balance = await getTrackerTokenBalance(connection, publicKey);
            setTrackerBalance(balance);
        } catch (error) {
            console.error("Failed to fetch token balance:", error);
            setTrackerBalance(0);
        } finally {
            setIsLoadingBalance(false);
        }
    }, [address, connected]);

    useEffect(() => {
        refreshBalance();
    }, [refreshBalance]);

    const value = useMemo(
        () => ({ trackerBalance, isEligible, isLoadingBalance, refreshBalance }),
        [trackerBalance, isEligible, isLoadingBalance, refreshBalance]
    );

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function WalletProviderWrapper({ children }: { children: ReactNode }) {
    const config = useMemo(() => {
        return getDefaultConfig({
            appName: "Seeker Tracker",
            appUrl: typeof window !== "undefined" ? window.location.origin : "https://seekertracker.com",
            autoConnect: true,
            enableMobile: true,
            clusters: [
                {
                    id: "solana:mainnet" as const,
                    label: "Mainnet",
                    url: CONN_RPC_URL,
                },
            ],
        });
    }, []);

    return (
        <AppProvider connectorConfig={config}>
            <WalletContextProvider>{children}</WalletContextProvider>
        </AppProvider>
    );
}

export const useWalletContext = () => useContext(WalletContext);
