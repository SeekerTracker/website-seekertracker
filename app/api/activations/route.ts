import { NextRequest, NextResponse } from "next/server";
import { BE_URL } from "app/(utils)/constant";

/**
 * GET /api/activations?view=day|week|month
 *
 * Returns Seeker ID activation stats aggregated by day, week, or month.
 * Data is sourced from the backend WebSocket data via REST proxy.
 */
export async function GET(request: NextRequest) {
    const view = request.nextUrl.searchParams.get("view") || "day";

    try {
        // Fetch domain data from backend
        const response = await fetch(`${BE_URL}/domain/stats`, {
            headers: { accept: "application/json" },
            next: { revalidate: 300 }, // 5 min cache
        });

        let domainsByDate: Record<string, number> = {};
        let totalDomains = 0;

        if (response.ok) {
            const data = await response.json();
            domainsByDate = data.domainsByDate || {};
            totalDomains = data.totalDomains || 0;
        } else {
            // Fallback: try the summary endpoint
            const summaryRes = await fetch(`${BE_URL}/domain/all`, {
                next: { revalidate: 300 },
            });
            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                if (summaryData.domainsByDate) {
                    domainsByDate = summaryData.domainsByDate;
                    totalDomains = summaryData.totalDomains || 0;
                }
            }
        }

        const entries = Object.entries(domainsByDate).sort(([a], [b]) => a.localeCompare(b));
        const today = new Date().toISOString().slice(0, 10);

        // Helper: ISO week key
        const getISOWeek = (dateStr: string) => {
            const d = new Date(dateStr + "T00:00:00Z");
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
            return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
        };

        // Today count
        const todayCount = domainsByDate[today] || 0;

        // This week count
        const thisWeekKey = getISOWeek(today);
        let thisWeekCount = 0;
        for (const [date, count] of entries) {
            if (getISOWeek(date) === thisWeekKey) thisWeekCount += count;
        }

        // This month count
        const thisMonthKey = today.slice(0, 7);
        let thisMonthCount = 0;
        for (const [date, count] of entries) {
            if (date.startsWith(thisMonthKey)) thisMonthCount += count;
        }

        let chartData: { label: string; count: number }[] = [];

        if (view === "day") {
            // Last 30 days, fill gaps with 0
            const map = new Map<string, number>();
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                map.set(d.toISOString().slice(0, 10), 0);
            }
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const cutoffStr = cutoff.toISOString().slice(0, 10);
            for (const [date, count] of entries) {
                if (date >= cutoffStr) map.set(date, count);
            }
            chartData = Array.from(map.entries()).map(([date, count]) => ({
                label: date,
                count,
            }));
        } else if (view === "week") {
            const weekMap = new Map<string, number>();
            for (const [date, count] of entries) {
                const wk = getISOWeek(date);
                weekMap.set(wk, (weekMap.get(wk) || 0) + count);
            }
            const sorted = Array.from(weekMap.entries()).sort(([a], [b]) => a.localeCompare(b));
            chartData = sorted.slice(-12).map(([wk, count]) => ({
                label: wk,
                count,
            }));
        } else {
            // month
            const monthMap = new Map<string, number>();
            for (const [date, count] of entries) {
                const mo = date.slice(0, 7);
                monthMap.set(mo, (monthMap.get(mo) || 0) + count);
            }
            const sorted = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
            chartData = sorted.slice(-12).map(([mo, count]) => ({
                label: mo,
                count,
            }));
        }

        return NextResponse.json({
            view,
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
