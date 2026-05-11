import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { io } from "socket.io-client";
import { WS_URL, CONN_RPC_URL } from "app/(utils)/constant";
import { DomainInfo } from "app/(utils)/constantTypes";

type Period = "day" | "week" | "month";

// --------------- Turso path ---------------

async function fromTurso(period: Period) {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const col = period === "day" ? "tx_day" : period === "week" ? "tx_week" : "tx_month";

    const [rows, meta] = await Promise.all([
        client.execute(`
            SELECT subdomain, domain, owner, tx_day, tx_week, tx_month, last_used
            FROM seeker_usage
            ORDER BY ${col} DESC
        `),
        client.execute(`SELECT key, value FROM seeker_usage_meta`),
    ]);

    if (rows.rows.length === 0) return null;

    const metaMap: Record<string, string> = {};
    for (const r of meta.rows) metaMap[r.key as string] = r.value as string;

    const data = rows.rows.map((r) => ({
        subdomain: r.subdomain as string,
        domain: r.domain as string,
        owner: r.owner as string,
        txDay: r.tx_day as number,
        txWeek: r.tx_week as number,
        txMonth: r.tx_month as number,
        txCount: (period === "day" ? r.tx_day : period === "week" ? r.tx_week : r.tx_month) as number,
        lastUsed: r.last_used as number | null,
    }));

    const activeCount = data.filter((d) => d.txCount > 0).length;

    return {
        period,
        activeCount,
        total: data.length,
        updatedAt: metaMap.last_run ? parseInt(metaMap.last_run) : null,
        data,
    };
}

// --------------- Live fallback path ---------------

async function getOwnerTxData(owner: string) {
    const now = Math.floor(Date.now() / 1000);
    const res = await fetch(CONN_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "sigs",
            method: "getSignaturesForAddress",
            params: [owner, { limit: 1000 }],
        }),
    });
    const json = await res.json();
    const sigs: { blockTime: number | null }[] = json.result ?? [];
    const lastUsed = sigs[0]?.blockTime ?? null;
    return {
        txDay: sigs.filter((s) => s.blockTime != null && s.blockTime >= now - 86_400).length,
        txWeek: sigs.filter((s) => s.blockTime != null && s.blockTime >= now - 7 * 86_400).length,
        txMonth: sigs.filter((s) => s.blockTime != null && s.blockTime >= now - 30 * 86_400).length,
        lastUsed,
    };
}

async function runConcurrent<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
        const batch = await Promise.all(tasks.slice(i, i + concurrency).map((t) => t()));
        results.push(...batch);
    }
    return results;
}

async function fromLive(period: Period) {
    const domains = await new Promise<DomainInfo[]>((resolve, reject) => {
        const socket = io(WS_URL, { transports: ["websocket"], timeout: 8000 });
        const timer = setTimeout(() => { socket.disconnect(); reject(new Error("WS timeout")); }, 10_000);
        socket.on("connect", () => socket.emit("getDomains", { sortBy: "newest", limit: 200, page: 1 }));
        socket.on("sortedDomains", (data: { data: DomainInfo[] }) => {
            clearTimeout(timer);
            socket.disconnect();
            resolve(data.data ?? []);
        });
        socket.on("connect_error", (err: Error) => { clearTimeout(timer); socket.disconnect(); reject(err); });
    });

    const ownerSet = new Map<string, DomainInfo[]>();
    for (const d of domains) {
        if (!ownerSet.has(d.owner)) ownerSet.set(d.owner, []);
        ownerSet.get(d.owner)!.push(d);
    }

    const owners = Array.from(ownerSet.keys());
    const txDataMap = new Map<string, { txDay: number; txWeek: number; txMonth: number; lastUsed: number | null }>();

    await runConcurrent(
        owners.map((owner) => async () => {
            try {
                txDataMap.set(owner, await getOwnerTxData(owner));
            } catch {
                txDataMap.set(owner, { txDay: 0, txWeek: 0, txMonth: 0, lastUsed: null });
            }
        }),
        10
    );

    const periodCol = period === "day" ? "txDay" : period === "week" ? "txWeek" : "txMonth";
    const enriched = domains
        .map((d) => {
            const tx = txDataMap.get(d.owner) ?? { txDay: 0, txWeek: 0, txMonth: 0, lastUsed: null };
            return {
                subdomain: d.subdomain,
                domain: d.domain,
                owner: d.owner,
                txDay: tx.txDay,
                txWeek: tx.txWeek,
                txMonth: tx.txMonth,
                txCount: tx[periodCol],
                lastUsed: tx.lastUsed,
            };
        })
        .sort((a, b) => b.txCount !== a.txCount ? b.txCount - a.txCount : (b.lastUsed ?? 0) - (a.lastUsed ?? 0));

    return {
        period,
        activeCount: enriched.filter((d) => d.txCount > 0).length,
        total: enriched.length,
        updatedAt: null,
        data: enriched,
    };
}

// --------------- Handler ---------------

export async function GET(req: NextRequest) {
    const period = (req.nextUrl.searchParams.get("period") ?? "day") as Period;

    // Try Turso first
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        try {
            const result = await fromTurso(period);
            if (result) {
                return NextResponse.json(result, {
                    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
                });
            }
        } catch (err) {
            console.warn("Turso read failed, falling back to live:", err);
        }
    }

    // Fall back to live query
    try {
        const result = await fromLive(period);
        return NextResponse.json(result, {
            headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" },
        });
    } catch (err) {
        console.error("Usage API error:", err);
        return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 });
    }
}
