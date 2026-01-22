"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface CompetitorData {
    name: string;
    ticker?: string;
    marketCap: number;
    color: string;
    isSolana?: boolean;
}

const STATIC_DATA: CompetitorData[] = [
    { name: "Apple", ticker: "AAPL", marketCap: 3645, color: "#A2AAAD" },
    { name: "Samsung", ticker: "005930.KS", marketCap: 658, color: "#1428A0" },
    { name: "Sony", ticker: "SONY", marketCap: 142, color: "#000000" },
    { name: "Xiaomi", ticker: "1810.HK", marketCap: 116, color: "#FF6900" },
    { name: "Foxconn", ticker: "2317.TW", marketCap: 98, color: "#E31937" },
    { name: "ZTE", ticker: "000063.SZ", marketCap: 27, color: "#0066B3" },
    { name: "Lenovo", ticker: "0992.HK", marketCap: 14, color: "#E2231A" },
    { name: "Asus", ticker: "2357.TW", marketCap: 12, color: "#00539B" },
    { name: "Transsion", ticker: "688036.SS", marketCap: 11, color: "#FF9933" },
    { name: "HTC", ticker: "2498.TW", marketCap: 1.2, color: "#84BD00" },
    { name: "Solana Mobile", marketCap: 0.125, color: "#14F195", isSolana: true },
];

export default function CompetitorsPage() {
    const [data, setData] = useState<CompetitorData[]>(STATIC_DATA);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<"all" | "zoomed">("all");

    useEffect(() => {
        fetchLiveData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchLiveData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchLiveData = async () => {
        try {
            const response = await fetch("/api/competitors");
            if (response.ok) {
                const liveData = await response.json();
                if (liveData.companies) {
                    setData(liveData.companies);
                    setLastUpdated(new Date(liveData.lastUpdated));
                }
            }
        } catch (error) {
            console.error("Failed to fetch live data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatMarketCap = (value: number): string => {
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(2)}T`;
        }
        if (value >= 1) {
            return `$${value.toFixed(1)}B`;
        }
        return `$${(value * 1000).toFixed(0)}M`;
    };

    const formatAxisValue = (value: number): string => {
        if (value >= 1000) return `${(value / 1000).toFixed(1)}T`;
        if (value >= 1) return `${value.toFixed(0)}B`;
        return `${(value * 1000).toFixed(0)}M`;
    };

    // Data for zoomed view (excludes Apple for better visibility)
    const zoomedData = data.filter(d => d.marketCap < 1000);
    const displayData = viewMode === "all" ? data : zoomedData;

    // Calculate Solana Mobile's position
    const solanaMobile = data.find(d => d.isSolana);
    const solanaRank = data
        .sort((a, b) => b.marketCap - a.marketCap)
        .findIndex(d => d.isSolana) + 1;

    // Calculate multipliers
    const getMultiplier = (targetCap: number, currentCap: number): string => {
        return (targetCap / currentCap).toFixed(0);
    };

    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href="/">← Back to Tracker</Link>
            </div>

            <div className={styles.topBar}>
                <span className={styles.header}>Mobile Phone Market Cap</span>
                <span className={styles.subheader}>
                    Comparing Solana Mobile to Top Phone Manufacturers
                </span>
            </div>

            {solanaMobile && (
                <div className={styles.solanaHighlight}>
                    <div className={styles.solanaLogo}>
                        <span className={styles.solanaIcon}>S</span>
                    </div>
                    <div className={styles.solanaInfo}>
                        <span className={styles.solanaName}>Solana Mobile</span>
                        <span className={styles.solanaCap}>{formatMarketCap(solanaMobile.marketCap)}</span>
                        <span className={styles.solanaRank}>#{solanaRank} of {data.length} companies</span>
                    </div>
                    <div className={styles.solanaMultipliers}>
                        <span className={styles.multiplierLabel}>Growth Potential</span>
                        <div className={styles.multiplierRow}>
                            <span>To HTC:</span>
                            <span className={styles.multiplierValue}>{getMultiplier(1.2, solanaMobile.marketCap)}x</span>
                        </div>
                        <div className={styles.multiplierRow}>
                            <span>To Xiaomi:</span>
                            <span className={styles.multiplierValue}>{getMultiplier(116, solanaMobile.marketCap)}x</span>
                        </div>
                        <div className={styles.multiplierRow}>
                            <span>To Samsung:</span>
                            <span className={styles.multiplierValue}>{getMultiplier(658, solanaMobile.marketCap)}x</span>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.chartSection}>
                <div className={styles.chartHeader}>
                    <span className={styles.chartTitle}>Market Cap Comparison</span>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === "all" ? styles.active : ""}`}
                            onClick={() => setViewMode("all")}
                        >
                            All
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === "zoomed" ? styles.active : ""}`}
                            onClick={() => setViewMode("zoomed")}
                        >
                            Zoomed (excl. Apple)
                        </button>
                    </div>
                </div>

                <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={displayData.sort((a, b) => b.marketCap - a.marketCap)}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <XAxis
                                type="number"
                                tickFormatter={formatAxisValue}
                                stroke="#808080"
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#808080"
                                width={90}
                            />
                            <Tooltip
                                formatter={(value) => [formatMarketCap(Number(value) || 0), "Market Cap"]}
                                contentStyle={{
                                    backgroundColor: "#1a1a1a",
                                    border: "1px solid #333",
                                    borderRadius: "8px",
                                }}
                                labelStyle={{ color: "#fff" }}
                            />
                            <Bar dataKey="marketCap" radius={[0, 4, 4, 0]}>
                                {displayData
                                    .sort((a, b) => b.marketCap - a.marketCap)
                                    .map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.isSolana ? "#14F195" : entry.color}
                                            opacity={entry.isSolana ? 1 : 0.7}
                                            stroke={entry.isSolana ? "#14F195" : "none"}
                                            strokeWidth={entry.isSolana ? 2 : 0}
                                        />
                                    ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.tableSection}>
                <span className={styles.tableTitle}>Full Rankings</span>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Company</th>
                                <th>Ticker</th>
                                <th>Market Cap</th>
                                <th>vs Solana Mobile</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data
                                .sort((a, b) => b.marketCap - a.marketCap)
                                .map((company, index) => (
                                    <tr
                                        key={company.name}
                                        className={company.isSolana ? styles.solanaRow : ""}
                                    >
                                        <td>{index + 1}</td>
                                        <td>
                                            <span
                                                className={styles.colorDot}
                                                style={{ backgroundColor: company.color }}
                                            />
                                            {company.name}
                                        </td>
                                        <td className={styles.ticker}>{company.ticker || "-"}</td>
                                        <td className={styles.marketCapCell}>
                                            {formatMarketCap(company.marketCap)}
                                        </td>
                                        <td className={styles.multiplierCell}>
                                            {company.isSolana
                                                ? "-"
                                                : `${getMultiplier(company.marketCap, solanaMobile?.marketCap || 0.125)}x`}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.footer}>
                {lastUpdated && (
                    <span className={styles.lastUpdated}>
                        Last updated: {lastUpdated.toLocaleString()}
                    </span>
                )}
                <span className={styles.sources}>
                    Sources: companiesmarketcap.com, Yahoo Finance
                </span>
                <span className={styles.disclaimer}>
                    Note: Huawei is private (no public market cap). Solana Mobile is live from SKR token.
                </span>
            </div>
        </div>
    );
}
