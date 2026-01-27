"use client"

import React, { useEffect, useState } from 'react'
import styles from './page.module.css'
import Image from 'next/image'
import Link from 'next/link'
import Backbutton from 'app/(components)/shared/Backbutton'

const PRIZE_WALLET = "snkTEcbUVW5EURccMjBo1YDfW8M8uDZ4b8Li9yeNXsq";
const REQUIRED_TRACKER = 100_000;

const SnakePage = () => {
    const [prizePool, setPrizePool] = useState<{ trackerBalance: number; solBalance: number } | null>(null);
    const [loading, setLoading] = useState(true);

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
        fetchPrizePool();
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
        return num.toLocaleString();
    };

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
                <p className={styles.tagline}>The classic 1997-inspired snake game with on-chain leaderboards</p>
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
                <span className={styles.eligibilityTitle}>Eligibility Requirement</span>
                <span className={styles.eligibilityDesc}>
                    Hold <strong>{REQUIRED_TRACKER.toLocaleString()} TRACKER</strong> tokens to be eligible for rewards
                </span>
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
                    <span className={styles.featureTitle}>On-Chain Leaderboard</span>
                    <span className={styles.featureDesc}>Connect wallet to save your high scores on Solana</span>
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
