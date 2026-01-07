import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Get DApp - Seeker Tracker",
    description: "Access Seeker Tracker DApp and start tracking your SeekerID domains",
};

export default function GetDappPage() {
    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href={"/"}>
                    ← Back to Tracker
                </Link>
            </div>
            <div className={styles.container}>
                <h1 className={styles.title}>Get Started with Seeker Tracker</h1>
                <div className={styles.content}>
                    <section className={styles.hero}>
                        <Image
                            src="/icons/bags-icon.png"
                            alt="Seeker Tracker"
                            width={80}
                            height={80}
                            className={styles.logo}
                        />
                        <p className={styles.description}>
                            Track and manage your .skr SeekerID domains on the Solana blockchain
                        </p>
                    </section>

                    <section className={styles.downloadSection}>
                        <h2>Download Mobile App</h2>
                        <p>Get the Seeker Tracker Android application</p>
                        <Link href="/seekertracker.apk" download className={styles.downloadBadge}>
                            <Image
                                src="/sds-badge.svg"
                                alt="Get it on Solana dApp Store"
                                width={232}
                                height={91}
                            />
                        </Link>
                    </section>

                    <section className={styles.feature}>
                        <h2>Web Application</h2>
                        <p>
                            Seeker Tracker is a web-based dApp accessible directly from your browser.
                            No installation required!
                        </p>
                        <Link href="/" className={styles.ctaButton}>
                            Launch App →
                        </Link>
                    </section>

                    <section className={styles.feature}>
                        <h2>How to Use</h2>
                        <div className={styles.steps}>
                            <div className={styles.step}>
                                <span className={styles.stepNumber}>1</span>
                                <div>
                                    <h3>Connect Your Wallet</h3>
                                    <p>Connect your Solana wallet (Phantom, Backpack, or any Solana-compatible wallet)</p>
                                </div>
                            </div>
                            <div className={styles.step}>
                                <span className={styles.stepNumber}>2</span>
                                <div>
                                    <h3>Search Domains</h3>
                                    <p>Search for any .skr SeekerID domain to view holder information and stats</p>
                                </div>
                            </div>
                            <div className={styles.step}>
                                <span className={styles.stepNumber}>3</span>
                                <div>
                                    <h3>Track Holdings</h3>
                                    <p>View your owned domains and monitor the Seeker ecosystem</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={styles.feature}>
                        <h2>Features</h2>
                        <ul className={styles.featureList}>
                            <li>🔍 Search and track .skr SeekerID domains</li>
                            <li>💼 View domain holder information</li>
                            <li>📊 Real-time blockchain data via Helius RPC</li>
                            <li>💰 Seeker Fund tracking and analytics</li>
                            <li>📥 Export domain holder lists to CSV</li>
                            <li>🔗 Integration with Bags.fm platform</li>
                        </ul>
                    </section>

                    <section className={styles.feature}>
                        <h2>Requirements</h2>
                        <ul className={styles.requirements}>
                            <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                            <li>Solana wallet extension (Phantom, Backpack, etc.)</li>
                            <li>Internet connection</li>
                        </ul>
                    </section>

                    <section className={styles.feature}>
                        <h2>Links & Resources</h2>
                        <div className={styles.links}>
                            <Link href="/" className={styles.link}>
                                🏠 Home
                            </Link>
                            <Link href="/seeker-fund" className={styles.link}>
                                💰 Seeker Fund
                            </Link>
                            <Link href="/export" className={styles.link}>
                                📥 Export Data
                            </Link>
                            <Link href="https://twitter.com/Seeker_Tracker" target="_blank" rel="noopener noreferrer" className={styles.link}>
                                🐦 Twitter
                            </Link>
                            <Link href="https://bags.fm" target="_blank" rel="noopener noreferrer" className={styles.link}>
                                🎒 Bags.fm
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
