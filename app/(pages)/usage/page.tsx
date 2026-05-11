"use client";
import React, { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import { IoPhonePortraitOutline, IoRefresh } from "react-icons/io5";

type Period = "day" | "week" | "month";

type UsageRow = {
    domain: string;
    subdomain: string;
    owner: string;
    txCount: number;
    lastUsed: number | null;
    created_at: string;
};

type ApiResponse = {
    period: Period;
    activeCount: number;
    total: number;
    updatedAt: number | null;
    data: UsageRow[];
};

const PAGE_SIZE = 50;

function timeAgo(unixSec: number): string {
    const diff = Math.floor(Date.now() / 1000) - unixSec;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function shortAddress(addr: string): string {
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function UsagePage() {
    const [period, setPeriod] = useState<Period>("day");
    const [result, setResult] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async (p: Period) => {
        setLoading(true);
        setError(null);
        setPage(1);
        try {
            const res = await fetch(`/api/usage?period=${p}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json: ApiResponse = await res.json();
            setResult(json);
        } catch (e) {
            setError((e as Error).message ?? "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(period);
    }, [period, fetchData]);

    const handlePeriodChange = (p: Period) => {
        setPeriod(p);
    };

    const rows = result?.data ?? [];
    const totalPages = Math.ceil(rows.length / PAGE_SIZE);
    const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const periodLabel: Record<Period, string> = {
        day: "past 24 hours",
        week: "past 7 days",
        month: "past 30 days",
    };

    return (
        <div className={styles.container}>
            <div className={styles.backRow}>
                <Backbutton />
            </div>

            <h1 className={styles.title}>
                <IoPhonePortraitOutline /> Seeker Usage Report
            </h1>

            <p className={styles.subtitle}>
                On-chain transaction activity per .skr ID
            </p>

            {/* Summary Cards */}
            {result && (
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>IDs Checked</div>
                        <div className={styles.summaryValue}>{result.total.toLocaleString()}</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Active ({periodLabel[period]})</div>
                        <div className={styles.summaryValue}>{result.activeCount.toLocaleString()}</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Top Txs</div>
                        <div className={styles.summaryValue}>{(rows[0]?.txCount ?? 0).toLocaleString()}</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Activity Rate</div>
                        <div className={styles.summaryValue}>
                            {result.total > 0
                                ? `${((result.activeCount / result.total) * 100).toFixed(0)}%`
                                : "—"}
                        </div>
                    </div>
                </div>
            )}

            {/* Period Tabs */}
            <div className={styles.controls}>
                <div className={styles.tabs}>
                    {(["day", "week", "month"] as Period[]).map((p) => (
                        <button
                            key={p}
                            className={`${styles.tab} ${period === p ? styles.tabActive : ""}`}
                            onClick={() => handlePeriodChange(p)}
                            disabled={loading}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    className={styles.refreshButton}
                    onClick={() => fetchData(period)}
                    disabled={loading}
                    title="Refresh data"
                >
                    <IoRefresh className={loading ? styles.spinning : ""} />
                </button>
            </div>

            {/* Table */}
            {loading && (
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Fetching on-chain usage data…</p>
                    <p className={styles.loadingNote}>Querying up to 200 Seeker IDs via Helius RPC</p>
                </div>
            )}

            {error && !loading && (
                <div className={styles.errorBox}>{error}</div>
            )}

            {!loading && !error && result && (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.thRank}>#</th>
                                    <th>.skr ID</th>
                                    <th className={styles.thNum}>Txs ({period})</th>
                                    <th className={styles.thNum}>Last Used</th>
                                    <th className={styles.thWallet}>Wallet</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className={styles.empty}>
                                            No activity found for this period.
                                        </td>
                                    </tr>
                                )}
                                {pageRows.map((row, i) => {
                                    const globalRank = (page - 1) * PAGE_SIZE + i + 1;
                                    const skrId = `${row.subdomain}${row.domain}`;
                                    return (
                                        <tr
                                            key={row.subdomain + row.domain}
                                            className={`${styles.row} ${row.txCount === 0 ? styles.inactive : ""}`}
                                        >
                                            <td className={styles.tdRank}>
                                                <span className={styles.rank}>{globalRank}</span>
                                            </td>
                                            <td>
                                                <Link href={`/id/${skrId}`} className={styles.skrLink}>
                                                    {skrId}
                                                </Link>
                                            </td>
                                            <td className={styles.tdNum}>
                                                {row.txCount > 0 ? (
                                                    <span className={styles.txCount}>{row.txCount.toLocaleString()}</span>
                                                ) : (
                                                    <span className={styles.noActivity}>—</span>
                                                )}
                                            </td>
                                            <td className={styles.tdNum}>
                                                {row.lastUsed ? (
                                                    <span className={styles.lastUsed}>{timeAgo(row.lastUsed)}</span>
                                                ) : (
                                                    <span className={styles.noActivity}>—</span>
                                                )}
                                            </td>
                                            <td className={styles.tdWallet}>
                                                <a
                                                    href={`https://solscan.io/account/${row.owner}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.walletLink}
                                                >
                                                    {shortAddress(row.owner)}
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                ← Prev
                            </button>
                            <span className={styles.pageInfo}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    <p className={styles.footnote}>
                        {result.updatedAt
                            ? `Snapshot from daily cron • last indexed ${timeAgo(result.updatedAt)} • `
                            : "Live query (cron not yet run) • "}
                        {result.total.toLocaleString()} .skr IDs • tx counts capped at 1,000 per address
                    </p>
                </>
            )}
        </div>
    );
}
