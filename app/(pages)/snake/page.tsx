"use client"

import React, { useEffect, useState } from 'react'
import styles from './page.module.css'
import Image from 'next/image'
import Link from 'next/link'
import Backbutton from 'app/(components)/shared/Backbutton'
import { useWalletContext } from 'app/(utils)/context/walletProvider'
import { useAccount, useConnector } from '@solana/connector/react'

const PRIZE_WALLET = "snkTEcbUVW5EURccMjBo1YDfW8M8uDZ4b8Li9yeNXsq";
const TRACKER_MINT = "ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS";
const DEFAULT_REQUIRED_TRACKER = 1_000_000;

type LeaderboardEntry = {
    wallet: string;
    username: string | null;
    skrId: string | null;
    high_score: number;
    total_plays: number;
    total_score: number;
    trackerBalance?: number;
    eligible?: boolean;
};

const SnakePage = () => {
    const [prizePool, setPrizePool] = useState<{ trackerBalance: number; solBalance: number } | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [gameStats, setGameStats] = useState<{ totalPlayers: number; totalGames: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
    const [trackerPrice, setTrackerPrice] = useState<number | null>(null);
    const [requiredTracker, setRequiredTracker] = useState<number>(DEFAULT_REQUIRED_TRACKER);

    const { trackerBalance, isLoadingBalance, openWalletModal } = useWalletContext();
    const { connected } = useConnector();
    const { address } = useAccount();

    useEffect(() => {
        async function fetchPrizePool() {
            try {
                const res = await fetch('/api/snake/prize');
                const data = await res.json();
                setPrizePool(data);
            } catch (err) {
                console.error('Failed to fetch prize pool:', err);
            } finally {
                setLoading(false);
            }
        }

        async function fetchLeaderboard() {
            try {
                const res = await fetch('/api/snake/leaderboard');
                const data = await res.json();
                if (res.status === 401) {
                    setLeaderboardError('Leaderboard temporarily unavailable');
                    return;
                }
                if (data.success) {
                    setLeaderboard(data.leaderboard);
                    setGameStats(data.stats);
                    if (data.minRewardTracker) {
                        setRequiredTracker(Number(data.minRewardTracker));
                    }
                    setLeaderboardError(null);
                } else {
                    setLeaderboardError('Failed to load leaderboard');
                }
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
                setLeaderboardError('Failed to load leaderboard');
            } finally {
                setLeaderboardLoading(false);
            }
        }

        async function fetchConfig() {
            try {
                const res = await fetch('/api/snake/config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.config?.min_tracker_balance) {
                        setRequiredTracker(Number(data.config.min_tracker_balance));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch game config:', err);
            }
        }

        async function fetchTrackerPrice() {
            try {
                const res = await fetch(
                    `https://api.dexscreener.com/latest/dex/tokens/${TRACKER_MINT}`
                );
                if (res.ok) {
                    const data = await res.json();
                    const price = data?.pairs?.[0]?.priceUsd
                        ? parseFloat(data.pairs[0].priceUsd)
                        : null;
                    setTrackerPrice(price);
                }
            } catch (err) {
                console.error('Failed to fetch TRACKER price:', err);
            }
        }

        fetchPrizePool();
        fetchLeaderboard();
        fetchTrackerPrice();
        fetchConfig();

        const prizePoolInterval = setInterval(fetchPrizePool, 20000);
        const priceInterval = setInterval(fetchTrackerPrice, 60000);
        const lbInterval = setInterval(fetchLeaderboard, 60000);

        return () => {
            clearInterval(prizePoolInterval);
            clearInterval(priceInterval);
            clearInterval(lbInterval);
        };
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
        return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    const truncateWallet = (wallet: string) => {
        return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
    };

    const userEligible = trackerBalance >= requiredTracker;

    return (
        <div className={styles.main}>
            <Backbutton />

            {/* Hero Section */}
            <div className={styles.hero}>
                <Image
                    src="/snake/icon.png"
                    alt="Snake Game"
                    width={120}
                    height={120}
                    className={styles.appIcon}
                />
                <h1 className={styles.title}>SNAKE</h1>
                <p className={styles.subtitle}>for Solana Seeker</p>
                <p className={styles.tagline}>The classic 1997-inspired snake game with global leaderboard</p>
                <p className={styles.rewardRequirement}>
                    Requires a minimum of <strong>1,000,000 TRACKER</strong> to earn rewards
                </p>
            </div>

            {/* Connected wallet TRACKER balance */}
            <div className={styles.userBalanceCard}>
                <span className={styles.userBalanceLabel}>Your TRACKER balance</span>
                {connected && address ? (
                    <>
                        <span className={styles.userBalanceAmount}>
                            {isLoadingBalance ? '…' : formatNumber(trackerBalance)}{' '}
                            <span className={styles.userBalanceUnit}>TRACKER</span>
                        </span>
                        <span
                            className={
                                userEligible ? styles.userEligible : styles.userIneligible
                            }
                        >
                            {userEligible
                                ? '✓ Eligible for rewards'
                                : `Need ${formatNumber(Math.max(0, requiredTracker - trackerBalance))} more for rewards`}
                        </span>
                        <span className={styles.userWallet}>{truncateWallet(address)}</span>
                    </>
                ) : (
                    <>
                        <span className={styles.userBalanceHint}>
                            Connect wallet to see your balance & reward eligibility
                        </span>
                        <button
                            type="button"
                            className={styles.connectBtn}
                            onClick={openWalletModal}
                        >
                            Connect wallet
                        </button>
                    </>
                )}
            </div>

            {/* Prize Pool */}
            <div className={styles.prizePool}>
                <span className={styles.prizeLabel}>Prize Pool</span>
                <div className={styles.prizeAmount}>
                    {loading ? (
                        <span className={styles.loading}>Loading...</span>
                    ) : (
                        <>
                            <span className={styles.trackerAmount}>
                                {formatNumber(prizePool?.trackerBalance || 0)} TRACKER
                            </span>
                            {prizePool?.solBalance ? (
                                <span className={styles.solAmount}>
                                    + {prizePool.solBalance.toFixed(4)} SOL
                                </span>
                            ) : null}
                        </>
                    )}
                </div>
                <Link
                    href={`https://solscan.io/account/${PRIZE_WALLET}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.walletLink}
                >
                    View Prize Wallet
                </Link>
            </div>

            {/* Eligibility */}
            <div className={styles.eligibility}>
                <span className={styles.eligibilityIcon}>🎫</span>
                <span className={styles.eligibilityTitle}>Reward Requirement</span>
                <span className={styles.eligibilityDesc}>
                    Hold at least <strong>{requiredTracker.toLocaleString()} TRACKER</strong> (1 million minimum) to earn in-game rewards
                    {trackerPrice !== null && (
                        <span className={styles.eligibilityUsd}>
                            {' '}(≈ ${(requiredTracker * trackerPrice).toFixed(2)} USD)
                        </span>
                    )}
                </span>
            </div>

            {/* Leaderboard */}
            <div className={styles.leaderboardSection}>
                <h2 className={styles.sectionTitle}>Leaderboard</h2>
                {gameStats && (
                    <div className={styles.gameStats}>
                        <span>{gameStats.totalPlayers} Players</span>
                        <span>•</span>
                        <span>{gameStats.totalGames} Games Played</span>
                    </div>
                )}
                {leaderboardLoading ? (
                    <div className={styles.leaderboardLoading}>Loading leaderboard...</div>
                ) : leaderboardError ? (
                    <div className={styles.noScores}>{leaderboardError}</div>
                ) : leaderboard.length > 0 ? (
                    <div className={styles.leaderboard}>
                        <div className={styles.leaderboardHeader}>
                            <span className={styles.rank}>#</span>
                            <span className={styles.player}>Player</span>
                            <span className={styles.trackerCol}>TRACKER</span>
                            <span className={styles.score}>High Score</span>
                            <span className={styles.plays}>Games</span>
                        </div>
                        {leaderboard.map((entry, index) => {
                            const bal = entry.trackerBalance ?? 0;
                            const ok = entry.eligible ?? bal >= requiredTracker;
                            return (
                                <div
                                    key={entry.wallet}
                                    className={`${styles.leaderboardRow} ${
                                        ok ? styles.rowEligible : styles.rowIneligible
                                    }`}
                                >
                                    <span className={styles.rank}>
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                    </span>
                                    <span className={styles.player}>
                                        {entry.skrId && (
                                            <span className={styles.skrId}>{entry.skrId}.skr</span>
                                        )}
                                        <Link
                                            href={`https://solscan.io/account/${entry.wallet}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.playerLink}
                                        >
                                            {truncateWallet(entry.wallet)}
                                        </Link>
                                    </span>
                                    <span
                                        className={`${styles.trackerCol} ${
                                            ok ? styles.trackerOk : styles.trackerLow
                                        }`}
                                        title={
                                            ok
                                                ? 'Eligible for rewards (≥1M TRACKER)'
                                                : 'Below 1M TRACKER — not eligible for rewards'
                                        }
                                    >
                                        {formatNumber(bal)}
                                        <span className={styles.eligDot}>{ok ? '✓' : '·'}</span>
                                    </span>
                                    <span className={styles.score}>{entry.high_score}</span>
                                    <span className={styles.plays}>{entry.total_plays}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.noScores}>No scores yet. Be the first to play!</div>
                )}
                <p className={styles.lbNote}>
                    ✓ = holds ≥ {requiredTracker.toLocaleString()} TRACKER (reward eligible)
                </p>
            </div>

            {/* Features */}
            <div className={styles.features}>
                <div className={styles.feature}>
                    <span className={styles.featureIcon}>🎮</span>
                    <span className={styles.featureTitle}>Classic Gameplay</span>
                    <span className={styles.featureDesc}>Swipe to control your snake and eat to grow</span>
                </div>
                <div className={styles.feature}>
                    <span className={styles.featureIcon}>🏆</span>
                    <span className={styles.featureTitle}>Global Leaderboard</span>
                    <span className={styles.featureDesc}>Connect wallet to save your high scores</span>
                </div>
                <div className={styles.feature}>
                    <span className={styles.featureIcon}>📱</span>
                    <span className={styles.featureTitle}>Built for Seeker</span>
                    <span className={styles.featureDesc}>Optimized for Solana Mobile Seeker device</span>
                </div>
            </div>

            {/* Screenshots */}
            <div className={styles.screenshotsSection}>
                <h2 className={styles.sectionTitle}>Screenshots</h2>
                <div className={styles.screenshots}>
                    <div className={styles.screenshotWrapper}>
                        <Image
                            src="/snake/screenshot-home.jpg"
                            alt="Snake Home Screen"
                            width={280}
                            height={560}
                            className={styles.screenshot}
                        />
                    </div>
                    <div className={styles.screenshotWrapper}>
                        <Image
                            src="/snake/screenshot-gameplay.jpg"
                            alt="Snake Gameplay"
                            width={280}
                            height={560}
                            className={styles.screenshot}
                        />
                    </div>
                    <div className={styles.screenshotWrapper}>
                        <Image
                            src="/snake/screenshot-leaderboard.jpg"
                            alt="Snake Leaderboard"
                            width={280}
                            height={560}
                            className={styles.screenshot}
                        />
                    </div>
                    <div className={styles.screenshotWrapper}>
                        <Image
                            src="/snake/screenshot-gameover.jpg"
                            alt="Snake Game Over"
                            width={280}
                            height={560}
                            className={styles.screenshot}
                        />
                    </div>
                </div>
            </div>

            {/* Banner */}
            <div className={styles.bannerSection}>
                <Image
                    src="/snake/banner.png"
                    alt="Snake Banner"
                    width={1024}
                    height={500}
                    className={styles.banner}
                />
            </div>

            {/* Download */}
            <div className={styles.downloadSection}>
                <Link
                    href="snakeseeker://"
                    className={styles.downloadButton}
                >
                    Open in App
                </Link>
                <Link
                    href="https://arweave.net/H9PSe13l-zFtQdsW9IEFBzjrJywIH5xiYadPtf1PWlA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.secondaryButton}
                >
                    Download APK
                </Link>
                <span className={styles.downloadNote}>Android only - Sideload on your Seeker device</span>
            </div>

            {/* CTA */}
            <div className={styles.cta}>
                <span className={styles.ctaLabel}>Coming Soon to Seeker dApp Store</span>
                <span className={styles.ctaHighlight}>Instant Airdrop for Players</span>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <span>Powered by Solana</span>
            </div>
        </div>
    )
}

export default SnakePage
