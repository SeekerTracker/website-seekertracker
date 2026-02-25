import React from 'react'
import styles from './page.module.css'
import Image from 'next/image'
import Link from 'next/link'
import Backbutton from 'app/(components)/shared/Backbutton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Tracker Whale Chat | Seeker Tracker',
    description: 'Join the exclusive Tracker Whale Telegram group. Hold 10M TRACKER and verify on gated.fun to get access.',
    openGraph: {
        title: 'Tracker Whale Chat | Seeker Tracker',
        description: 'Exclusive Telegram group for TRACKER whales. Requires 10M TRACKER.',
        url: 'https://seekertracker.com/whales',
    },
}

const GATED_FUN_URL = 'https://gated.fun'
const TELEGRAM_INVITE = 'https://t.me/+soucwemjeOc5ZTQ1'
const TRACKER_MINT = 'ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS'
const JUPITER_BUY_URL = `https://jup.ag/swap/SOL-${TRACKER_MINT}?ref=yfgv2ibxy07v`
const REQUIRED_TRACKER = '10,000,000'

const STEPS = [
    {
        number: '01',
        title: 'Go to gated.fun',
        description: 'Open gated.fun — a token-gating platform built on Solana.',
        link: GATED_FUN_URL,
        linkLabel: 'Open gated.fun →',
    },
    {
        number: '02',
        title: 'Login & verify your wallet',
        description: 'Connect your Solana wallet and complete identity verification on the platform.',
        link: null,
        linkLabel: null,
    },
    {
        number: '03',
        title: `Hold ${REQUIRED_TRACKER} TRACKER`,
        description: 'Your wallet must hold at least 10 million TRACKER tokens to qualify.',
        link: JUPITER_BUY_URL,
        linkLabel: 'Buy TRACKER on Jupiter →',
    },
    {
        number: '04',
        title: 'Join the Telegram',
        description: 'Once verified, tap the button below to enter the private Tracker Whale group.',
        link: null,
        linkLabel: null,
    },
]

export default function WhalesPage() {
    return (
        <main className={styles.main}>
            <div className={styles.backRow}>
                <Backbutton />
            </div>

            {/* Hero */}
            <div className={styles.hero}>
                <Image
                    src="/tracker-whale.png"
                    alt="Tracker Whale"
                    width={160}
                    height={160}
                    className={styles.whaleLogo}
                    priority
                />
                <h1 className={styles.title}>TRACKER WHALES</h1>
                <p className={styles.subtitle}>Private Telegram Group</p>
                <div className={styles.requirementBadge}>
                    <span className={styles.requirementText}>
                        🐋 Requires {REQUIRED_TRACKER} TRACKER
                    </span>
                </div>
            </div>

            {/* Description */}
            <div className={styles.descriptionCard}>
                <p className={styles.descriptionText}>
                    An exclusive community for serious TRACKER holders. Get alpha,
                    strategy discussions, and early announcements — all token-gated
                    via gated.fun.
                </p>
            </div>

            {/* Steps */}
            <div className={styles.stepsSection}>
                <h2 className={styles.sectionLabel}>HOW TO JOIN</h2>
                <div className={styles.stepsContainer}>
                    {STEPS.map((step, index) => (
                        <div key={step.number} className={styles.stepRow}>
                            <div className={styles.stepLeft}>
                                <div className={styles.stepNumber}>{step.number}</div>
                                {index < STEPS.length - 1 && (
                                    <div className={styles.stepLine} />
                                )}
                            </div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDescription}>{step.description}</p>
                                {step.link && (
                                    <Link
                                        href={step.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.stepLink}
                                    >
                                        {step.linkLabel}
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTAs */}
            <div className={styles.ctaSection}>
                <Link
                    href={GATED_FUN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.primaryButton}
                >
                    🔑 Verify on gated.fun
                </Link>
                <Link
                    href={TELEGRAM_INVITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.telegramButton}
                >
                    ✈️ Join Whale Chat
                </Link>
            </div>

            {/* Footer note */}
            <div className={styles.footerNote}>
                <p className={styles.footerText}>Don&apos;t have enough TRACKER?</p>
                <Link
                    href={JUPITER_BUY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.jupiterLink}
                >
                    Buy TRACKER on Jupiter →
                </Link>
            </div>
        </main>
    )
}
