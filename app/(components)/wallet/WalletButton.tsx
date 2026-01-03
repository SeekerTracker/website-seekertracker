"use client";

import React, { useState } from "react";
import { useConnector, useAccount } from "@solana/connector/react";
import styles from "./WalletButton.module.css";
import WalletModal from "./WalletModal";
import WalletDropdown from "./WalletDropdown";

export default function WalletButton() {
    const { connected, connecting, selectedWallet, wallets } = useConnector();
    const { formatted } = useAccount();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Get wallet icon
    const walletWithIcon = wallets.find(w => w.wallet.name === selectedWallet?.name);
    const walletIcon = walletWithIcon?.wallet.icon || selectedWallet?.icon;

    const handleClick = () => {
        if (connected) {
            setIsDropdownOpen(!isDropdownOpen);
        } else {
            setIsModalOpen(true);
        }
    };

    if (connecting) {
        return (
            <button className={`${styles.button} ${styles.connecting}`} disabled>
                <span className={styles.spinner} />
                <span>Connecting...</span>
            </button>
        );
    }

    return (
        <>
            <div className={styles.buttonWrapper}>
                <button
                    className={`${styles.button} ${connected ? styles.connected : ""}`}
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
                    />
                )}
            </div>

            <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
