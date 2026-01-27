"use client"

import React from 'react'
import styles from './page.module.css'
import Image from 'next/image'
import Backbutton from 'app/(components)/shared/Backbutton'

const SnakePage = () => {
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
                <p className={styles.tagline}>Classic snake game with on-chain leaderboards</p>
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
                <a
                    href="https://github.com/nicholasoxford/solana-snake"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ctaButton}
                >
                    View on GitHub
                </a>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <span>Powered by Solana</span>
            </div>
        </div>
    )
}

export default SnakePage
