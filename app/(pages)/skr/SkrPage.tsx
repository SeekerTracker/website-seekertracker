"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import { getOnchainDomainData } from "../../(utils)/onchainData";

interface AllocationData {
    success: boolean;
    wallet: string;
    claimStatusPDA: string;
    hasClaimed: boolean;
    claimDetails: {
        lockedAmount: number;
        lockedWithdrawn: number;
        unlockedAmount: number;
        totalAllocation: number;
    };
    currentBalance: number;
}

interface VaultData {
    success: boolean;
    skrMint: string;
    skrPrice: number;
    totalSupply: number;
    totalHolders: number;
    marketCap: number;
    vault: {
        address: string;
        skrBalance: number;
        skrUsdValue: number;
    };
    stakedVault: {
        address: string;
        skrBalance: number;
        skrUsdValue: number;
    };
    lastUpdated: number;
}

const SkrPage = () => {
    const searchParams = useSearchParams();
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allocationData, setAllocationData] = useState<AllocationData | null>(null);
    const [resolvedWallet, setResolvedWallet] = useState<string | null>(null);
    const [resolvedDomain, setResolvedDomain] = useState<string | null>(null);
    const [initialSearchDone, setInitialSearchDone] = useState(false);
    const [vaultData, setVaultData] = useState<VaultData | null>(null);
    const [vaultLoading, setVaultLoading] = useState(true);
    const [stakerCount, setStakerCount] = useState<number | null>(null);

    // Fetch vault balance and staker count
    const fetchVault = async () => {
        setVaultLoading(true);
        try {
            const [vaultRes, stakersRes] = await Promise.all([
                fetch("/api/skr/vault"),
                fetch("/api/skr/stakers"),
            ]);
            if (vaultRes.ok) {
                const data = await vaultRes.json();
                setVaultData(data);
            }
            if (stakersRes.ok) {
                const data = await stakersRes.json();
                setStakerCount(data.stakerCount);
            }
        } catch (err) {
            console.error("Failed to fetch vault:", err);
        } finally {
            setVaultLoading(false);
        }
    };

    // Fetch vault balance on mount
    useEffect(() => {
        fetchVault();
    }, []);

    const isSkrDomain = (value: string): boolean => {
        return value.toLowerCase().includes(".skr") || !value.includes(".");
    };

    const isValidSolanaAddress = (value: string): boolean => {
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
    };

    // Auto-search if query parameter is provided
    useEffect(() => {
        const query = searchParams.get("q");
        if (query && !initialSearchDone) {
            setInput(query);
            setInitialSearchDone(true);
        }
    }, [searchParams, initialSearchDone]);

    // Trigger search when input is set from query param
    useEffect(() => {
        if (initialSearchDone && input && !loading && !allocationData) {
            handleSearch();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSearchDone, input]);

    const handleSearch = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput) {
            setError("Please enter a .skr domain or wallet address");
            return;
        }

        setLoading(true);
        setError(null);
        setAllocationData(null);
        setResolvedWallet(null);
        setResolvedDomain(null);

        try {
            let walletAddress: string;

            if (isValidSolanaAddress(trimmedInput)) {
                walletAddress = trimmedInput;
            } else {
                let domainName = trimmedInput.toLowerCase();
                if (!domainName.endsWith(".skr")) {
                    domainName = domainName + ".skr";
                }
                setResolvedDomain(domainName);

                const parts = domainName.split(".");
                const subdomain = parts[0];
                const domain = "." + parts[1];

                const domainData = await getOnchainDomainData(domain, subdomain);
                if (!domainData || !domainData.owner) {
                    setError(`Could not find owner for ${domainName}`);
                    setLoading(false);
                    return;
                }

                walletAddress = domainData.owner;
                setResolvedWallet(walletAddress);
            }

            const response = await fetch(`/api/allocation/${walletAddress}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError("No allocation found for this wallet");
                } else {
                    setError("Failed to fetch allocation data");
                }
                setLoading(false);
                return;
            }

            const data: AllocationData = await response.json();
            setAllocationData(data);
        } catch (err) {
            console.error("Error fetching allocation:", err);
            setError("An error occurred while fetching data");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString();
    };

    const formatCompact = (num: number): string => {
        if (num >= 1_000_000_000) {
            return (num / 1_000_000_000).toFixed(2) + 'B';
        }
        if (num >= 1_000_000) {
            return (num / 1_000_000).toFixed(2) + 'M';
        }
        if (num >= 1_000) {
            return (num / 1_000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    };

    const [copied, setCopied] = useState<string | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [statsData, setStatsData] = useState<{
        generated: string;
        summary: {
            totalClaimers: number;
            totalAllocations: number;
            totalLocked: number;
            totalLockedWithdrawn: number;
            totalUnlocked: number;
            grandTotal: number;
        };
        tiers: { amount: number; count: number; totalTokens: number }[];
    } | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    const handleStatsClick = async () => {
        if (showStats) {
            setShowStats(false);
            return;
        }

        setStatsLoading(true);
        setStatsError(null);
        try {
            // Fetch summary from live API and tiers from static JSON
            const [summaryRes, tiersRes] = await Promise.all([
                fetch("/api/skr/summary"),
                fetch("/skr-stats.json"),
            ]);

            if (!summaryRes.ok) {
                throw new Error("Failed to fetch stats");
            }

            const summaryData = await summaryRes.json();
            const tiersData = await tiersRes.json();

            setStatsData({
                generated: summaryData.generated,
                summary: summaryData,
                tiers: tiersData.tiers || [],
            });
            setShowStats(true);
        } catch (err) {
            console.error("Failed to load stats:", err);
            setStatsError("Data is loading from chain, please try again in ~30 seconds");
        } finally {
            setStatsLoading(false);
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href="/">← Back to Tracker</Link>
            </div>

            <div className={styles.topBar}>
                <span className={styles.header}>SKR Allocation Checker</span>
                <span className={styles.tokenDesc}>
                    Check your SKR token allocation by .skr domain or wallet address
                </span>
            </div>

            {vaultData && (
                <div className={styles.tokenStatsContainer}>
                    <div className={styles.tokenStatItem}>
                        <span className={styles.tokenStatLabel}>Price</span>
                        <span className={styles.tokenStatValue}>
                            ${vaultData.skrPrice.toFixed(6)}
                        </span>
                    </div>
                    <div className={styles.tokenStatItem}>
                        <span className={styles.tokenStatLabel}>Market Cap</span>
                        <span className={styles.tokenStatValue}>
                            ${formatCompact(vaultData.marketCap)}
                        </span>
                    </div>
                    <div className={styles.tokenStatItem}>
                        <span className={styles.tokenStatLabel}>Supply</span>
                        <span className={styles.tokenStatValue}>
                            {formatCompact(vaultData.totalSupply)}
                        </span>
                    </div>
                    <div className={styles.tokenStatItem}>
                        <span className={styles.tokenStatLabel}>Holders</span>
                        <span className={styles.tokenStatValue}>
                            {formatCompact(vaultData.totalHolders)}
                        </span>
                    </div>
                </div>
            )}

            {vaultData && (
                <div className={styles.stakedPercentageContainer}>
                    <div className={styles.stakedPercentageHeader}>
                        <span className={styles.stakedPercentageLabel}>Staked</span>
                        <span className={styles.stakedPercentageValue}>
                            {((vaultData.stakedVault.skrBalance / vaultData.totalSupply) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className={styles.stakedProgressBar}>
                        <div
                            className={styles.stakedProgressFill}
                            style={{ width: `${(vaultData.stakedVault.skrBalance / vaultData.totalSupply) * 100}%` }}
                        />
                    </div>
                    <div className={styles.stakedProgressLabels}>
                        <span>{formatCompact(vaultData.stakedVault.skrBalance)} staked</span>
                        <span>{formatCompact(vaultData.totalSupply)} total</span>
                    </div>
                </div>
            )}

            <div className={styles.vaultsContainer}>
                <div className={styles.vaultSection}>
                    <div className={styles.vaultHeader}>
                        <span className={styles.vaultTitle}>Seeker Vault</span>
                        <button
                            className={styles.refreshButton}
                            onClick={fetchVault}
                            disabled={vaultLoading}
                            title="Refresh"
                        >
                            {vaultLoading ? "..." : "↻"}
                        </button>
                    </div>
                    {vaultLoading ? (
                        <span className={styles.vaultLoading}>Loading...</span>
                    ) : vaultData ? (
                        <div className={styles.vaultContent}>
                            <div className={styles.vaultBalance}>
                                <span className={styles.vaultAmount}>
                                    {formatNumber(Math.floor(vaultData.vault.skrBalance))}
                                </span>
                                <span className={styles.vaultToken}>SKR</span>
                            </div>
                            <span className={styles.vaultUsd}>
                                ${vaultData.vault.skrUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                            <Link
                                href={`https://solscan.io/account/${vaultData.vault.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.vaultAddress}
                            >
                                {vaultData.vault.address.slice(0, 4)}...{vaultData.vault.address.slice(-4)}
                            </Link>
                        </div>
                    ) : (
                        <span className={styles.vaultError}>Failed to load</span>
                    )}
                </div>

                <div className={styles.vaultSection}>
                    <div className={styles.vaultHeader}>
                        <span className={styles.vaultTitle}>Staked Vault</span>
                    </div>
                    {vaultLoading ? (
                        <span className={styles.vaultLoading}>Loading...</span>
                    ) : vaultData ? (
                        <div className={styles.vaultContent}>
                            <div className={styles.vaultBalance}>
                                <span className={styles.vaultAmount}>
                                    {formatNumber(Math.floor(vaultData.stakedVault.skrBalance))}
                                </span>
                                <span className={styles.vaultToken}>SKR</span>
                            </div>
                            <span className={styles.vaultUsd}>
                                ${vaultData.stakedVault.skrUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                            {stakerCount !== null && (
                                <span className={styles.stakerCount}>
                                    {formatNumber(stakerCount)} stakers
                                </span>
                            )}
                            <Link
                                href={`https://solscan.io/account/${vaultData.stakedVault.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.vaultAddress}
                            >
                                {vaultData.stakedVault.address.slice(0, 4)}...{vaultData.stakedVault.address.slice(-4)}
                            </Link>
                        </div>
                    ) : (
                        <span className={styles.vaultError}>Failed to load</span>
                    )}
                </div>
            </div>

            <div className={styles.shareSection}>
                <span className={styles.shareLabel}>Share SKR Stats</span>
                <div className={styles.shareButtons}>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out SKR Season 1 Stats!")}&url=${encodeURIComponent("https://seekertracker.com/skr")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.shareButtonX}
                    >
                        Share on X
                    </a>
                    <a
                        href={`https://t.me/share/url?url=${encodeURIComponent("https://seekertracker.com/skr")}&text=${encodeURIComponent("Check out SKR Season 1 Stats!")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.shareButtonTg}
                    >
                        Share on Telegram
                    </a>
                </div>
            </div>

            <div className={styles.searchSection}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Enter .skr domain (e.g. sal.skr) or wallet address"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={styles.searchInput}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className={styles.searchButton}
                    >
                        {loading ? "Searching..." : "Check Allocation"}
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button className={styles.statsButton} onClick={handleStatsClick}>
                    {statsLoading ? "Loading (may take ~30s)..." : showStats ? "Hide Stats" : "SKR Szn 1 Stats"}
                </button>

                {statsError && <div className={styles.error}>{statsError}</div>}
            </div>

            {showStats && statsData && (
                <div className={styles.statsSection}>
                    <span className={styles.sectionTitle}>SKR Season 1 Stats</span>
                    <span className={styles.statsGenerated}>
                        Generated: {new Date(statsData.generated).toLocaleString()}
                    </span>
                    <span className={styles.statsCache}>Data cached for 5 minutes</span>

                    <div className={styles.summaryCards}>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Total Claimers</span>
                            <span className={styles.summaryValue}>
                                {formatNumber(statsData.summary.totalClaimers || 0)}
                            </span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Total Allocations</span>
                            <span className={styles.summaryValue}>
                                {formatNumber(statsData.summary.totalAllocations)}
                            </span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Total SKR Allocated</span>
                            <span className={styles.summaryValue}>
                                {formatNumber(statsData.summary.grandTotal)}
                            </span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Total Unlocked</span>
                            <span className={styles.summaryValue}>
                                {formatNumber(statsData.summary.totalUnlocked)}
                            </span>
                        </div>
                    </div>

                    {statsData.tiers.length > 0 && (
                        <div className={styles.tiersSection}>
                            <span className={styles.tiersTitle}>Allocation Tiers</span>
                            <div className={styles.tiersList}>
                                {statsData.tiers.map((tier) => (
                                    <div key={tier.amount} className={styles.tierRow}>
                                        <span className={styles.tierAmount}>
                                            {formatNumber(tier.amount)} SKR
                                        </span>
                                        {vaultData && (
                                            <span className={styles.tierValue}>
                                                ${(tier.amount * vaultData.skrPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        )}
                                        <span className={styles.tierCount}>
                                            {formatNumber(tier.count)} wallets
                                        </span>
                                        <span className={styles.tierTotal}>
                                            {formatNumber(tier.totalTokens)} total
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {allocationData && (
                <div className={styles.resultsSection}>
                    {resolvedDomain && resolvedWallet && (
                        <div className={styles.resolvedInfo}>
                            <span className={styles.resolvedDomain}>{resolvedDomain}</span>
                            <span className={styles.resolvedArrow}>→</span>
                            <Link
                                href={`https://solscan.io/account/${resolvedWallet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.resolvedWallet}
                            >
                                {resolvedWallet.slice(0, 4)}...{resolvedWallet.slice(-4)}
                            </Link>
                        </div>
                    )}

                    <div className={styles.statusBadge}>
                        <span
                            className={`${styles.claimStatus} ${
                                allocationData.hasClaimed ? styles.claimed : styles.unclaimed
                            }`}
                        >
                            {allocationData.hasClaimed ? "Claimed" : "Not Claimed"}
                        </span>
                    </div>

                    <div className={styles.infoCards}>
                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>Total Allocation</span>
                            <span className={styles.cardValue}>
                                {formatNumber(allocationData.claimDetails?.totalAllocation ?? 0)}
                            </span>
                            <span className={styles.cardDesc}>SKR tokens allocated</span>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>Unlocked Amount</span>
                            <span className={styles.cardValue}>
                                {formatNumber(allocationData.claimDetails?.unlockedAmount ?? 0)}
                            </span>
                            <span className={styles.cardDesc}>Available to claim</span>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>Locked Amount</span>
                            <span className={styles.cardValue}>
                                {formatNumber(allocationData.claimDetails?.lockedAmount ?? 0)}
                            </span>
                            <span className={styles.cardDesc}>Still locked</span>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.cardTitle}>Current Balance</span>
                            <span className={styles.cardValue}>
                                {formatNumber(allocationData.currentBalance ?? 0)}
                            </span>
                            <span className={styles.cardDesc}>SKR in wallet</span>
                        </div>
                    </div>

                    <div className={styles.detailsSection}>
                        <span className={styles.sectionTitle}>Details</span>
                        <div className={styles.detailsList}>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Wallet</span>
                                <div className={styles.addressGroup}>
                                    <Link
                                        href={`https://solscan.io/account/${allocationData.wallet}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.detailValue}
                                    >
                                        {allocationData.wallet.slice(0, 8)}...{allocationData.wallet.slice(-8)}
                                    </Link>
                                    <button
                                        className={styles.copyButton}
                                        onClick={() => copyToClipboard(allocationData.wallet, "wallet")}
                                    >
                                        {copied === "wallet" ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                            {allocationData.claimStatusPDA && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Claim Status PDA</span>
                                    <div className={styles.addressGroup}>
                                        <Link
                                            href={`https://solscan.io/account/${allocationData.claimStatusPDA}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.detailValue}
                                        >
                                            {allocationData.claimStatusPDA.slice(0, 8)}...{allocationData.claimStatusPDA.slice(-8)}
                                        </Link>
                                        <button
                                            className={styles.copyButton}
                                            onClick={() => copyToClipboard(allocationData.claimStatusPDA, "pda")}
                                        >
                                            {copied === "pda" ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Locked Withdrawn</span>
                                <span className={styles.detailValue}>
                                    {formatNumber(allocationData.claimDetails?.lockedWithdrawn ?? 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <span className={styles.disclaimer}>
                        * There is a 48-hour cooling off period when you stake, so the information displayed may be inaccurate during this time.
                    </span>
                </div>
            )}
        </div>
    );
};

export default SkrPage;
