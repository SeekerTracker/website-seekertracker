"use client";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import { IoPhonePortraitOutline, IoWarningOutline } from "react-icons/io5";
import { FaXTwitter, FaTelegram } from "react-icons/fa6";
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

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#ffc800", "#b4b4b4", "#c8823c"];

const COLOR_DAS = "#00ffd9";
const COLOR_WAS = "#00b388";
const COLOR_MAS = "#5d7777";
const COLOR_STICKY = "#ffc800";

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

function formatTickDate(iso: string): string {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
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

export default function DasPage() {
    const [das, setDas] = useState<DasResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState({ DAS: true, WAS: true, MAS: true });

    useEffect(() => {
        setMounted(true);
        fetch("https://seeker-das-scanner.gm-4e8.workers.dev/public/das")
            .then((r) => r.json())
            .then((d) => {
                if (d?.error) setError(d.error);
                else setDas(d);
            })
            .catch((e) => setError(String(e)));
    }, []);

    const history = das?.history ?? [];

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
            history.map((h) => ({
                date: h.date,
                label: formatTickDate(h.date),
                DAS: h.das,
                WAS: h.was,
                MAS: h.mas,
                stickiness: h.mas > 0 ? Number(((h.das / h.mas) * 100).toFixed(2)) : 0,
            })),
        [history]
    );

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

    const top = das?.top ?? [];

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

            <ShareRow das={das} />

            <div className={styles.disclaimer}>
                <IoWarningOutline />
                <span>
                    Unofficial figures derived from public RPC scans every ~6 hours. Tx counts are
                    capped at the most-recent 100 signatures per ID — IDs above that ceiling will
                    tie. Don&apos;t use this page for trading or compliance.
                </span>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {!das && !error && <p className={styles.loading}>Loading…</p>}

            {das && (
                <>
                    {/* Headline */}
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

                    {/* Active-IDs trend */}
                    {trendData.length > 1 && (
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <div>
                                    <div className={styles.chartTitle}>Active IDs over time</div>
                                    <div className={styles.chartSub}>
                                        {trendData.length} day{trendData.length === 1 ? "" : "s"} of
                                        history · tap a series to toggle
                                    </div>
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
                                                cursor={{ stroke: "rgba(0, 255, 217, 0.25)", strokeDasharray: 3 }}
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

                    {/* Stickiness trend */}
                    {trendData.length > 1 && stickinessNow != null && (
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <div>
                                    <div className={styles.chartTitle}>Stickiness (DAS / MAS)</div>
                                    <div className={styles.chartSub}>
                                        Share of monthly-actives that returned in the last 24h. Higher = more engaged base.
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

                    {/* Distribution */}
                    {dist && distTotal > 0 && (
                        <div className={styles.distCard}>
                            <div className={styles.distHeader}>
                                <span className={styles.distTitle}>30-day tx distribution</span>
                                <span className={styles.distMeta}>
                                    {distTotal.toLocaleString()} IDs
                                </span>
                            </div>
                            <DistRow label="Dormant" hint="0 txs" count={dist.dormant} total={distTotal} color="#3a4a4a" />
                            <DistRow label="Light" hint="1–5 txs" count={dist.light} total={distTotal} color="#00b388" />
                            <DistRow label="Regular" hint="6–20 txs" count={dist.regular} total={distTotal} color="#00ffae" />
                            <DistRow label="Heavy" hint="21–100 txs" count={dist.heavy} total={distTotal} color="#ffc800" />
                            {dist.power > 0 && (
                                <DistRow label="Power" hint="100+ txs" count={dist.power} total={distTotal} color="#ff8400" />
                            )}
                        </div>
                    )}

                    {/* Leaderboard */}
                    <div className={styles.boardCard}>
                        <div className={styles.boardHeader}>
                            <div>
                                <div className={styles.boardTitle}>Most-active IDs · last 24h</div>
                                <div className={styles.boardSub}>
                                    Sorted by 24h tx count. The RPC scan caps at 100 signatures per
                                    ID, so the top of the leaderboard ties.
                                </div>
                            </div>
                        </div>
                        {top.length === 0 ? (
                            <p className={styles.empty}>No active IDs in this window.</p>
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
                                        {top.map((row, i) => {
                                            const skrId = `${row.subdomain}${row.domain}`;
                                            const isMedal = i < 3;
                                            return (
                                                <tr
                                                    key={skrId}
                                                    className={`${styles.row} ${isMedal ? styles.medalRow : ""}`}
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
                                                        <Link href={`/id/${skrId}`} className={styles.skrLink}>
                                                            {skrId}
                                                        </Link>
                                                    </td>
                                                    <td className={`${styles.tdNum} ${styles.tdActive}`}>
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
                                                            <span className={styles.lastUsed}>{timeAgo(row.lastUsed)}</span>
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

function ShareRow({ das }: { das: DasResponse | null }) {
    const text = das
        ? `📱 Seeker DAS\n\n` +
          `DAS · 24h: ${das.das.toLocaleString()}\n` +
          `WAS · 7d:  ${das.was.toLocaleString()}\n` +
          `MAS · 30d: ${das.mas.toLocaleString()}\n` +
          `of ${das.totalIndexed.toLocaleString()} .skr IDs`
        : "📱 Seeker DAS — Daily Active Seekers";
    const url = "https://seekertracker.com/das";
    const tweet = `${text}\n\n${url}\n\nvia @seeker_tracker`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

    return (
        <div className={styles.shareRow}>
            <span className={styles.shareLabel}>Share:</span>
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
        </div>
    );
}

function DistRow({
    label,
    hint,
    count,
    total,
    color,
}: {
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
