"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useConnector, useAccount } from "@solana/connector/react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWalletContext } from "../../(utils)/context/walletProvider";
import { CONN_RPC_URL } from "../../(utils)/constant";
import styles from "./WalletDropdown.module.css";

type WalletDropdownProps = {
    isOpen: boolean;
    onClose: () => void;
    walletIcon?: string;
    walletName?: string;
    triggerRef?: React.RefObject<HTMLButtonElement | null>;
};

export default function WalletDropdown({
    isOpen,
    onClose,
    walletIcon,
    walletName,
    triggerRef,
}: WalletDropdownProps) {
    const { disconnect } = useConnector();
    const { address } = useAccount();
    const { trackerBalance, isLoadingBalance, refreshBalance } = useWalletContext();
    const [copied, setCopied] = useState(false);
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [isLoadingSol, setIsLoadingSol] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchSolBalance = useCallback(async () => {
        if (!address) return;
        setIsLoadingSol(true);
        try {
            const connection = new Connection(CONN_RPC_URL);
            const publicKey = new PublicKey(address);
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
            console.error("Failed to fetch SOL balance:", error);
            setSolBalance(null);
        } finally {
            setIsLoadingSol(false);
        }
    }, [address]);

    // Fetch SOL balance when dropdown opens
    useEffect(() => {
        if (isOpen && address) {
            fetchSolBalance();
        }
    }, [isOpen, address, fetchSolBalance]);

    // Store onClose in a ref to avoid stale closures
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Don't close if clicking on the dropdown itself
            if (dropdownRef.current && dropdownRef.current.contains(target)) {
                return;
            }
            // Don't close if clicking on the trigger button (it handles its own toggle)
            if (triggerRef?.current && triggerRef.current.contains(target)) {
                return;
            }
            onCloseRef.current();
        };

        // Add listener on next tick to avoid catching the opening click
        const timeoutId = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, triggerRef]);

    if (!isOpen || !address) return null;

    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(address).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch((error) => {
            console.error("Failed to copy address:", error);
        });
    };

    const handleRefreshAll = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        refreshBalance();
        fetchSolBalance();
    };

    const handleDisconnect = () => {
        disconnect();
        onClose();
    };

    return (
        <div ref={dropdownRef} className={styles.dropdown}>
            {/* Header with wallet info */}
            <div className={styles.header}>
                <div className={styles.walletInfo}>
                    {walletIcon && (
                        <img
                            src={walletIcon}
                            alt={walletName || "Wallet"}
                            className={styles.walletIcon}
                        />
                    )}
                    <div className={styles.addressInfo}>
                        <span className={styles.address}>{shortAddress}</span>
                        <span className={styles.walletName}>{walletName}</span>
                    </div>
                </div>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={handleCopy}
                        title={copied ? "Copied!" : "Copy address"}
                    >
                        {copied ? "✓" : "📋"}
                    </button>
                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`https://solscan.io/account/${address}`, "_blank");
                        }}
                        title="View on Solscan"
                    >
                        ↗
                    </button>
                </div>
            </div>

            {/* SOL Balance Section */}
            <div className={styles.balanceSection}>
                <div className={styles.balanceHeader}>
                    <span className={styles.balanceLabel}>SOL Balance</span>
                    <button
                        type="button"
                        className={styles.refreshButton}
                        onClick={handleRefreshAll}
                        disabled={isLoadingSol || isLoadingBalance}
                        title="Refresh balances"
                    >
                        <span className={isLoadingSol || isLoadingBalance ? styles.spinning : ""}>🔄</span>
                    </button>
                </div>
                <div className={styles.balanceValue}>
                    {isLoadingSol ? (
                        <span className={styles.loadingText}>Loading...</span>
                    ) : (
                        <span className={styles.amount}>
                            {solBalance !== null ? solBalance.toFixed(4) : "--"} SOL
                        </span>
                    )}
                </div>
            </div>

            {/* TRACKER Balance Section */}
            <div className={styles.balanceSectionSecondary}>
                <div className={styles.balanceHeader}>
                    <span className={styles.balanceLabel}>$TRACKER Balance</span>
                </div>
                <div className={styles.balanceValue}>
                    {isLoadingBalance ? (
                        <span className={styles.loadingText}>Loading...</span>
                    ) : (
                        <>
                            <span className={styles.amountSecondary}>
                                {trackerBalance.toLocaleString()}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Disconnect Button */}
            <button type="button" className={styles.disconnectButton} onClick={handleDisconnect}>
                <span>🚪</span>
                Disconnect
            </button>
        </div>
    );
}
