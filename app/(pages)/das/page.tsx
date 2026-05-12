"use client";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import { IoPhonePortraitOutline } from "react-icons/io5";

type Period = "day" | "week" | "month";
type HistoryPoint = { date: string; das: number; was: number; mas: number };
type TopRow = {
    subdomain: string;
    domain: string;
    owner: string;
    txDay: number;
    txWeek: number;
    txMonth: number;
    lastUsed: number | null;
    createdAt: string | null;
};
type DasResponse = {
    das: number;
    was: number;
    mas: number;
    totalIndexed: number;
    updatedAt: number | null;
    history: HistoryPoint[];
    distribution: {
        dormant: number;
        light: number;
        regular: number;
        heavy: number;
        power: number;
    };
    top: TopRow[];
};

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
                    title={`${points[i].date}: ${v.toLocaleString()}`}
                />
            ))}
        </div>
    );
}

function Delta({ value }: { value: number | null }) {
    if (value == null) return null;
    if (value === 0) return <span className={styles.deltaFlat}>±0</span>;
    const up = value > 0;
    return (
        <span className={up ? styles.deltaUp : styles.deltaDown}>
            {up ? "▲" : "▼"} {Math.abs(value).toLocaleString()}
        </span>
    );
}

export default function DasPage() {
    const [das, setDas] = useState<DasResponse | null>(null);
    const [period, setPeriod] = useState<Period>("day");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("https://seeker-das-scanner.gm-4e8.workers.dev/public/das")
            .then((r) => r.json())
            .then((d) => {
                if (d?.error) setError(d.error);
                else setDas(d);
            })
            .catch((e) => setError(String(e)));
    }, []);

    const deltas = useMemo(() => {
        const h = das?.history ?? [];
        if (h.length < 2) return { das: null, was: null, mas: null };
        const today = h[h.length - 1];
        const yest = h[h.length - 2];
        return {
            das: today.das - yest.das,
            was: today.was - yest.was,
            mas: today.mas - yest.mas,
        };
    }, [das]);

    const dist = das?.distribution;
    const distTotal = dist ? dist.dormant + dist.light + dist.regular + dist.heavy + dist.power : 0;

    const top = das?.top ?? [];
    const txField: Record<Period, keyof TopRow> = { day: "txDay", week: "txWeek", month: "txMonth" };
    const sortedTop = useMemo(() => {
        return [...top]
            .filter((r) => (r[txField[period]] as number) > 0)
            .sort((a, b) => {
                const diff = (b[txField[period]] as number) - (a[txField[period]] as number);
                return diff !== 0 ? diff : (b.lastUsed ?? 0) - (a.lastUsed ?? 0);
            });
    }, [top, period]);

    return (
        <div className={styles.container}>
            <div className={styles.backRow}>
                <Backbutton />
            </div>

            <h1 className={styles.title}>
                <IoPhonePortraitOutline /> DAS — Daily Active Seekers
            </h1>
            <p className={styles.subtitle}>
                On-chain activity across all {das ? das.totalIndexed.toLocaleString() : "—"} .skr IDs
            </p>

            {error && <p className={styles.error}>{error}</p>}

            {!das && !error && <p className={styles.loading}>Loading…</p>}

            {das && (
                <>
                    {/* Headline */}
                    <div className={styles.headlineGrid}>
                        <div className={styles.headlineCard}>
                            <div className={styles.headlineLabel}>DAS · 24h</div>
                            <div className={styles.headlineValue}>{das.das.toLocaleString()}</div>
                            <div className={styles.headlinePct}>
                                {das.totalIndexed > 0 ? `${((das.das / das.totalIndexed) * 100).toFixed(2)}%` : "—"} of all IDs
                            </div>
                            <Delta value={deltas.das} />
                        </div>
                        <div className={styles.headlineCard}>
                            <div className={styles.headlineLabel}>WAS · 7d</div>
                            <div className={styles.headlineValue}>{das.was.toLocaleString()}</div>
                            <div className={styles.headlinePct}>
                                {das.totalIndexed > 0 ? `${((das.was / das.totalIndexed) * 100).toFixed(2)}%` : "—"} of all IDs
                            </div>
                            <Delta value={deltas.was} />
                        </div>
                        <div className={styles.headlineCard}>
                            <div className={styles.headlineLabel}>MAS · 30d</div>
                            <div className={styles.headlineValue}>{das.mas.toLocaleString()}</div>
                            <div className={styles.headlinePct}>
                                {das.totalIndexed > 0 ? `${((das.mas / das.totalIndexed) * 100).toFixed(2)}%` : "—"} of all IDs
                            </div>
                            <Delta value={deltas.mas} />
                        </div>
                    </div>

                    {/* Trend */}
                    {das.history.length > 1 && (
                        <div className={styles.trendCard}>
                            <div className={styles.trendHeader}>
                                <span className={styles.trendTitle}>30-day trend</span>
                                {das.updatedAt && (
                                    <span className={styles.trendMeta}>updated {timeAgo(das.updatedAt)}</span>
                                )}
                            </div>
                            <div className={styles.trendCharts}>
                                <div className={styles.trendCol}>
                                    <div className={styles.trendLabel}>Daily Active</div>
                                    <Sparkline points={das.history} field="das" />
                                </div>
                                <div className={styles.trendDivider} />
                                <div className={styles.trendCol}>
                                    <div className={styles.trendLabel}>Weekly Active</div>
                                    <Sparkline points={das.history} field="was" />
                                </div>
                                <div className={styles.trendDivider} />
                                <div className={styles.trendCol}>
                                    <div className={styles.trendLabel}>Monthly Active</div>
                                    <Sparkline points={das.history} field="mas" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Distribution */}
                    {dist && distTotal > 0 && (
                        <div className={styles.distCard}>
                            <div className={styles.distHeader}>
                                <span className={styles.distTitle}>30-day tx distribution</span>
                                <span className={styles.distMeta}>{distTotal.toLocaleString()} IDs</span>
                            </div>
                            <DistRow label="Dormant"  hint="0 txs"      count={dist.dormant} total={distTotal} color="#3a4a4a" />
                            <DistRow label="Light"    hint="1–5 txs"    count={dist.light}   total={distTotal} color="#00ffd9" />
                            <DistRow label="Regular"  hint="6–20 txs"   count={dist.regular} total={distTotal} color="#00ffae" />
                            <DistRow label="Heavy"    hint="21–100 txs" count={dist.heavy}   total={distTotal} color="#ffc800" />
                            <DistRow label="Power"    hint="100+ txs"   count={dist.power}   total={distTotal} color="#ff8400" />
                        </div>
                    )}

                    {/* Leaderboard */}
                    <div className={styles.boardCard}>
                        <div className={styles.boardHeader}>
                            <span className={styles.boardTitle}>Top 20 most active</span>
                            <div className={styles.tabs}>
                                {(["day", "week", "month"] as Period[]).map((p) => (
                                    <button
                                        key={p}
                                        className={`${styles.tab} ${period === p ? styles.tabActive : ""}`}
                                        onClick={() => setPeriod(p)}
                                    >
                                        {p === "day" ? "24h" : p === "week" ? "7d" : "30d"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {sortedTop.length === 0 ? (
                            <p className={styles.empty}>No active IDs in this window.</p>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.thRank}>#</th>
                                        <th>.skr ID</th>
                                        <th className={styles.thNum}>Txs</th>
                                        <th className={styles.thNum}>Last Used</th>
                                        <th className={styles.thDate}>Activated</th>
                                        <th className={styles.thWallet}>Wallet</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTop.map((row, i) => {
                                        const skrId = `${row.subdomain}${row.domain}`;
                                        const isMedal = i < 3;
                                        return (
                                            <tr key={skrId} className={`${styles.row} ${isMedal ? styles.medalRow : ""}`}>
                                                <td className={styles.tdRank}>
                                                    {isMedal ? (
                                                        <span className={styles.medal} style={{ color: MEDAL_COLORS[i] }}>
                                                            {MEDALS[i]}
                                                        </span>
                                                    ) : (
                                                        <span className={styles.rank}>{i + 1}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <Link href={`/id/${skrId}`} className={styles.skrLink}>
                                                        {skrId}
                                                    </Link>
                                                </td>
                                                <td className={styles.tdNum}>
                                                    <span className={styles.txCount}>
                                                        {(row[txField[period]] as number).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className={styles.tdNum}>
                                                    {row.lastUsed ? (
                                                        <span className={styles.lastUsed}>{timeAgo(row.lastUsed)}</span>
                                                    ) : (
                                                        <span className={styles.noActivity}>—</span>
                                                    )}
                                                </td>
                                                <td className={styles.tdDate}>
                                                    {row.createdAt ? (
                                                        <span className={styles.dateCell}>{row.createdAt.slice(0, 10)}</span>
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
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function DistRow({ label, hint, count, total, color }: {
    label: string;
    hint: string;
    count: number;
    total: number;
    color: string;
}) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className={styles.distRow}>
            <div className={styles.distLabel}>
                <span className={styles.distName}>{label}</span>
                <span className={styles.distHint}>{hint}</span>
            </div>
            <div className={styles.distBarWrap}>
                <div
                    className={styles.distBar}
                    style={{ width: `${Math.max(0.5, pct)}%`, background: color }}
                />
            </div>
            <div className={styles.distCount}>
                <span className={styles.distNum}>{count.toLocaleString()}</span>
                <span className={styles.distPct}>{pct.toFixed(1)}%</span>
            </div>
        </div>
    );
}
