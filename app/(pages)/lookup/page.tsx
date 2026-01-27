"use client";

import React, { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import Backbutton from 'app/(components)/shared/Backbutton';

type DomainResult = {
    subdomain: string;
    domain: string;
    createdAt: string;
    rank: string;
};

type LookupResponse = {
    success: boolean;
    wallet: string;
    domains: DomainResult[];
    count: number;
    error?: string;
};

const LookupPage = () => {
    const [wallet, setWallet] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LookupResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLookup = async () => {
        if (!wallet.trim()) {
            setError('Please enter a wallet address');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/api/lookup?wallet=${encodeURIComponent(wallet.trim())}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Lookup failed');
                return;
            }

            setResult(data);
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLookup();
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.main}>
            <Backbutton />

            <div className={styles.hero}>
                <h1 className={styles.title}>SKR Lookup</h1>
                <p className={styles.subtitle}>Find .skr domains by wallet address</p>
            </div>

            <div className={styles.searchSection}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Enter Solana wallet address..."
                        value={wallet}
                        onChange={(e) => setWallet(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={styles.input}
                    />
                    <button
                        onClick={handleLookup}
                        disabled={loading}
                        className={styles.button}
                    >
                        {loading ? 'Searching...' : 'Lookup'}
                    </button>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {result && (
                <div className={styles.results}>
                    <div className={styles.resultHeader}>
                        <span className={styles.walletLabel}>Wallet:</span>
                        <Link
                            href={`https://solscan.io/account/${result.wallet}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.walletLink}
                        >
                            {result.wallet.slice(0, 8)}...{result.wallet.slice(-8)}
                        </Link>
                    </div>

                    {result.count === 0 ? (
                        <div className={styles.noResults}>
                            <span className={styles.noResultsIcon}>🔍</span>
                            <p>No .skr domains found for this wallet</p>
                            <p className={styles.noResultsHint}>
                                .skr domains are exclusive to Solana Mobile device owners
                            </p>
                            <div className={styles.altOptions}>
                                <Link
                                    href="https://store.solanamobile.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.registerLink}
                                >
                                    Get Solana Mobile
                                </Link>
                                <span className={styles.orText}>or register other domains</span>
                                <div className={styles.altDomains}>
                                    <Link href="https://www.sns.id/?affiliateRef=metasal" target="_blank" rel="noopener noreferrer">.sol</Link>
                                    <Link href="https://alldomains.id/?ref=hmKOC9" target="_blank" rel="noopener noreferrer">.bonk</Link>
                                    <Link href="https://alldomains.id/?ref=hmKOC9" target="_blank" rel="noopener noreferrer">.anon</Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.countBadge}>
                                {result.count} domain{result.count > 1 ? 's' : ''} found
                            </div>
                            <div className={styles.domainList}>
                                {result.domains.map((domain, index) => (
                                    <div key={index} className={styles.domainCard}>
                                        <div className={styles.domainName}>
                                            <Link
                                                href={`/id/${domain.subdomain}`}
                                                className={styles.domainLink}
                                            >
                                                {domain.subdomain}.skr
                                            </Link>
                                        </div>
                                        <div className={styles.domainMeta}>
                                            <span className={styles.rank}>#{domain.rank}</span>
                                            <span className={styles.date}>{formatDate(domain.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className={styles.info}>
                <p>Enter any Solana wallet address to find associated .skr domains.</p>
            </div>
        </div>
    );
};

export default LookupPage;
