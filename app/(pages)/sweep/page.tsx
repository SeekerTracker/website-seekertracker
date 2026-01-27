"use client"

import React, { useEffect, useState } from 'react'
import styles from './page.module.css'
import Link from 'next/link'
import Image from 'next/image'
import Backbutton from 'app/(components)/shared/Backbutton'

type Contestant = {
    wallet: string;
    balance: number;
    eligible: boolean;
};

const Sweep = () => {
    const [contestants, setContestants] = useState<Contestant[]>([]);
    const [stats, setStats] = useState<{ totalEligible: number; totalBalance: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchContestants() {
            try {
                const res = await fetch('/api/sweep/contestants');
                const data = await res.json();
                if (data.success) {
                    setContestants(data.contestants);
                    setStats(data.stats);
                }
            } catch (err) {
                console.error('Failed to fetch contestants:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchContestants();
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    const truncateWallet = (wallet: string) => {
        return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
    };

    return (
        <div className={styles.main}>
            <Backbutton />
            <div className={styles.topBar}>
                <span className={styles.header}>
                    <Image src="/icons/bags-icon.png" alt="Sweep" width={36} height={36} />
                    &nbsp;Seeker Tracker Sweep
                </span>
                <span className={styles.tokenDesc}>10% of fees rewarded to $TRACKER holders</span>
            </div>

            <div className={styles.infoCards}>
                <div className={styles.infoCard}>
                    <span className={styles.cardIcon}>💰</span>
                    <span className={styles.cardTitle}>Fee Distribution</span>
                    <span className={styles.cardValue}>10%</span>
                    <span className={styles.cardDesc}>Of all fees distributed to eligible $TRACKER holders</span>
                </div>

                <div className={styles.infoCard}>
                    <span className={styles.cardIcon}>📊</span>
                    <span className={styles.cardTitle}>Minimum Hold</span>
                    <span className={styles.cardValue}>1,000,000</span>
                    <span className={styles.cardDesc}>Minimum $TRACKER tokens required to participate</span>
                </div>

                <div className={styles.infoCard}>
                    <span className={styles.cardIcon}>🎯</span>
                    <span className={styles.cardTitle}>Maximum Hold</span>
                    <span className={styles.cardValue}>20,000,000</span>
                    <span className={styles.cardDesc}>Maximum $TRACKER tokens counted for rewards</span>
                </div>

                <div className={styles.infoCard}>
                    <span className={styles.cardIcon}>⚡</span>
                    <span className={styles.cardTitle}>Minimum Reward</span>
                    <span className={styles.cardValue}>0.01 SOL</span>
                    <span className={styles.cardDesc}>Minimum reward required to receive payout</span>
                </div>
            </div>

            {/* Contestants Section */}
            <div className={styles.contestantsSection}>
                <span className={styles.sectionTitle}>Hourly Sweepstakes Contestants</span>
                {stats && (
                    <div className={styles.contestantStats}>
                        <span>{stats.totalEligible} Eligible Wallets</span>
                        <span>•</span>
                        <span>{formatNumber(stats.totalBalance)} TRACKER Total</span>
                    </div>
                )}
                {loading ? (
                    <div className={styles.loadingContestants}>Loading contestants...</div>
                ) : contestants.length > 0 ? (
                    <div className={styles.contestantsList}>
                        <div className={styles.contestantHeader}>
                            <span className={styles.contestantRank}>#</span>
                            <span className={styles.contestantWallet}>Wallet</span>
                            <span className={styles.contestantBalance}>Balance</span>
                            <span className={styles.contestantStatus}>Status</span>
                        </div>
                        {contestants.map((contestant, index) => (
                            <div key={contestant.wallet} className={styles.contestantRow}>
                                <span className={styles.contestantRank}>{index + 1}</span>
                                <span className={styles.contestantWallet}>
                                    <Link
                                        href={`https://solscan.io/account/${contestant.wallet}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.walletLink}
                                    >
                                        {truncateWallet(contestant.wallet)}
                                    </Link>
                                </span>
                                <span className={styles.contestantBalance}>
                                    {formatNumber(contestant.balance)}
                                </span>
                                <span className={styles.contestantStatus}>
                                    <span className={styles.eligibleBadge}>Eligible</span>
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.noContestants}>No eligible contestants found</div>
                )}
            </div>

            <div className={styles.howItWorks}>
                <span className={styles.sectionTitle}>How It Works</span>
                <div className={styles.steps}>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>1</span>
                        <span className={styles.stepTitle}>Hold $TRACKER</span>
                        <span className={styles.stepDesc}>Hold between 1M and 20M $TRACKER tokens in your wallet</span>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>2</span>
                        <span className={styles.stepTitle}>Fees Accumulate</span>
                        <span className={styles.stepDesc}>10% of all platform fees are set aside for the sweep</span>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>3</span>
                        <span className={styles.stepTitle}>Get Rewarded</span>
                        <span className={styles.stepDesc}>Rewards distributed proportionally to eligible holders</span>
                    </div>
                </div>
            </div>

            <div className={styles.announcements}>
                <span className={styles.announcementIcon}>📢</span>
                <span className={styles.announcementText}>Winners announced hourly in our Telegram channel</span>
                <Link href="https://t.me/seeker_tracker" target="_blank" rel="noopener noreferrer" className={styles.telegramButton}>
                    Join Telegram
                </Link>
            </div>

            <div className={styles.eligibility}>
                <span className={styles.sectionTitle}>Eligibility Requirements</span>
                <div className={styles.requirements}>
                    <div className={styles.requirement}>
                        <span className={styles.checkmark}>✓</span>
                        <span>Hold minimum 1,000,000 $TRACKER tokens</span>
                    </div>
                    <div className={styles.requirement}>
                        <span className={styles.checkmark}>✓</span>
                        <span>Maximum 20,000,000 $TRACKER counted per wallet</span>
                    </div>
                    <div className={styles.requirement}>
                        <span className={styles.checkmark}>✓</span>
                        <span>Minimum reward of 0.01 SOL required for payout</span>
                    </div>
                    <div className={styles.requirement}>
                        <span className={styles.checkmark}>✓</span>
                        <span>Tokens must be held in a non-custodial wallet</span>
                    </div>
                </div>
            </div>

            <span className={styles.disclaimer}>* subject to changes</span>
        </div>
    )
}

export default Sweep
