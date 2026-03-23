import { NextRequest, NextResponse } from "next/server";
import { io } from "socket.io-client";
import { WS_URL } from "app/(utils)/constant";

// Helper: ISO week key
const getISOWeek = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

/**
 * GET /api/activations?view=day|week|month&date=YYYY-MM-DD
 *
 * Connects to the backend WebSocket to fetch domainsByDate,
 * then aggregates by day/week/month.
 */
export async function GET(request: NextRequest) {
    const view = request.nextUrl.searchParams.get("view") || "day";
    const dateParam = request.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);

    try {
        // Connect to WebSocket and fetch data
        const wsData = await new Promise<{
            totalDomains: number;
            domainsByDate: Record<string, number>;
        }>((resolve, reject) => {
            const socket = io(WS_URL, {
                transports: ["websocket"],
                timeout: 8000,
            });

            const timer = setTimeout(() => {
                socket.disconnect();
                reject(new Error("WebSocket timeout"));
            }, 10000);

            socket.on("connect", () => {
                socket.emit("getDomains", { sortBy: "newest", limit: 1 });
            });

            socket.on("sortedDomains", (data: {
                totalDomains: number;
                domainsByDate: Record<string, number>;
            }) => {
                clearTimeout(timer);
                socket.disconnect();
                resolve({
                    totalDomains: data.totalDomains || 0,
                    domainsByDate: data.domainsByDate || {},
                });
            });

            socket.on("connect_error", (err: Error) => {
                clearTimeout(timer);
                socket.disconnect();
                reject(err);
            });
        });

        const { totalDomains, domainsByDate } = wsData;
        const entries = Object.entries(domainsByDate).sort(([a], [b]) => a.localeCompare(b));
        const today = new Date().toISOString().slice(0, 10);

        // Today
        const todayCount = domainsByDate[today] || 0;

        // This week
        const thisWeekKey = getISOWeek(today);
        let thisWeekCount = 0;
        for (const [date, count] of entries) {
            if (getISOWeek(date) === thisWeekKey) thisWeekCount += count;
        }

        // This month
        const thisMonthKey = today.slice(0, 7);
        let thisMonthCount = 0;
        for (const [date, count] of entries) {
            if (date.startsWith(thisMonthKey)) thisMonthCount += count;
        }

        let chartData: { label: string; count: number }[] = [];

        if (view === "day") {
            const anchor = new Date(dateParam + "T00:00:00Z");
            const map = new Map<string, number>();
            for (let i = 29; i >= 0; i--) {
                const d = new Date(anchor);
                d.setUTCDate(d.getUTCDate() - i);
                map.set(d.toISOString().slice(0, 10), 0);
            }
            for (const [date, count] of entries) {
                if (map.has(date)) map.set(date, count);
            }
            chartData = Array.from(map.entries()).map(([date, count]) => ({ label: date, count }));
        } else if (view === "week") {
            const weekMap = new Map<string, number>();
            for (const [date, count] of entries) {
                const wk = getISOWeek(date);
                weekMap.set(wk, (weekMap.get(wk) || 0) + count);
            }
            const anchorWeek = getISOWeek(dateParam);
            const allWeeks = Array.from(weekMap.keys()).sort();
            const anchorIdx = allWeeks.indexOf(anchorWeek);
            const sliceEnd = anchorIdx >= 0 ? anchorIdx + 1 : allWeeks.length;
            const sliceStart = Math.max(0, sliceEnd - 12);
            chartData = allWeeks.slice(sliceStart, sliceEnd).map(wk => ({
                label: wk, count: weekMap.get(wk) || 0,
            }));
        } else {
            const monthMap = new Map<string, number>();
            for (const [date, count] of entries) {
                const mo = date.slice(0, 7);
                monthMap.set(mo, (monthMap.get(mo) || 0) + count);
            }
            const aDate = new Date(dateParam.slice(0, 7) + "-01T00:00:00Z");
            const months: string[] = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(aDate);
                d.setUTCMonth(d.getUTCMonth() - i);
                months.push(d.toISOString().slice(0, 7));
            }
            chartData = months.map(mo => ({ label: mo, count: monthMap.get(mo) || 0 }));
        }

        return NextResponse.json({
            view,
            date: dateParam,
            totalDomains,
            todayCount,
            thisWeekCount,
            thisMonthCount,
            data: chartData,
        });
    } catch (error) {
        console.error("Activations API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch activation data" },
            { status: 500 }
        );
    }
}
