"use client"

import React from 'react'
import styles from './page.module.css'
import Link from 'next/link'
import Image from 'next/image'

const Sweep = () => {
    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href={"/"}>
                    ← Back to Tracker
                </Link>
            </div>
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
                <Link href="https://t.me/seekertracker" target="_blank" rel="noopener noreferrer" className={styles.telegramButton}>
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
