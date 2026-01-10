"use client";

import React, { useState, useEffect, Activity } from "react";
import { useConnector } from "@solana/connector/react";
import styles from "./WalletModal.module.css";

type WalletModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { wallets, select, connecting, selectedWallet } = useConnector();
    const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
    const [recentlyConnected, setRecentlyConnected] = useState<string | null>(null);
    const [showOtherInstalled, setShowOtherInstalled] = useState(false);

    useEffect(() => {
        const recent = localStorage.getItem("recentlyConnectedWallet");
        if (recent) {
            setRecentlyConnected(recent);
        }
    }, []);

    useEffect(() => {
        if (selectedWallet?.name) {
            localStorage.setItem("recentlyConnectedWallet", selectedWallet.name);
            setRecentlyConnected(selectedWallet.name);
        }
    }, [selectedWallet]);

    if (!isOpen) return null;

    const handleConnect = async (walletName: string) => {
        if (connecting) return;
        setConnectingWallet(walletName);
        try {
            await select(walletName);
            localStorage.setItem("recentlyConnectedWallet", walletName);
            setRecentlyConnected(walletName);
            onClose();
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setConnectingWallet(null);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getInstallUrl = (walletName: string) => {
        const name = walletName.toLowerCase();
        if (name.includes("phantom")) return "https://phantom.app";
        if (name.includes("solflare")) return "https://solflare.com";
        if (name.includes("backpack")) return "https://backpack.app";
        if (name.includes("glow")) return "https://glow.app";
        return "https://phantom.app";
    };

    // Filter and sort wallets
    const installedWallets = wallets.filter((w) => w.installed);
    const notInstalledWallets = wallets.filter((w) => !w.installed);

    // Sort installed: recently connected first
    const sortedInstalledWallets = [...installedWallets].sort((a, b) => {
        const aIsRecent = recentlyConnected === a.wallet.name;
        const bIsRecent = recentlyConnected === b.wallet.name;
        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;
        return 0;
    });

    // Primary wallets (first 3), others in collapsible
    const primaryWallets = sortedInstalledWallets?.slice(0, 3);
    const otherInstalledWallets = sortedInstalledWallets?.slice(3);

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Connect your wallet</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Primary Installed Wallets */}
                    <Activity mode={primaryWallets.length > 0 ? "visible" : "hidden"}>
                        <div className={styles.section}>
                            <div className={styles.walletList}>
                                {primaryWallets.map((walletInfo) => {
                                    const isConnecting = connectingWallet === walletInfo.wallet.name;
                                    const isRecent = recentlyConnected === walletInfo.wallet.name;
                                    return (
                                        <button
                                            key={walletInfo.wallet.name}
                                            className={styles.walletItem}
                                            onClick={() => handleConnect(walletInfo.wallet.name)}
                                            disabled={connecting || isConnecting}
                                        >
                                            <div className={styles.walletInfo}>
                                                <span className={styles.walletName}>
                                                    {walletInfo.wallet.name}
                                                </span>
                                                {isRecent && (
                                                    <span className={styles.recentBadge}>Recent</span>
                                                )}
                                                {isConnecting && (
                                                    <span className={styles.connectingText}>Connecting...</span>
                                                )}
                                            </div>
                                            <div className={styles.walletRight}>
                                                {isConnecting && <span className={styles.spinner} />}
                                                {walletInfo.wallet.icon && (
                                                    <img
                                                        src={walletInfo.wallet.icon}
                                                        alt={walletInfo.wallet.name}
                                                        className={styles.walletIcon}
                                                    />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Activity>

                    <Activity mode={otherInstalledWallets.length > 0 ? "visible" : "hidden"}>
                        {/* Other Installed Wallets (collapsible) */}
                        <div className={styles.section}>
                            <button
                                className={styles.accordionButton}
                                onClick={() => setShowOtherInstalled(!showOtherInstalled)}
                            >
                                <span>Other Wallets ({otherInstalledWallets.length})</span>
                                <span className={`${styles.chevron} ${showOtherInstalled ? styles.open : ""}`}>
                                    ▼
                                </span>
                            </button>
                            {showOtherInstalled && (
                                <div className={styles.walletList}>
                                    {otherInstalledWallets.map((walletInfo) => {
                                        const isConnecting = connectingWallet === walletInfo.wallet.name;
                                        const isRecent = recentlyConnected === walletInfo.wallet.name;
                                        return (
                                            <button
                                                key={walletInfo.wallet.name}
                                                className={styles.walletItem}
                                                onClick={() => handleConnect(walletInfo.wallet.name)}
                                                disabled={connecting || isConnecting}
                                            >
                                                <div className={styles.walletInfo}>
                                                    <span className={styles.walletName}>
                                                        {walletInfo.wallet.name}
                                                    </span>
                                                    {isRecent && (
                                                        <span className={styles.recentBadge}>Recent</span>
                                                    )}
                                                    {isConnecting && (
                                                        <span className={styles.connectingText}>Connecting...</span>
                                                    )}
                                                </div>
                                                <div className={styles.walletRight}>
                                                    {isConnecting && <span className={styles.spinner} />}
                                                    {walletInfo.wallet.icon && (
                                                        <img
                                                            src={walletInfo.wallet.icon}
                                                            alt={walletInfo.wallet.name}
                                                            className={styles.walletIcon}
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Activity>

                    {/* Not Installed Wallets */}
                    <Activity mode={notInstalledWallets.length > 0 ? "visible" : "hidden"}>
                        <div className={styles.section}>
                            <h3>{installedWallets.length > 0 ? "Get a Wallet" : "Popular Wallets"}</h3>
                            <div className={styles.walletList}>
                                {notInstalledWallets?.slice(0, 3).map((walletInfo) => (
                                    <button
                                        key={walletInfo.wallet.name}
                                        className={styles.walletItemInstall}
                                        onClick={() => window.open(getInstallUrl(walletInfo.wallet.name), "_blank")}
                                    >
                                        <div className={styles.walletInfo}>
                                            {walletInfo.wallet.icon && (
                                                <img
                                                    src={walletInfo.wallet.icon}
                                                    alt={walletInfo.wallet.name}
                                                    className={styles.walletIconSmall}
                                                />
                                            )}
                                            <div className={styles.walletInstallInfo}>
                                                <span className={styles.walletName}>{walletInfo.wallet.name}</span>
                                                <span className={styles.notInstalled}>Not installed</span>
                                            </div>
                                        </div>
                                        <span className={styles.externalLink}>↗</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Activity>

                    <Activity mode={wallets.length === 0 && !connecting ? "visible" : "hidden"}>
                        <div className={styles.noWallets}>
                            <div className={styles.noWalletsIcon}>👛</div>
                            <h3>No Wallets Detected</h3>
                            <p>Install a Solana wallet extension to get started</p>
                            <div className={styles.installButtons}>
                                <button
                                    className={styles.primaryButton}
                                    onClick={() => window.open("https://sal.fun/jup", "_blank")}
                                >
                                    Get Jupiter
                                </button>
                            </div>
                        </div>
                    </Activity>
                </div>
            </div>
        </div>
    );
}
