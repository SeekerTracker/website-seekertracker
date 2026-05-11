import { NextRequest, NextResponse } from "next/server";
import { io } from "socket.io-client";
import { WS_URL, CONN_RPC_URL } from "app/(utils)/constant";
import { DomainInfo } from "app/(utils)/constantTypes";

type Period = "day" | "week" | "month";

const PERIOD_SECONDS: Record<Period, number> = {
    day: 86_400,
    week: 7 * 86_400,
    month: 30 * 86_400,
};

const FETCH_LIMIT = 200;
const CONCURRENCY = 10;

async function getOwnerTxData(
    owner: string,
    since: number
): Promise<{ txCount: number; lastUsed: number | null }> {
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
    const txCount = sigs.filter((s) => s.blockTime != null && s.blockTime >= since).length;
    return { txCount, lastUsed };
}

async function runConcurrent<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number
): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
        const batch = await Promise.all(tasks.slice(i, i + concurrency).map((t) => t()));
        results.push(...batch);
    }
    return results;
}

export async function GET(req: NextRequest) {
    const period = (req.nextUrl.searchParams.get("period") ?? "day") as Period;
    const since = Math.floor(Date.now() / 1000) - PERIOD_SECONDS[period];

    let domains: DomainInfo[];
    try {
        domains = await new Promise<DomainInfo[]>((resolve, reject) => {
            const socket = io(WS_URL, { transports: ["websocket"], timeout: 8000 });
            const timer = setTimeout(() => { socket.disconnect(); reject(new Error("WS timeout")); }, 10_000);

            socket.on("connect", () => {
                socket.emit("getDomains", { sortBy: "newest", limit: FETCH_LIMIT, page: 1 });
            });

            socket.on("sortedDomains", (data: { data: DomainInfo[] }) => {
                clearTimeout(timer);
                socket.disconnect();
                resolve(data.data ?? []);
            });

            socket.on("connect_error", (err: Error) => {
                clearTimeout(timer);
                socket.disconnect();
                reject(err);
            });
        });
    } catch (err) {
        console.error("Usage API – WS error:", err);
        return NextResponse.json({ error: "Failed to fetch domain list" }, { status: 500 });
    }

    // Deduplicate by owner to avoid redundant Helius calls
    const ownerSet = new Map<string, DomainInfo[]>();
    for (const d of domains) {
        if (!ownerSet.has(d.owner)) ownerSet.set(d.owner, []);
        ownerSet.get(d.owner)!.push(d);
    }

    const owners = Array.from(ownerSet.keys());
    const txDataMap = new Map<string, { txCount: number; lastUsed: number | null }>();

    const tasks = owners.map((owner) => async () => {
        try {
            const result = await getOwnerTxData(owner, since);
            txDataMap.set(owner, result);
        } catch {
            txDataMap.set(owner, { txCount: 0, lastUsed: null });
        }
    });

    await runConcurrent(tasks, CONCURRENCY);

    // Merge tx data back into domain rows
    const enriched = domains.map((d) => ({
        ...d,
        txCount: txDataMap.get(d.owner)?.txCount ?? 0,
        lastUsed: txDataMap.get(d.owner)?.lastUsed ?? null,
    }));

    // Sort by txCount descending, then by lastUsed descending
    enriched.sort((a, b) =>
        b.txCount !== a.txCount
            ? b.txCount - a.txCount
            : (b.lastUsed ?? 0) - (a.lastUsed ?? 0)
    );

    const activeCount = enriched.filter((d) => d.txCount > 0).length;

    return NextResponse.json(
        {
            period,
            since,
            activeCount,
            total: enriched.length,
            data: enriched,
        },
        {
            headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" },
        }
    );
}
