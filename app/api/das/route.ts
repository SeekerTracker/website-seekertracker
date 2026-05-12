import { NextResponse } from "next/server";

function tursoUrl() {
    const url = process.env.TURSO_DATABASE_URL ?? "";
    return url.startsWith("libsql://") ? url.replace("libsql://", "https://") : url;
}

async function tursoQuery(sql: string, params: unknown[] = []) {
    const res = await fetch(tursoUrl(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ statements: [{ q: sql, params }] }),
    });
    if (!res.ok) throw new Error(`Turso HTTP ${res.status}`);
    const data = await res.json();
    if (data[0]?.error) throw new Error(`Turso: ${JSON.stringify(data[0].error)}`);
    return data[0]?.results ?? {};
}

export async function GET() {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        return NextResponse.json({ error: "Turso not configured" }, { status: 503 });
    }

    try {
        const [current, history, meta] = await Promise.all([
            tursoQuery(`
                SELECT
                    COUNT(CASE WHEN tx_day  > 0 THEN 1 END) AS das,
                    COUNT(CASE WHEN tx_week > 0 THEN 1 END) AS was,
                    COUNT(CASE WHEN tx_month > 0 THEN 1 END) AS mas,
                    COUNT(*) AS total_indexed
                FROM seeker_usage
            `),
            tursoQuery(`
                SELECT date, das, was, mas, total_indexed
                FROM seeker_das_history
                ORDER BY date DESC
                LIMIT 30
            `),
            tursoQuery(`SELECT value FROM seeker_usage_meta WHERE key = 'last_run'`),
        ]);

        const row = current.rows?.[0] as [number, number, number, number] | undefined;
        const updatedAt = meta.rows?.[0]?.[0] ? parseInt(meta.rows[0][0] as string) : null;

        return NextResponse.json(
            {
                das: row?.[0] ?? 0,
                was: row?.[1] ?? 0,
                mas: row?.[2] ?? 0,
                totalIndexed: row?.[3] ?? 0,
                updatedAt,
                history: (history.rows as [string, number, number, number][])
                    .map((r) => ({ date: r[0], das: r[1], was: r[2], mas: r[3] }))
                    .reverse(),
            },
            { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
        );
    } catch (err) {
        console.error("DAS API error:", err);
        return NextResponse.json({ error: "Failed to fetch DAS data" }, { status: 500 });
    }
}
