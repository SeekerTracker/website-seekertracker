"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import { IoPhonePortraitOutline, IoRefresh, IoSearchOutline } from "react-icons/io5";

type Period = "day" | "week" | "month";

type UsageRow = {
    domain: string;
    subdomain: string;
    owner: string;
    txDay: number;
    txWeek: number;
    txMonth: number;
    txCount: number;
    lastUsed: number | null;
};

type HistoryPoint = { date: string; das: number; was: number; mas: number };

type ApiResponse = {
    period: Period;
    activeCount: number;
    total: number;
    updatedAt: number | null;
    data: UsageRow[];
};

type DasResponse = {
    das: number;
    was: number;
    mas: number;
    totalIndexed: number;
    updatedAt: number | null;
    history: HistoryPoint[];
};

const PAGE_SIZE = 50;

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#ffc800", "#b4b4b4", "#c8823c"];

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

function Sparkline({ points, field }: { points: HistoryPoint[]; field: "das" | "was" | "mas" }) {
    if (!points?.length) return null;
    const values = points.map((p) => p[field]);
    const max = Math.max(...values, 1);
    return (
        <div className={styles.sparkline}>
            {values.map((v, i) => (
                <div
                    key={i}
                    className={styles.sparkBar}
                    style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
                    title={`${points[i].date}: ${v}`}
                />
            ))}
        </div>
    );
}

