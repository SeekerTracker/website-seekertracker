"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./page.module.css";
import { useDataContext } from "app/(utils)/context/dataProvider";
import { IoBarChart, IoChevronBack, IoChevronForward } from "react-icons/io5";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

type ViewMode = "day" | "week" | "month";

// Helper: ISO week key
const getISOWeek = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

// Helper: format date for display
const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
};

// Helper: get all dates in a week from ISO week key
const getWeekRange = (weekKey: string) => {
    const [yearStr, weekStr] = weekKey.split("-W");
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    // Jan 4 is always in week 1
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7;
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    return `${fmt(monday)} – ${fmt(sunday)}`;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ActivationsPage() {
    const { backendWS } = useDataContext();
    const [domainsByDate, setDomainsByDate] = useState<Record<string, number>>({});
    const [totalDomains, setTotalDomains] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [view, setView] = useState<ViewMode>("day");

    // Navigation: selectedDate is the anchor date for the current view
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

    useEffect(() => {
        if (!backendWS) return;
        backendWS.emit("getDomains", { sortBy: "newest", limit: 1 });
        const handler = (data: { totalDomains: number; domainsByDate: Record<string, number> }) => {
            setTotalDomains(data.totalDomains);
            setDomainsByDate(data.domainsByDate || {});
            setLoaded(true);
        };
        backendWS.on("sortedDomains", handler);
        return () => { backendWS.off("sortedDomains", handler); };
    }, [backendWS]);

    const today = new Date().toISOString().slice(0, 10);

    // Navigation handlers
    const navigate = useCallback((direction: -1 | 1) => {
        setSelectedDate(prev => {
            const d = new Date(prev + "T00:00:00Z");
            if (view === "day") {
                d.setUTCDate(d.getUTCDate() + direction * 30);
            } else if (view === "week") {
                d.setUTCDate(d.getUTCDate() + direction * 12 * 7);
            } else {
                d.setUTCMonth(d.getUTCMonth() + direction * 12);
            }
            return d.toISOString().slice(0, 10);
        });
    }, [view]);

    const goToNow = useCallback(() => {
        setSelectedDate(new Date().toISOString().slice(0, 10));
    }, []);

    // Selected period summary
    const selectedPeriodLabel = useMemo(() => {
        const d = new Date(selectedDate + "T00:00:00Z");
        if (view === "day") {
            return formatDate(selectedDate);
        } else if (view === "week") {
            return getWeekRange(getISOWeek(selectedDate));
        } else {
            return `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        }
    }, [selectedDate, view]);

    const selectedCount = useMemo(() => {
        if (view === "day") {
            return domainsByDate[selectedDate] || 0;
        } else if (view === "week") {
            const wk = getISOWeek(selectedDate);
            let sum = 0;
            for (const [date, count] of Object.entries(domainsByDate)) {
                if (getISOWeek(date) === wk) sum += count;
            }
            return sum;
        } else {
            const mo = selectedDate.slice(0, 7);
            let sum = 0;
            for (const [date, count] of Object.entries(domainsByDate)) {
                if (date.startsWith(mo)) sum += count;
            }
            return sum;
        }
    }, [domainsByDate, selectedDate, view]);

    // Summary cards
    const todayCount = domainsByDate[today] || 0;
    const thisWeekKey = getISOWeek(today);
    const thisWeekCount = useMemo(() => {
        let sum = 0;
        for (const [date, count] of Object.entries(domainsByDate)) {
            if (getISOWeek(date) === thisWeekKey) sum += count;
        }
        return sum;
    }, [domainsByDate, thisWeekKey]);
    const thisMonthKey = today.slice(0, 7);
    const thisMonthCount = useMemo(() => {
        let sum = 0;
        for (const [date, count] of Object.entries(domainsByDate)) {
            if (date.startsWith(thisMonthKey)) sum += count;
        }
        return sum;
    }, [domainsByDate, thisMonthKey]);

    // Chart data based on selectedDate as the end anchor
    const chartData = useMemo(() => {
        const entries = Object.entries(domainsByDate).sort(([a], [b]) => a.localeCompare(b));
        const anchor = new Date(selectedDate + "T00:00:00Z");

        if (view === "day") {
            // 30 days ending on selectedDate
            const map = new Map<string, number>();
            for (let i = 29; i >= 0; i--) {
                const d = new Date(anchor);
                d.setUTCDate(d.getUTCDate() - i);
                map.set(d.toISOString().slice(0, 10), 0);
            }
            for (const [date, count] of entries) {
                if (map.has(date)) map.set(date, count);
            }
            return Array.from(map.entries()).map(([date, count]) => ({
                label: date.slice(5),
                fullDate: date,
                count,
            }));
        }

        if (view === "week") {
            // 12 weeks ending on the week containing selectedDate
            const anchorWeek = getISOWeek(selectedDate);
            const weekMap = new Map<string, number>();
            for (const [date, count] of entries) {
                const wk = getISOWeek(date);
                weekMap.set(wk, (weekMap.get(wk) || 0) + count);
            }
            const allWeeks = Array.from(weekMap.keys()).sort();
            const anchorIdx = allWeeks.indexOf(anchorWeek);
            // If anchor week exists, show 12 weeks ending there; otherwise show last 12
            let sliceEnd = anchorIdx >= 0 ? anchorIdx + 1 : allWeeks.length;
            let sliceStart = Math.max(0, sliceEnd - 12);
            return allWeeks.slice(sliceStart, sliceEnd).map(wk => ({
                label: wk,
                fullDate: wk,
                count: weekMap.get(wk) || 0,
            }));
        }

        // month: 12 months ending on the month containing selectedDate
        const anchorMonth = selectedDate.slice(0, 7);
        const monthMap = new Map<string, number>();
        for (const [date, count] of entries) {
            const mo = date.slice(0, 7);
            monthMap.set(mo, (monthMap.get(mo) || 0) + count);
        }
        // Generate 12 months ending at anchorMonth
        const months: string[] = [];
        const aDate = new Date(anchorMonth + "-01T00:00:00Z");
        for (let i = 11; i >= 0; i--) {
            const d = new Date(aDate);
            d.setUTCMonth(d.getUTCMonth() - i);
            months.push(d.toISOString().slice(0, 7));
        }
        return months.map(mo => ({
            label: mo,
            fullDate: mo,
            count: monthMap.get(mo) || 0,
        }));
    }, [domainsByDate, view, selectedDate]);

    // Click on a bar to select that period
    const handleBarClick = (data: { fullDate?: string }) => {
        if (!data?.fullDate) return;
        if (view === "day") {
            setSelectedDate(data.fullDate);
        } else if (view === "week") {
            // Parse week key back to a date
            const [yearStr, weekStr] = data.fullDate.split("-W");
            const year = parseInt(yearStr);
            const week = parseInt(weekStr);
            const jan4 = new Date(Date.UTC(year, 0, 4));
            const dayOfWeek = jan4.getUTCDay() || 7;
            const monday = new Date(jan4);
            monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
            setSelectedDate(monday.toISOString().slice(0, 10));
        } else {
            setSelectedDate(data.fullDate + "-15");
        }
    };

    const fmt = (n: number) => n.toLocaleString();

    const isAtPresent = selectedDate >= today;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                <IoBarChart /> Seeker ID Activations
            </h1>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>All-Time</div>
                    <div className={styles.summaryValue}>{fmt(totalDomains)}</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>Today</div>
                    <div className={styles.summaryValue}>{fmt(todayCount)}</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>This Week</div>
                    <div className={styles.summaryValue}>{fmt(thisWeekCount)}</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>This Month</div>
                    <div className={styles.summaryValue}>{fmt(thisMonthCount)}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {(["day", "week", "month"] as ViewMode[]).map((m) => (
                    <button
                        key={m}
                        className={`${styles.tab} ${view === m ? styles.tabActive : ""}`}
                        onClick={() => setView(m)}
                    >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <div className={styles.navigation}>
                <button className={styles.navButton} onClick={() => navigate(-1)}>
                    <IoChevronBack />
                </button>
                <div className={styles.navCenter}>
                    <div className={styles.navPeriod}>{selectedPeriodLabel}</div>
                    <div className={styles.navCount}>{fmt(selectedCount)} activations</div>
                </div>
                <button
                    className={`${styles.navButton} ${isAtPresent ? styles.navDisabled : ""}`}
                    onClick={() => navigate(1)}
                    disabled={isAtPresent}
                >
                    <IoChevronForward />
                </button>
                {!isAtPresent && (
                    <button className={styles.nowButton} onClick={goToNow}>
                        Now
                    </button>
                )}
            </div>

            {/* Date Picker */}
            <div className={styles.datePicker}>
                <input
                    type="date"
                    className={styles.dateInput}
                    value={selectedDate}
                    max={today}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>

            {/* Chart */}
            {!loaded ? (
                <div className={styles.loading}>Connecting to WebSocket…</div>
            ) : (
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 217, 0.15)" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "#888", fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: "#001a1a",
                                    border: "1px solid rgba(0, 255, 217, 0.3)",
                                    borderRadius: 8,
                                    color: "#ededed",
                                    fontFamily: "var(--font-jetbrains-mono), monospace",
                                }}
                                cursor={{ fill: "rgba(0,255,217,0.08)" }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#00ffd9"
                                radius={[4, 4, 0, 0]}
                                cursor="pointer"
                                onClick={(_data: unknown, index: number) => {
                                    const item = chartData[index];
                                    if (item) handleBarClick(item);
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
