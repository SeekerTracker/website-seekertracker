"use client"

import React, { useState } from 'react'
import styles from './page.module.css'
import Backbutton from 'app/(components)/shared/Backbutton'
import Link from 'next/link'

type Segment = {
    label: string;
    value: number;
    color: string;
    description: string;
    token?: string;
    address?: string;
};

const segments: Segment[] = [
    { label: 'Treasury', value: 60, color: '#00ffd9', description: 'Funds for development, operations, and growth', token: 'SOL', address: '3ZvuZbCn4CYYNorGVMbzPbsUamckFmzhmhXWu9WcFb8P' },
    { label: 'Staking Rewards', value: 10, color: '#ff6b6b', description: 'Rewards distributed to $TRACKER stakers', token: 'TRACKER', address: '86CeBUE4vRbxWpwr4U1QcC7tLoF7z6u8RTvxpgtDaPqk' },
    { label: 'Snake Rewards', value: 10, color: '#ffd700', description: 'Prize pool for Snake game players', token: 'TRACKER', address: 'snkTEcbUVW5EURccMjBo1YDfW8M8uDZ4b8Li9yeNXsq' },
    { label: 'Sweepstakes', value: 10, color: '#9945ff', description: 'Hourly rewards for eligible $TRACKER holders', token: 'SOL', address: 'rwdkZmr8wDN2b2dNLnaTCkTThUBzRdMJJCqtqgbvMug' },
    { label: 'SKR Buyback', value: 10, color: '#ff9d00', description: '$SKR buyback mechanism with proceeds going to treasury', token: 'SKR', address: 'SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3' },
];

