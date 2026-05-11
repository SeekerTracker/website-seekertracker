import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function GET() {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        return NextResponse.json({ error: "Turso not configured" }, { status: 503 });
    }

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        const [current, history, meta] = await Promise.all([
            // Live counts from seeker_usage
            client.execute(`
                SELECT
                    COUNT(CASE WHEN tx_day  > 0 THEN 1 END) AS das,
                    COUNT(CASE WHEN tx_week > 0 THEN 1 END) AS was,
                    COUNT(CASE WHEN tx_month > 0 THEN 1 END) AS mas,
                    COUNT(*) AS total_indexed
                FROM seeker_usage
            `),
            // Past 30 days of snapshots
            client.execute(`
                SELECT date, das, was, mas, total_indexed
                FROM seeker_das_history
                ORDER BY date DESC
                LIMIT 30
            `),
            client.execute(`SELECT value FROM seeker_usage_meta WHERE key = 'last_run'`),
        ]);

        const row = current.rows[0] as { das: number; was: number; mas: number; total_indexed: number } | undefined;
        const updatedAt = meta.rows[0] ? parseInt(meta.rows[0].value as string) : null;

        return NextResponse.json(
            {
                das: row?.das ?? 0,
                was: row?.was ?? 0,
                mas: row?.mas ?? 0,
                totalIndexed: row?.total_indexed ?? 0,
                updatedAt,
                history: history.rows.map((r) => ({
                    date: r.date as string,
                    das: r.das as number,
                    was: r.was as number,
                    mas: r.mas as number,
                })).reverse(), // oldest first for charting
            },
            { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
        );
    } catch (err) {
        console.error("DAS API error:", err);
        return NextResponse.json({ error: "Failed to fetch DAS data" }, { status: 500 });
    }
}