export default function UsagePage() {
    const [period, setPeriod] = useState<Period>("day");
    const [result, setResult] = useState<ApiResponse | null>(null);
    const [das, setDas] = useState<DasResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [activeOnly, setActiveOnly] = useState(false);

    const fetchData = useCallback(async (p: Period) => {
        setLoading(true);
        setError(null);
        setPage(1);
        try {
            const res = await fetch(`/api/usage?period=${p}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setResult(await res.json());
        } catch (e) {
            setError((e as Error).message ?? "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(period); }, [period, fetchData]);

    useEffect(() => {
        fetch("/api/das")
            .then(r => r.json())
            .then(d => { if (d?.history && d?.das != null) setDas(d); })
            .catch(() => {});
    }, []);

    const periodCol: Record<Period, keyof UsageRow> = { day: "txDay", week: "txWeek", month: "txMonth" };

    const filteredRows = useMemo(() => {
        let rows = (result?.data ?? []).slice();
        // Re-sort by selected period (API may have sorted by a different period on initial load)
        rows.sort((a, b) => {
            const diff = (b[periodCol[period]] as number) - (a[periodCol[period]] as number);
            return diff !== 0 ? diff : (b.lastUsed ?? 0) - (a.lastUsed ?? 0);
        });
        if (activeOnly) rows = rows.filter((r) => (r[periodCol[period]] as number) > 0);
        if (search.trim()) {
            const q = search.toLowerCase().replace(".skr", "");
            rows = rows.filter((r) => r.subdomain.toLowerCase().includes(q));
        }
        return rows;
    }, [result, period, activeOnly, search]);

    const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
    const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSearch = (v: string) => { setSearch(v); setPage(1); };
    const handlePeriod = (p: Period) => { setPeriod(p); setPage(1); };
    const handleActiveOnly = () => { setActiveOnly(o => !o); setPage(1); };

    const topTx = filteredRows[0]?.[periodCol[period]] as number ?? 0;
    const activeCount = filteredRows.filter((r) => (r[periodCol[period]] as number) > 0).length;

    return (
        <div className={styles.container}>
            <div className={styles.backRow}>
                <Backbutton />
            </div>

            <h1 className={styles.title}>
                <IoPhonePortraitOutline /> DAS — Daily Active Seekers
            </h1>
            <p className={styles.subtitle}>On-chain transaction activity per .skr ID</p>

            {/* DAS Trend Chart */}
            {das && (das.history?.length ?? 0) > 1 && (
                <div className={styles.trendCard}>
                    <div className={styles.trendHeader}>
                        <span className={styles.trendTitle}>DAS / WAS / MAS — 30-day trend</span>
                        {das.updatedAt && (
                            <span className={styles.trendMeta}>updated {timeAgo(das.updatedAt)}</span>
                        )}
                    </div>
                    <div className={styles.trendCharts}>
                        <div className={styles.trendCol}>
                            <div className={styles.trendStat}>{das.das.toLocaleString()}</div>
                            <div className={styles.trendLabel}>Daily Active</div>
                            <Sparkline points={das.history} field="das" />
                        </div>
                        <div className={styles.trendDivider} />
                        <div className={styles.trendCol}>
                            <div className={styles.trendStat}>{das.was.toLocaleString()}</div>
                            <div className={styles.trendLabel}>Weekly Active</div>
                            <Sparkline points={das.history} field="was" />
                        </div>
                        <div className={styles.trendDivider} />
                        <div className={styles.trendCol}>
                            <div className={styles.trendStat}>{das.mas.toLocaleString()}</div>
                            <div className={styles.trendLabel}>Monthly Active</div>
                            <Sparkline points={das.history} field="mas" />
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {result && (
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Total Indexed</div>
                        <div className={styles.summaryValue}>{result.total.toLocaleString()}</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Active ({period})</div>
                        <div className={styles.summaryValue}>{activeCount.toLocaleString()}</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Top Txs ({period})</div>
                        <div className={styles.summaryValue}>{topTx.toLocaleString()}</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Activity Rate</div>
                        <div className={styles.summaryValue}>
                            {result.total > 0
                                ? `${((activeCount / result.total) * 100).toFixed(1)}%`
                                : "—"}
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className={styles.controlsRow}>
                <div className={styles.searchBox}>
                    <IoSearchOutline className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search .skr ID…"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                <div className={styles.tabs}>
                    <span className={styles.tabLabel}>Sort:</span>
                    {(["day", "week", "month"] as Period[]).map((p) => (
                        <button
                            key={p}
                            className={`${styles.tab} ${period === p ? styles.tabActive : ""}`}
                            onClick={() => handlePeriod(p)}
                            disabled={loading}
                        >
                            {p === "day" ? "24h" : p === "week" ? "7d" : "30d"}
                        </button>
                    ))}
                </div>

                <button
                    className={`${styles.toggleBtn} ${activeOnly ? styles.toggleActive : ""}`}
                    onClick={handleActiveOnly}
                >
                    Active only
                </button>

                <button
                    className={styles.refreshButton}
                    onClick={() => fetchData(period)}
                    disabled={loading}
                    title="Refresh data"
                >
                    <IoRefresh className={loading ? styles.spinning : ""} />
                </button>
            </div>

            {loading && (
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Loading usage data…</p>
                </div>
            )}

            {error && !loading && (
                <div className={styles.errorBox}>{error}</div>
            )}

            {!loading && !error && result && (
                <>
                    {search && (
                        <p className={styles.searchResult}>
                            {filteredRows.length} result{filteredRows.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
                        </p>
                    )}

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.thRank}>#</th>
                                    <th>.skr ID</th>
                                    <th className={`${styles.thNum} ${period === "day" ? styles.thActive : ""}`}>24h Txs</th>
                                    <th className={`${styles.thNum} ${period === "week" ? styles.thActive : ""}`}>7d Txs</th>
                                    <th className={`${styles.thNum} ${period === "month" ? styles.thActive : ""}`}>30d Txs</th>
                                    <th className={styles.thNum}>Last Used</th>
                                    <th className={styles.thWallet}>Wallet</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className={styles.empty}>
                                            No results found.
                                        </td>
                                    </tr>
                                )}
                                {pageRows.map((row, i) => {
                                    const globalRank = (page - 1) * PAGE_SIZE + i;
                                    const skrId = `${row.subdomain}${row.domain}`;
                                    const isMedal = globalRank < 3 && !search && !activeOnly;
                                    const isInactive = (row[periodCol[period]] as number) === 0;
                                    return (
                                        <tr
                                            key={row.subdomain + row.domain}
                                            className={`${styles.row} ${isInactive ? styles.inactive : ""} ${isMedal ? styles.medalRow : ""}`}
                                        >
                                            <td className={styles.tdRank}>
                                                {isMedal ? (
                                                    <span
                                                        className={styles.medal}
                                                        style={{ color: MEDAL_COLORS[globalRank] }}
                                                    >
                                                        {MEDALS[globalRank]}
                                                    </span>
                                                ) : (
                                                    <span className={styles.rank}>{globalRank + 1}</span>
                                                )}
                                            </td>
                                            <td>
                                                <Link href={`/id/${skrId}`} className={styles.skrLink}>
                                                    {skrId}
                                                </Link>
                                            </td>
                                            <td className={`${styles.tdNum} ${period === "day" ? styles.tdActive : ""}`}>
                                                <TxCell value={row.txDay} />
                                            </td>
                                            <td className={`${styles.tdNum} ${period === "week" ? styles.tdActive : ""}`}>
                                                <TxCell value={row.txWeek} />
                                            </td>
                                            <td className={`${styles.tdNum} ${period === "month" ? styles.tdActive : ""}`}>
                                                <TxCell value={row.txMonth} />
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
                                Page {page} of {totalPages} &nbsp;·&nbsp; {filteredRows.length.toLocaleString()} total
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
                            ? `Snapshot from daily cron · last indexed ${timeAgo(result.updatedAt)} · `
                            : "Live query (cron not yet run) · "}
                        {result.total.toLocaleString()} .skr IDs · tx counts capped at 1,000 per address
                    </p>
                </>
            )}
        </div>
    );
}

function TxCell({ value }: { value: number }) {
    if (value === 0) return <span className={styles.noActivity}>—</span>;
    return <span className={styles.txCount}>{value.toLocaleString()}</span>;
}
