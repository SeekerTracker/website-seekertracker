import { NextRequest, NextResponse } from "next/server";
import { domainStats } from "app/(utils)/lib/domainStore";

const getISOWeek = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view") || "day";
  const dateParam =
    request.nextUrl.searchParams.get("date") ||
    new Date().toISOString().slice(0, 10);

  try {
    const { total, domainsByDate } = await domainStats();
    const entries = Object.entries(domainsByDate).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = domainsByDate[today] || 0;

    const thisWeekKey = getISOWeek(today);
    let thisWeekCount = 0;
    for (const [date, count] of entries) {
      if (getISOWeek(date) === thisWeekKey) thisWeekCount += count;
    }

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
      chartData = Array.from(map.entries()).map(([date, count]) => ({
        label: date,
        count,
      }));
    } else if (view === "week") {
      const weekMap = new Map<string, number>();
      for (const [date, count] of entries) {
        const key = getISOWeek(date);
        weekMap.set(key, (weekMap.get(key) || 0) + count);
      }
      chartData = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([label, count]) => ({ label, count }));
    } else {
      const monthMap = new Map<string, number>();
      for (const [date, count] of entries) {
        const key = date.slice(0, 7);
        monthMap.set(key, (monthMap.get(key) || 0) + count);
      }
      chartData = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([label, count]) => ({ label, count }));
    }

    return NextResponse.json({
      view,
      date: dateParam,
      totalDomains: total,
      todayCount,
      thisWeekCount,
      thisMonthCount,
      data: chartData,
    });
  } catch (e) {
    console.error("activations API", e);
    return NextResponse.json(
      { error: "Failed to load activations" },
      { status: 500 }
    );
  }
}
