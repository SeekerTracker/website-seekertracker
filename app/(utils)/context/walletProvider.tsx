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
import { JupiterProvider } from "./jupiterProvider";
import WalletModal from "../../(components)/wallet/WalletModal";

type WalletContextType = {
    trackerBalance: number;
    isEligible: boolean;
    isLoadingBalance: boolean;
    refreshBalance: () => Promise<void>;
    openWalletModal: () => void;
};

type WalletModalContextType = {
    isModalOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
};

const WalletModalContext = createContext<WalletModalContextType>({
    isModalOpen: false,
    openModal: () => {},
    closeModal: () => {},
});

export const useWalletModal = () => useContext(WalletModalContext);

const WalletContext = createContext<WalletContextType>({
    trackerBalance: 0,
    isEligible: false,
    isLoadingBalance: false,
    refreshBalance: async () => {},
    openWalletModal: () => {},
});

interface WalletContextProviderProps {
    children: ReactNode;
    openWalletModal: () => void;
}

function WalletContextProvider({ children, openWalletModal }: WalletContextProviderProps) {
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
        () => ({ trackerBalance, isEligible, isLoadingBalance, refreshBalance, openWalletModal }),
        [trackerBalance, isEligible, isLoadingBalance, refreshBalance, openWalletModal]
    );

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function WalletProviderWrapper({ children }: { children: ReactNode }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => setIsModalOpen(false), []);

    const modalValue = useMemo(
        () => ({ isModalOpen, openModal, closeModal }),
        [isModalOpen, openModal, closeModal]
    );

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
            <WalletModalContext.Provider value={modalValue}>
                <WalletContextProvider openWalletModal={openModal}>
                    <JupiterProvider onRequestConnectWallet={openModal}>
                        {children}
                        <WalletModal isOpen={isModalOpen} onClose={closeModal} />
                    </JupiterProvider>
                </WalletContextProvider>
            </WalletModalContext.Provider>
        </AppProvider>
    );
}

export const useWalletContext = () => useContext(WalletContext);
