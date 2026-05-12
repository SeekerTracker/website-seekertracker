import { NextResponse } from "next/server";

function tursoUrl() {
    const url = process.env.TURSO_DAS_URL ?? "";
    return url.startsWith("libsql://") ? url.replace("libsql://", "https://") : url;
}

async function tursoQuery(sql: string, params: unknown[] = []) {
    const res = await fetch(tursoUrl(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.TURSO_DAS_TOKEN}`,
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
    if (!process.env.TURSO_DAS_URL || !process.env.TURSO_DAS_TOKEN) {
        return NextResponse.json({ error: "Turso not configured" }, { status: 503 });
    }

    try {
        const [current, history, dist, top, meta] = await Promise.all([
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
            tursoQuery(`
                SELECT
                    SUM(CASE WHEN tx_month = 0 THEN 1 ELSE 0 END) AS dormant,
                    SUM(CASE WHEN tx_month BETWEEN 1  AND 5   THEN 1 ELSE 0 END) AS light,
                    SUM(CASE WHEN tx_month BETWEEN 6  AND 20  THEN 1 ELSE 0 END) AS regular,
                    SUM(CASE WHEN tx_month BETWEEN 21 AND 100 THEN 1 ELSE 0 END) AS heavy,
                    SUM(CASE WHEN tx_month > 100               THEN 1 ELSE 0 END) AS power
                FROM seeker_usage
            `),
            tursoQuery(`
                SELECT subdomain, domain, owner, tx_day, tx_week, tx_month, last_used, created_at
                FROM seeker_usage
                WHERE tx_day > 0
                ORDER BY tx_day DESC, last_used DESC
                LIMIT 20
            `),
            tursoQuery(`SELECT key, value FROM seeker_usage_meta`),
        ]);

        const row = current.rows?.[0] as [number, number, number, number] | undefined;
        const distRow = dist.rows?.[0] as [number, number, number, number, number] | undefined;
        const metaMap: Record<string, string> = {};
        for (const [k, v] of (meta.rows ?? [])) metaMap[k] = v;
        const updatedAt = metaMap.last_run ? parseInt(metaMap.last_run) : null;

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
                distribution: {
                    dormant: distRow?.[0] ?? 0,
                    light:   distRow?.[1] ?? 0,
                    regular: distRow?.[2] ?? 0,
                    heavy:   distRow?.[3] ?? 0,
                    power:   distRow?.[4] ?? 0,
                },
                top: (top.rows as [string, string, string, number, number, number, number | null, string | null][])
                    .map((r) => ({
                        subdomain: r[0],
                        domain: r[1],
                        owner: r[2],
                        txDay: r[3],
                        txWeek: r[4],
                        txMonth: r[5],
                        lastUsed: r[6],
                        createdAt: r[7],
                    })),
            },
            { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
        );
    } catch (err) {
        console.error("DAS API error:", err);
        return NextResponse.json({ error: "Failed to fetch DAS data" }, { status: 500 });
    }
}