const PieChart = ({ segments, activeSegment, setActiveSegment }: {
    segments: Segment[];
    activeSegment: number | null;
    setActiveSegment: (index: number | null) => void;
}) => {
    const size = 300;
    const center = size / 2;
    const radius = 120;
    const hoverRadius = 130;

    let currentAngle = -90;

    const createArcPath = (startAngle: number, endAngle: number, r: number) => {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = center + r * Math.cos(startRad);
        const y1 = center + r * Math.sin(startRad);
        const x2 = center + r * Math.cos(endRad);
        const y2 = center + r * Math.sin(endRad);

        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

        return `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    return (
        <svg width={size} height={size} className={styles.pieChart}>
            {segments.map((segment, index) => {
                const angle = (segment.value / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                currentAngle = endAngle;

                const isActive = activeSegment === index;
                const r = isActive ? hoverRadius : radius;

                return (
                    <path
                        key={segment.label}
                        d={createArcPath(startAngle, endAngle, r)}
                        fill={segment.color}
                        opacity={activeSegment === null || isActive ? 1 : 0.4}
                        className={styles.pieSegment}
                        onMouseEnter={() => setActiveSegment(index)}
                        onMouseLeave={() => setActiveSegment(null)}
                        style={{
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            filter: isActive ? `drop-shadow(0 0 10px ${segment.color})` : 'none',
                        }}
                    />
                );
            })}
            <circle cx={center} cy={center} r={50} fill="#111" />
            <text
                x={center}
                y={center - 8}
                textAnchor="middle"
                fill="#fff"
                fontSize="12"
                fontWeight="600"
            >
                Revenue
            </text>
            <text
                x={center}
                y={center + 12}
                textAnchor="middle"
                fill="#00ffd9"
                fontSize="14"
                fontWeight="700"
            >
                1% of Volume
            </text>
        </svg>
    );
};

const WhitepaperPage = () => {
    const [activeSegment, setActiveSegment] = useState<number | null>(null);

    return (
        <div className={styles.main}>
            <Backbutton />

            {/* Hero Section */}
            <div className={styles.hero}>
                <h1 className={styles.title}>WHITEPAPER</h1>
                <p className={styles.subtitle}>Seeker Tracker Tokenomics</p>
                <p className={styles.tagline}>Understanding how $TRACKER revenue is distributed</p>
            </div>

            {/* Revenue Model */}
            <div className={styles.revenueSection}>
                <h2 className={styles.sectionTitle}>Revenue Model</h2>
                <div className={styles.revenueHighlight}>
                    <span className={styles.revenuePercent}>1%</span>
                    <span className={styles.revenueLabel}>of all token trading volume</span>
                </div>
                <p className={styles.revenueDesc}>
                    The Seeker Tracker protocol collects 1% of all $TRACKER token trading volume as revenue.
                    This fee is automatically collected on every trade and distributed according to the allocation below.
                </p>
            </div>

            {/* Pie Chart Section */}
            <div className={styles.chartSection}>
                <h2 className={styles.sectionTitle}>Revenue Distribution</h2>
                <div className={styles.chartContainer}>
                    <PieChart
                        segments={segments}
                        activeSegment={activeSegment}
                        setActiveSegment={setActiveSegment}
                    />
                    <div className={styles.legend}>
                        {segments.map((segment, index) => (
                            <div
                                key={segment.label}
                                className={`${styles.legendItem} ${activeSegment === index ? styles.legendItemActive : ''}`}
                                onMouseEnter={() => setActiveSegment(index)}
                                onMouseLeave={() => setActiveSegment(null)}
                            >
                                <span
                                    className={styles.legendColor}
                                    style={{ backgroundColor: segment.color }}
                                />
                                <div className={styles.legendText}>
                                    <span className={styles.legendLabel}>{segment.label}</span>
                                    <span className={styles.legendValue}>{segment.value}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {activeSegment !== null && (
                    <div className={styles.segmentDetail}>
                        <span className={styles.detailLabel} style={{ color: segments[activeSegment].color }}>
                            {segments[activeSegment].label}
                        </span>
                        <span className={styles.detailDesc}>{segments[activeSegment].description}</span>
                    </div>
                )}
            </div>

            {/* Breakdown Cards */}
            <div className={styles.breakdownSection}>
                <h2 className={styles.sectionTitle}>Allocation Breakdown</h2>
                <div className={styles.breakdownCards}>
                    <div className={styles.breakdownCard} style={{ borderColor: '#00ffd9' }}>
                        <span className={styles.breakdownIcon}>🏦</span>
                        <span className={styles.breakdownTitle}>Treasury</span>
                        <span className={styles.breakdownPercent} style={{ color: '#00ffd9' }}>60%</span>
                        <span className={styles.breakdownDesc}>
                            Funds allocated for protocol development, operational costs, marketing, partnerships, and future growth initiatives.
                        </span>
                        <span className={styles.tokenLabel}>Received in SOL</span>
                        <Link href="https://orbmarkets.io/address/3ZvuZbCn4CYYNorGVMbzPbsUamckFmzhmhXWu9WcFb8P/history?hideSpam=true" target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                            View Address
                        </Link>
                    </div>

                    <div className={styles.breakdownCard} style={{ borderColor: '#ff6b6b' }}>
                        <span className={styles.breakdownIcon}>💎</span>
                        <span className={styles.breakdownTitle}>Staking Rewards</span>
                        <span className={styles.breakdownPercent} style={{ color: '#ff6b6b' }}>10%</span>
                        <span className={styles.breakdownDesc}>
                            Distributed to users who stake their $TRACKER tokens, incentivizing long-term holding and protocol participation.
                        </span>
                        <span className={styles.tokenLabel}>Paid in TRACKER</span>
                        <Link href="https://orbmarkets.io/address/86CeBUE4vRbxWpwr4U1QcC7tLoF7z6u8RTvxpgtDaPqk/history?hideSpam=true" target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                            View Address
                        </Link>
                    </div>

                    <div className={styles.breakdownCard} style={{ borderColor: '#ffd700' }}>
                        <span className={styles.breakdownIcon}>🐍</span>
                        <span className={styles.breakdownTitle}>Snake Rewards</span>
                        <span className={styles.breakdownPercent} style={{ color: '#ffd700' }}>10%</span>
                        <span className={styles.breakdownDesc}>
                            Prize pool for the Snake game on Solana Seeker. Top players compete for rewards while holding $TRACKER tokens.
                        </span>
                        <span className={styles.tokenLabel}>Paid in TRACKER</span>
                        <Link href="https://orbmarkets.io/address/snkTEcbUVW5EURccMjBo1YDfW8M8uDZ4b8Li9yeNXsq/history?hideSpam=true" target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                            View Address
                        </Link>
                    </div>

                    <div className={styles.breakdownCard} style={{ borderColor: '#9945ff' }}>
                        <span className={styles.breakdownIcon}>🎰</span>
                        <span className={styles.breakdownTitle}>Sweepstakes</span>
                        <span className={styles.breakdownPercent} style={{ color: '#9945ff' }}>10%</span>
                        <span className={styles.breakdownDesc}>
                            Hourly sweepstakes rewards distributed to eligible $TRACKER holders. Hold 1M-20M tokens to participate.
                        </span>
                        <span className={styles.tokenLabel}>Received in SOL</span>
                        <Link href="https://orbmarkets.io/address/rwdkZmr8wDN2b2dNLnaTCkTThUBzRdMJJCqtqgbvMug/history?hideSpam=true" target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                            View Address
                        </Link>
                    </div>

                    <div className={styles.breakdownCard} style={{ borderColor: '#ff9d00' }}>
                        <span className={styles.breakdownIcon}>🪙</span>
                        <span className={styles.breakdownTitle}>SKR Buyback</span>
                        <span className={styles.breakdownPercent} style={{ color: '#ff9d00' }}>10%</span>
                        <span className={styles.breakdownDesc}>
                            Buyback mechanism for $SKR tokens with proceeds directed back to the treasury for protocol sustainability.
                        </span>
                        <span className={styles.tokenLabel}>Uses SKR, sent to Treasury</span>
                        <Link href="https://orbmarkets.io/address/SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3/history?hideSpam=true" target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                            View Address
                        </Link>
                    </div>
                </div>
            </div>

            {/* Key Points */}
            <div className={styles.keyPoints}>
                <h2 className={styles.sectionTitle}>Key Points</h2>
                <div className={styles.pointsList}>
                    <div className={styles.point}>
                        <span className={styles.pointIcon}>✓</span>
                        <span className={styles.pointText}>Revenue is generated from 1% fee on all $TRACKER trading volume</span>
                    </div>
                    <div className={styles.point}>
                        <span className={styles.pointIcon}>✓</span>
                        <span className={styles.pointText}>30% of revenue goes directly back to the community through rewards and buybacks</span>
                    </div>
                    <div className={styles.point}>
                        <span className={styles.pointIcon}>✓</span>
                        <span className={styles.pointText}>Multiple ways to earn: staking, gaming, sweepstakes, or through SKR buyback mechanism</span>
                    </div>
                    <div className={styles.point}>
                        <span className={styles.pointIcon}>✓</span>
                        <span className={styles.pointText}>60% Treasury allocation ensures protocol sustainability and long-term development</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className={styles.disclaimer}>
                <span className={styles.disclaimerText}>
                    * Allocations and percentages are subject to change based on governance decisions and protocol needs.
                </span>
            </div>
        </div>
    );
};

export default WhitepaperPage;
