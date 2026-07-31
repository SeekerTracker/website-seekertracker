"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import { IoPhonePortraitOutline, IoWarningOutline, IoRefresh, IoSearch } from "react-icons/io5";
import { FaXTwitter, FaTelegram, FaCopy, FaCheck } from "react-icons/fa6";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

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

type RangeKey = 7 | 14 | 30;
type SortKey = "txDay" | "txWeek" | "txMonth";

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#ffc800", "#b4b4b4", "#c8823c"];

const COLOR_DAS = "#00ffd9";
const COLOR_WAS = "#00b388";
const COLOR_MAS = "#5d7777";
const COLOR_STICKY = "#ffc800";

const REFRESH_MS = 5 * 60 * 1000;
const PRIMARY = "/api/das";
const FALLBACK = "https://seeker-das-scanner.gm-4e8.workers.dev/public/das";

function timeAgo(unixSec: number): string {
    const diff = Math.floor(Date.now() / 1000) - unixSec;
    if (diff < 0) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function shortAddress(addr: string): string {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatTickDate(iso: string): string {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

function Delta({ value, suffix }: { value: number | null; suffix?: string }) {
    if (value == null) return null;
    if (value === 0) return <span className={styles.deltaFlat}>±0{suffix ?? ""}</span>;
    const up = value > 0;
    return (
        <span className={up ? styles.deltaUp : styles.deltaDown}>
            {up ? "▲" : "▼"} {Math.abs(value).toLocaleString()}
            {suffix ?? ""}
        </span>
    );
}

async function fetchDasJson(): Promise<DasResponse> {
    const tryUrl = async (url: string) => {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("json")) throw new Error("non-JSON");
        const d = await r.json();
        if (d?.error) throw new Error(String(d.error));
        if (typeof d?.das !== "number") throw new Error("invalid payload");
        return d as DasResponse;
    };
    try {
        return await tryUrl(PRIMARY);
    } catch {
        return await tryUrl(FALLBACK);
    }
}

export default function DasPage() {
    const [das, setDas] = useState<DasResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState({ DAS: true, WAS: true, MAS: true });
    const [range, setRange] = useState<RangeKey>(30);
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("txDay");
    const [distMode, setDistMode] = useState<"active" | "all">("active");

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const d = await fetchDasJson();
            setDas(d);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        load(false);
        const id = setInterval(() => load(true), REFRESH_MS);
        return () => clearInterval(id);
    }, [load]);

    const history = das?.history ?? [];

    const rangedHistory = useMemo(() => {
        if (history.length <= range) return history;
        return history.slice(-range);
    }, [history, range]);

    const deltas = useMemo(() => {
        if (history.length < 2) return { das: null, was: null, mas: null };
        const today = history[history.length - 1];
        const yest = history[history.length - 2];
        return {
            das: today.das - yest.das,
            was: today.was - yest.was,
            mas: today.mas - yest.mas,
        };
    }, [history]);

    const trendData = useMemo(
        () =>
            rangedHistory.map((h) => ({
                date: h.date,
                label: formatTickDate(h.date),
                DAS: h.das,
                WAS: h.was,
                MAS: h.mas,
                stickiness: h.mas > 0 ? Number(((h.das / h.mas) * 100).toFixed(2)) : 0,
            })),
        [rangedHistory]
    );

    const insights = useMemo(() => {
        if (!das || history.length === 0) return null;
        const last7 = history.slice(-7);
        const avg7 =
            last7.reduce((s, h) => s + h.das, 0) / Math.max(1, last7.length);
        const peak = history.reduce(
            (best, h) => (h.das > best.das ? h : best),
            history[0]
        );
        const low = history.reduce(
            (best, h) => (h.das < best.das ? h : best),
            history[0]
        );
        const stickiness = das.mas > 0 ? (das.das / das.mas) * 100 : 0;
        const activeRate = das.totalIndexed > 0 ? (das.das / das.totalIndexed) * 100 : 0;
        const engaged =
            (das.distribution?.light ?? 0) +
            (das.distribution?.regular ?? 0) +
            (das.distribution?.heavy ?? 0) +
            (das.distribution?.power ?? 0);
        return {
            avg7: Math.round(avg7),
            peakDas: peak.das,
            peakDate: peak.date,
            lowDas: low.das,
            lowDate: low.date,
            stickiness,
            activeRate,
            engaged,
            dormant: das.distribution?.dormant ?? 0,
        };
    }, [das, history]);

    const stickinessNow = das && das.mas > 0 ? (das.das / das.mas) * 100 : null;
    const stickinessDelta = useMemo(() => {
        if (trendData.length < 2) return null;
        return (
            trendData[trendData.length - 1].stickiness -
            trendData[trendData.length - 2].stickiness
        );
    }, [trendData]);

    const dist = das?.distribution;
    const distTotal = dist
        ? dist.dormant + dist.light + dist.regular + dist.heavy + dist.power
        : 0;

    const topFiltered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let rows = [...(das?.top ?? [])];
        if (q) {
            rows = rows.filter((r) => {
                const id = `${r.subdomain}${r.domain}`.toLowerCase();
                return id.includes(q) || r.owner.toLowerCase().includes(q);
            });
        }
        rows.sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
        return rows;
    }, [das?.top, query, sortKey]);

    return (
        <div className={styles.container}>
            <div className={styles.backRow}>
                <Backbutton />
            </div>

            <h1 className={styles.title}>
                <IoPhonePortraitOutline /> DAS — Daily Active Seekers
            </h1>
            <p className={styles.subtitle}>
                On-chain activity across all{" "}
                {das ? das.totalIndexed.toLocaleString() : "—"} .skr IDs
                {das?.updatedAt ? <> · updated {timeAgo(das.updatedAt)}</> : null}
            </p>

            <div className={styles.toolbar}>
                <ShareRow das={das} />
                <button
                    type="button"
                    className={styles.refreshBtn}
                    onClick={() => load(true)}
                    disabled={refreshing || loading}
                    aria-label="Refresh DAS data"
                >
                    <IoRefresh className={refreshing ? styles.spin : undefined} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            <div className={styles.disclaimer}>
                <IoWarningOutline />
                <span>
                    Unofficial figures from public RPC scans (~every 6h). Tx counts cap at the
                    most-recent 100 signatures per ID — top of the board often ties at 100+.
                    Not for trading or compliance.
                </span>
            </div>

            {error && !das && <p className={styles.error}>Failed to load: {error}</p>}
            {loading && !das && (
                <div className={styles.skeletonGrid} aria-hidden>
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                </div>
            )}

            {das && (
                <>
                    <div className={styles.headlineGrid}>
                        <HeadlineCard
                            label="DAS · 24h"
                            value={das.das}
                            total={das.totalIndexed}
                            delta={deltas.das}
                            accent={COLOR_DAS}
                        />
                        <HeadlineCard
                            label="WAS · 7d"
                            value={das.was}
                            total={das.totalIndexed}
                            delta={deltas.was}
                            accent={COLOR_WAS}
                        />
                        <HeadlineCard
                            label="MAS · 30d"
                            value={das.mas}
                            total={das.totalIndexed}
                            delta={deltas.mas}
                            accent={COLOR_MAS}
                        />
                    </div>

                    {insights && (
                        <div className={styles.insightGrid}>
                            <Insight
                                label="7d avg DAS"
                                value={insights.avg7.toLocaleString()}
                                hint="mean daily actives"
                            />
                            <Insight
                                label="30d peak"
                                value={insights.peakDas.toLocaleString()}
                                hint={formatTickDate(insights.peakDate)}
                            />
                            <Insight
                                label="Active rate"
                                value={`${insights.activeRate.toFixed(2)}%`}
                                hint="DAS / all .skr"
                            />
                            <Insight
                                label="Stickiness"
                                value={`${insights.stickiness.toFixed(1)}%`}
                                hint="DAS ÷ MAS"
                                accent={COLOR_STICKY}
                            />
                            <Insight
                                label="Engaged · 30d"
                                value={insights.engaged.toLocaleString()}
                                hint="≥1 tx in month"
                            />
                            <Insight
                                label="Dormant"
                                value={insights.dormant.toLocaleString()}
                                hint="0 txs · 30d"
                            />
                        </div>
                    )}

                    {trendData.length > 1 && (
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <div>
                                    <div className={styles.chartTitle}>Active IDs over time</div>
                                    <div className={styles.chartSub}>
                                        {trendData.length} day{trendData.length === 1 ? "" : "s"} ·
                                        tap a series to toggle
                                    </div>
                                </div>
                                <div className={styles.chartControls}>
                                    <div className={styles.rangeRow}>
                                        {([7, 14, 30] as const).map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                className={`${styles.rangeBtn} ${
                                                    range === n ? styles.rangeActive : ""
                                                }`}
                                                onClick={() => setRange(n)}
                                            >
                                                {n}d
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.legendRow}>
                                        {(["DAS", "WAS", "MAS"] as const).map((k) => (
                                            <SeriesToggle
                                                key={k}
                                                label={k}
                                                color={
                                                    k === "DAS"
                                                        ? COLOR_DAS
                                                        : k === "WAS"
                                                          ? COLOR_WAS
                                                          : COLOR_MAS
                                                }
                                                active={visible[k]}
                                                onClick={() =>
                                                    setVisible((v) => ({ ...v, [k]: !v[k] }))
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.chartBody}>
                                {mounted && (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart
                                            data={trendData}
                                            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="gradDas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={COLOR_DAS} stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor={COLOR_DAS} stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradWas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={COLOR_WAS} stopOpacity={0.25} />
                                                    <stop offset="100%" stopColor={COLOR_WAS} stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradMas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={COLOR_MAS} stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor={COLOR_MAS} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                stroke="rgba(0, 255, 217, 0.06)"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="label"
                                                stroke="#5d7777"
                                                tick={{ fontSize: 11, fill: "#5d7777" }}
                                                axisLine={false}
                                                tickLine={false}
                                                minTickGap={20}
                                            />
                                            <YAxis
                                                stroke="#5d7777"
                                                tick={{ fontSize: 11, fill: "#5d7777" }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v: number) => v.toLocaleString()}
                                                width={52}
                                            />
                                            <Tooltip
                                                content={<TrendTooltip />}
                                                cursor={{
                                                    stroke: "rgba(0, 255, 217, 0.25)",
                                                    strokeDasharray: 3,
                                                }}
                                            />
                                            {visible.MAS && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="MAS"
                                                    stroke={COLOR_MAS}
                                                    strokeWidth={2}
                                                    fill="url(#gradMas)"
                                                    dot={false}
                                                    activeDot={{ r: 4, fill: COLOR_MAS }}
                                                />
                                            )}
                                            {visible.WAS && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="WAS"
                                                    stroke={COLOR_WAS}
                                                    strokeWidth={2}
                                                    fill="url(#gradWas)"
                                                    dot={false}
                                                    activeDot={{ r: 4, fill: COLOR_WAS }}
                                                />
                                            )}
                                            {visible.DAS && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="DAS"
                                                    stroke={COLOR_DAS}
                                                    strokeWidth={2.5}
                                                    fill="url(#gradDas)"
                                                    dot={false}
                                                    activeDot={{ r: 5, fill: COLOR_DAS }}
                                                />
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}

                    {trendData.length > 1 && stickinessNow != null && (
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <div>
                                    <div className={styles.chartTitle}>Stickiness (DAS / MAS)</div>
                                    <div className={styles.chartSub}>
                                        Share of monthly-actives that returned in the last 24h.
                                        Higher = stickier base.
                                    </div>
                                </div>
                                <div className={styles.stickinessNow}>
                                    <span
                                        className={styles.stickinessValue}
                                        style={{ color: COLOR_STICKY }}
                                    >
                                        {stickinessNow.toFixed(1)}%
                                    </span>
                                    {stickinessDelta != null && (
                                        <Delta
                                            value={Number(stickinessDelta.toFixed(1))}
                                            suffix="pp"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className={styles.chartBody}>
                                {mounted && (
                                    <ResponsiveContainer width="100%" height={160}>
                                        <LineChart
                                            data={trendData}
                                            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid
                                                stroke="rgba(255, 200, 0, 0.06)"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="label"
                                                stroke="#5d7777"
                                                tick={{ fontSize: 11, fill: "#5d7777" }}
                                                axisLine={false}
                                                tickLine={false}
                                                minTickGap={20}
                                            />
                                            <YAxis
                                                stroke="#5d7777"
                                                tick={{ fontSize: 11, fill: "#5d7777" }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                                                width={48}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: "#0a1414",
                                                    border: "1px solid rgba(255, 200, 0, 0.25)",
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                }}
                                                labelStyle={{ color: "#c0c0c0" }}
                                                formatter={(v) => [
                                                    `${Number(v ?? 0).toFixed(1)}%`,
                                                    "Stickiness",
                                                ]}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="stickiness"
                                                stroke={COLOR_STICKY}
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4, fill: COLOR_STICKY }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}

                    {dist && distTotal > 0 && (
                        <div className={styles.distCard}>
                            <div className={styles.distHeader}>
                                <div>
                                    <span className={styles.distTitle}>30-day tx distribution</span>
                                    <div className={styles.distSub}>
                                        On-chain sigs per .skr owner wallet · scan caps at 100
                                        sigs/ID
                                    </div>
                                </div>
                                <div className={styles.distHeaderRight}>
                                    <div className={styles.rangeRow}>
                                        <button
                                            type="button"
                                            className={`${styles.rangeBtn} ${
                                                distMode === "active" ? styles.rangeActive : ""
                                            }`}
                                            onClick={() => setDistMode("active")}
                                        >
                                            Among MAS
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.rangeBtn} ${
                                                distMode === "all" ? styles.rangeActive : ""
                                            }`}
                                            onClick={() => setDistMode("all")}
                                        >
                                            All IDs
                                        </button>
                                    </div>
                                    <span className={styles.distMeta}>
                                        {(distMode === "active"
                                            ? dist.light +
                                              dist.regular +
                                              dist.heavy +
                                              dist.power
                                            : distTotal
                                        ).toLocaleString()}{" "}
                                        IDs
                                    </span>
                                </div>
                            </div>

                            <div className={styles.dormantCallout}>
                                <span className={styles.dormantLabel}>Dormant · 0 txs / 30d</span>
                                <span className={styles.dormantValue}>
                                    {dist.dormant.toLocaleString()}{" "}
                                    <em>
                                        (
                                        {distTotal > 0
                                            ? ((dist.dormant / distTotal) * 100).toFixed(1)
                                            : "0"}
                                        % of all .skr)
                                    </em>
                                </span>
                                <span className={styles.dormantHint}>
                                    Most SeekerIDs never send on-chain txs after mint — not the same
                                    as app DAU.
                                </span>
                            </div>

                            {(() => {
                                const engaged =
                                    dist.light + dist.regular + dist.heavy + dist.power;
                                const barTotal =
                                    distMode === "active" ? Math.max(1, engaged) : distTotal;
                                // Scanner: heavy = 21–100 (includes cap); power = 100+ never fills.
                                const heavyOrCap = dist.heavy + dist.power;
                                return (
                                    <>
                                        {distMode === "all" && (
                                            <DistRow
                                                label="Dormant"
                                                hint="0 txs"
                                                count={dist.dormant}
                                                total={barTotal}
                                                color="#3a4a4a"
                                            />
                                        )}
                                        <DistRow
                                            label="Light"
                                            hint="1–5 txs"
                                            count={dist.light}
                                            total={barTotal}
                                            color="#00b388"
                                        />
                                        <DistRow
                                            label="Regular"
                                            hint="6–20 txs"
                                            count={dist.regular}
                                            total={barTotal}
                                            color="#00ffae"
                                        />
                                        <DistRow
                                            label="Heavy / at cap"
                                            hint="21–100 txs · 100 is scan max"
                                            count={heavyOrCap}
                                            total={barTotal}
                                            color="#ffc800"
                                        />
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    <div className={styles.boardCard}>
                        <div className={styles.boardHeader}>
                            <div>
                                <div className={styles.boardTitle}>Most-active IDs · last 24h</div>
                                <div className={styles.boardSub}>
                                    Sorted by activity. Cap at 100 sigs/ID → top often ties at 100+.
                                </div>
                            </div>
                            <div className={styles.boardTools}>
                                <label className={styles.searchWrap}>
                                    <IoSearch aria-hidden />
                                    <input
                                        type="search"
                                        placeholder="Search .skr or wallet"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                </label>
                                <div className={styles.sortRow}>
                                    {(
                                        [
                                            ["txDay", "24h"],
                                            ["txWeek", "7d"],
                                            ["txMonth", "30d"],
                                        ] as const
                                    ).map(([k, label]) => (
                                        <button
                                            key={k}
                                            type="button"
                                            className={`${styles.sortBtn} ${
                                                sortKey === k ? styles.sortActive : ""
                                            }`}
                                            onClick={() => setSortKey(k)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {topFiltered.length === 0 ? (
                            <p className={styles.empty}>
                                {query ? "No IDs match that search." : "No active IDs in this window."}
                            </p>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.thRank}>#</th>
                                            <th>.skr ID</th>
                                            <th className={styles.thNum}>24h</th>
                                            <th className={styles.thNum}>7d</th>
                                            <th className={styles.thNum}>30d</th>
                                            <th className={styles.thNum}>Last Used</th>
                                            <th className={styles.thDate}>Activated</th>
                                            <th className={styles.thWallet}>Wallet</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topFiltered.map((row, i) => {
                                            const skrId = `${row.subdomain}${row.domain}`;
                                            const isMedal = i < 3 && !query;
                                            return (
                                                <tr
                                                    key={skrId + row.owner}
                                                    className={`${styles.row} ${
                                                        isMedal ? styles.medalRow : ""
                                                    }`}
                                                >
                                                    <td className={styles.tdRank}>
                                                        {isMedal ? (
                                                            <span
                                                                className={styles.medal}
                                                                style={{ color: MEDAL_COLORS[i] }}
                                                            >
                                                                {MEDALS[i]}
                                                            </span>
                                                        ) : (
                                                            <span className={styles.rank}>{i + 1}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Link
                                                            href={`/id/${skrId}`}
                                                            className={styles.skrLink}
                                                        >
                                                            {skrId}
                                                        </Link>
                                                    </td>
                                                    <td
                                                        className={`${styles.tdNum} ${styles.tdActive}`}
                                                    >
                                                        <TxCell n={row.txDay} highlight />
                                                    </td>
                                                    <td className={styles.tdNum}>
                                                        <TxCell n={row.txWeek} />
                                                    </td>
                                                    <td className={styles.tdNum}>
                                                        <TxCell n={row.txMonth} />
                                                    </td>
                                                    <td className={styles.tdNum}>
                                                        {row.lastUsed ? (
                                                            <span className={styles.lastUsed}>
                                                                {timeAgo(row.lastUsed)}
                                                            </span>
                                                        ) : (
                                                            <span className={styles.noActivity}>—</span>
                                                        )}
                                                    </td>
                                                    <td className={styles.tdDate}>
                                                        {row.createdAt ? (
                                                            <span className={styles.dateCell}>
                                                                {row.createdAt.slice(0, 10)}
                                                            </span>
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
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function Insight({
    label,
    value,
    hint,
    accent,
}: {
    label: string;
    value: string;
    hint: string;
    accent?: string;
}) {
    return (
        <div className={styles.insightCard}>
            <div className={styles.insightLabel}>{label}</div>
            <div
                className={styles.insightValue}
                style={accent ? { color: accent } : undefined}
            >
                {value}
            </div>
            <div className={styles.insightHint}>{hint}</div>
        </div>
    );
}

function HeadlineCard({
    label,
    value,
    total,
    delta,
    accent,
}: {
    label: string;
    value: number;
    total: number;
    delta: number | null;
    accent: string;
}) {
    return (
        <div
            className={styles.headlineCard}
            style={{ ["--accent" as unknown as string]: accent } as React.CSSProperties}
        >
            <div className={styles.headlineLabel}>{label}</div>
            <div className={styles.headlineValue}>{value.toLocaleString()}</div>
            <div className={styles.headlineFoot}>
                <span className={styles.headlinePct}>
                    {total > 0 ? `${((value / total) * 100).toFixed(2)}% of all IDs` : "—"}
                </span>
                <Delta value={delta} />
            </div>
        </div>
    );
}

function SeriesToggle({
    label,
    color,
    active,
    onClick,
}: {
    label: string;
    color: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${styles.seriesToggle} ${active ? styles.seriesActive : ""}`}
            style={{ ["--c" as unknown as string]: color } as React.CSSProperties}
            aria-pressed={active}
        >
            <span className={styles.seriesDot} />
            <span>{label}</span>
        </button>
    );
}

function TxCell({ n, highlight }: { n: number; highlight?: boolean }) {
    const cls = highlight ? styles.txCount : styles.txCountMuted;
    return (
        <span className={cls}>
            {n.toLocaleString()}
            {n >= 100 && <span className={styles.capMark}>+</span>}
        </span>
    );
}

type TooltipEntry = {
    color?: string;
    name?: string;
    value?: number;
    dataKey?: string | number;
};

function TrendTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className={styles.tooltip}>
            <div className={styles.tooltipLabel}>{label}</div>
            {payload.map((p) => (
                <div key={String(p.dataKey)} className={styles.tooltipRow}>
                    <span className={styles.tooltipDot} style={{ background: p.color }} />
                    <span className={styles.tooltipName}>{p.name}</span>
                    <span className={styles.tooltipValue}>
                        {(p.value ?? 0).toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

function buildShareText(das: DasResponse | null): string {
    if (!das) return "📱 Seeker DAS — Daily Active Seekers";
    const stick = das.mas > 0 ? ((das.das / das.mas) * 100).toFixed(1) : "—";
    return (
        `📱 Seeker DAS\n\n` +
        `DAS · 24h: ${das.das.toLocaleString()}\n` +
        `WAS · 7d:  ${das.was.toLocaleString()}\n` +
        `MAS · 30d: ${das.mas.toLocaleString()}\n` +
        `Stickiness: ${stick}%\n` +
        `of ${das.totalIndexed.toLocaleString()} .skr IDs`
    );
}

function ShareRow({ das }: { das: DasResponse | null }) {
    const [copied, setCopied] = useState(false);
    const text = buildShareText(das);
    const url = "https://seekertracker.com/das";
    const tweet = `${text}\n\n${url}\n\nvia @seeker_tracker`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(`${text}\n\n${url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            /* ignore */
        }
    };

    return (
        <div className={styles.shareRow}>
            <span className={styles.shareLabel}>Share</span>
            <a
                href={xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareBtn}
                aria-label="Share on X"
            >
                <FaXTwitter />
                <span>X</span>
            </a>
            <a
                href={tgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.shareBtnTg}`}
                aria-label="Share on Telegram"
            >
                <FaTelegram />
                <span>Telegram</span>
            </a>
            <button
                type="button"
                className={styles.shareBtn}
                onClick={onCopy}
                aria-label="Copy stats"
            >
                {copied ? <FaCheck /> : <FaCopy />}
                <span>{copied ? "Copied" : "Copy"}</span>
            </button>
        </div>
    );
}

function DistRow({
    label,
    hint,
    count,
    total,
    color,
    emptyNote,
}: {
    label: string;
    hint: string;
    count: number;
    total: number;
    color: string;
    emptyNote?: string;
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
                    style={{
                        width: count > 0 ? `${Math.max(0.5, pct)}%` : "0%",
                        background: color,
                        opacity: count > 0 ? 0.85 : 0.25,
                    }}
                />
            </div>
            <div className={styles.distCount}>
                <span className={styles.distNum}>{count.toLocaleString()}</span>
                <span className={styles.distPct}>
                    {count > 0 ? `${pct.toFixed(1)}%` : emptyNote ? "n/a" : "0%"}
                </span>
                {count === 0 && emptyNote ? (
                    <span className={styles.distEmptyNote}>{emptyNote}</span>
                ) : null}
            </div>
        </div>
    );
}
