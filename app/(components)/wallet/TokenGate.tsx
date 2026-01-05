"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { useConnector } from "@solana/connector/react";
import { useWalletContext } from "../../(utils)/context/walletProvider";
import { useJupiter } from "../../(utils)/context/jupiterProvider";
import { REQUIRED_TRACKER_BALANCE } from "../../(utils)/constant";
import WalletButton from "./WalletButton";
import styles from "./WalletButton.module.css";

type TokenGateProps = {
    children: ReactNode;
    fallback?: ReactNode;
    requiredBalance?: number;
};

export default function TokenGate({
    children,
    fallback,
    requiredBalance = REQUIRED_TRACKER_BALANCE,
}: TokenGateProps) {
    const { connected } = useConnector();
    const { trackerBalance, isLoadingBalance } = useWalletContext();
    const { openJupiter, isJupiterReady } = useJupiter();
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Track when we've loaded balance at least once
    useEffect(() => {
        if (!isLoadingBalance && connected && !hasLoadedOnce) {
            setHasLoadedOnce(true);
        }
    }, [isLoadingBalance, connected, hasLoadedOnce]);

    // Reset when disconnected
    useEffect(() => {
        if (!connected) {
            setHasLoadedOnce(false);
        }
    }, [connected]);

    if (!connected) {
        return (
            fallback ?? (
                <div className={styles.gateContainer}>
                    <h3>Connect Wallet to Access</h3>
                    <p>You need to connect your wallet to access this feature.</p>
                    <WalletButton />
                </div>
            )
        );
    }

    // Only show loading on initial load, not during refresh
    if (isLoadingBalance && !hasLoadedOnce) {
        return (
            <div className={styles.gateContainer}>
                <div className={styles.loading}>
                    <span className={styles.spinner} />
                    <span>Checking token balance...</span>
                </div>
            </div>
        );
    }

    if (trackerBalance < requiredBalance) {
        return (
            fallback ?? (
                <div className={styles.gateContainer}>
                    <h3>Insufficient $TRACKER Balance</h3>
                    <p>
                        You need at least {requiredBalance.toLocaleString()} $TRACKER
                        tokens to access this feature.
                    </p>
                    <p>Current balance: {trackerBalance.toLocaleString()} $TRACKER</p>
                    <button
                        onClick={openJupiter}
                        disabled={!isJupiterReady}
                        className={styles.swapLink}
                    >
                        {isJupiterReady ? "Buy $TRACKER" : "Loading Jupiter..."}
                    </button>
                </div>
            )
        );
    }

    return <>{children}</>;
}
