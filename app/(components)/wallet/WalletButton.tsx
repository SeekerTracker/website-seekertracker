"use client";

import React, { useState, useRef } from "react";
import { useConnector, useAccount } from "@solana/connector/react";
import styles from "./WalletButton.module.css";
import WalletDropdown from "./WalletDropdown";
import { useWalletModal } from "app/(utils)/context/walletProvider";

export default function WalletButton({ compact = false }: { compact?: boolean }) {
    const { connected, connecting, selectedWallet, wallets } = useConnector();
    const { formatted } = useAccount();
    const { openModal } = useWalletModal();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Get wallet icon
    const walletWithIcon = wallets.find(w => w.wallet.name === selectedWallet?.name);
    const walletIcon = walletWithIcon?.wallet.icon || selectedWallet?.icon;

    const handleClick = () => {
        if (connected) {
            setIsDropdownOpen(!isDropdownOpen);
        } else {
            openModal();
        }
    };

    if (connecting) {
        return (
            <button className={`${styles.button} ${styles.connecting} ${compact ? styles.compact : ""}`} disabled>
                <span className={styles.spinner} />
                <span>Connecting...</span>
            </button>
        );
    }

    return (
        <>
            <div className={styles.buttonWrapper}>
                <button
                    ref={buttonRef}
                    className={`${styles.button} ${connected ? styles.connected : ""} ${compact ? styles.compact : ""}`}
                    onClick={handleClick}
                >
                    {connected && walletIcon && (
                        <img
                            src={walletIcon}
                            alt={selectedWallet?.name || "Wallet"}
                            className={styles.walletIcon}
                        />
                    )}
                    <span>
                        {connected && formatted
                            ? formatted
                            : "Connect Wallet"}
                    </span>
                    {connected && (
                        <span className={`${styles.chevron} ${isDropdownOpen ? styles.open : ""}`}>
                            ▼
                        </span>
                    )}
                </button>

                {connected && isDropdownOpen && (
                    <WalletDropdown
                        isOpen={isDropdownOpen}
                        onClose={() => setIsDropdownOpen(false)}
                        walletIcon={walletIcon}
                        walletName={selectedWallet?.name}
                        triggerRef={buttonRef}
                    />
                )}
            </div>
        </>
    );
}
