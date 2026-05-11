import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { io } from "socket.io-client";
import { WS_URL, CONN_RPC_URL } from "app/(utils)/constant";
import { DomainInfo } from "app/(utils)/constantTypes";

const HELIUS_CONCURRENCY = 20;
const MAX_DURATION_MS = 250_000; // stop gracefully before Vercel's 300s limit

function getTurso() {
    return createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });
}

async function ensureSchema(client: ReturnType<typeof getTurso>) {
    await client.batch([
        {
            sql: `CREATE TABLE IF NOT EXISTS seeker_usage (
                subdomain TEXT NOT NULL,
                domain TEXT NOT NULL,
                owner TEXT NOT NULL,
                tx_day INTEGER DEFAULT 0,
                tx_week INTEGER DEFAULT 0,
                tx_month INTEGER DEFAULT 0,
                last_used INTEGER,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (subdomain, domain)
            )`,
            args: [],
        },
        {
            sql: `CREATE TABLE IF NOT EXISTS seeker_usage_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )`,
            args: [],
        },
    ], "write");
}

async function fetchAllDomains(): Promise<DomainInfo[]> {
    return new Promise((resolve, reject) => {
        const socket = io(WS_URL, { transports: ["websocket"], timeout: 15_000 });
        const timer = setTimeout(() => { socket.disconnect(); reject(new Error("WS timeout")); }, 20_000);

        socket.on("connect", () => {
            socket.emit("getDomains", { sortBy: "oldest", limit: 100_000, page: 1 });
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
}

async function getOwnerTxCounts(owner: string, now: number) {
    const sinceSec = {
        day: now - 86_400,
        week: now - 7 * 86_400,
        month: now - 30 * 86_400,
    };

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
    const txDay = sigs.filter((s) => s.blockTime != null && s.blockTime >= sinceSec.day).length;
    const txWeek = sigs.filter((s) => s.blockTime != null && s.blockTime >= sinceSec.week).length;
    const txMonth = sigs.filter((s) => s.blockTime != null && s.blockTime >= sinceSec.month).length;

    return { txDay, txWeek, txMonth, lastUsed };
}

async function upsertBatch(
    client: ReturnType<typeof getTurso>,
    rows: {
        subdomain: string;
        domain: string;
        owner: string;
        txDay: number;
        txWeek: number;
        txMonth: number;
        lastUsed: number | null;
        updatedAt: number;
    }[]
) {
    await client.batch(
        rows.map((r) => ({
            sql: `INSERT OR REPLACE INTO seeker_usage
                    (subdomain, domain, owner, tx_day, tx_week, tx_month, last_used, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [r.subdomain, r.domain, r.owner, r.txDay, r.txWeek, r.txMonth, r.lastUsed, r.updatedAt],
        })),
        "write"
    );
}

export async function GET(req: NextRequest) {
    // Auth: Vercel cron sends Authorization: Bearer <CRON_SECRET>
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        return NextResponse.json({ error: "Turso not configured" }, { status: 503 });
    }

    const startTime = Date.now();
    const nowSec = Math.floor(startTime / 1000);
    const client = getTurso();

    await ensureSchema(client);

    // Fetch all domains
    let domains: DomainInfo[];
    try {
        domains = await fetchAllDomains();
    } catch (err) {
        return NextResponse.json({ error: `WS fetch failed: ${err}` }, { status: 500 });
    }

    // Deduplicate by owner → map owner → [domains]
    const ownerMap = new Map<string, DomainInfo[]>();
    for (const d of domains) {
        if (!ownerMap.has(d.owner)) ownerMap.set(d.owner, []);
        ownerMap.get(d.owner)!.push(d);
    }

    const owners = Array.from(ownerMap.keys());
    let processed = 0;
    let timedOut = false;
    const BATCH_SIZE = 50; // rows per Turso write

    for (let i = 0; i < owners.length; i += HELIUS_CONCURRENCY) {
        if (Date.now() - startTime > MAX_DURATION_MS) {
            timedOut = true;
            break;
        }

        const ownerBatch = owners.slice(i, i + HELIUS_CONCURRENCY);

        const results = await Promise.allSettled(
            ownerBatch.map((owner) => getOwnerTxCounts(owner, nowSec).then((counts) => ({ owner, ...counts })))
        );

        // Collect rows to upsert
        const rows: Parameters<typeof upsertBatch>[1] = [];
        for (const result of results) {
            if (result.status !== "fulfilled") continue;
            const { owner, txDay, txWeek, txMonth, lastUsed } = result.value;
            for (const d of ownerMap.get(owner) ?? []) {
                rows.push({
                    subdomain: d.subdomain,
                    domain: d.domain,
                    owner,
                    txDay,
                    txWeek,
                    txMonth,
                    lastUsed,
                    updatedAt: nowSec,
                });
            }
        }

        // Write in chunks of BATCH_SIZE
        for (let j = 0; j < rows.length; j += BATCH_SIZE) {
            await upsertBatch(client, rows.slice(j, j + BATCH_SIZE));
        }

        processed += ownerBatch.length;
    }

    // Update meta
    await client.batch([
        {
            sql: `INSERT OR REPLACE INTO seeker_usage_meta (key, value) VALUES ('last_run', ?)`,
            args: [String(nowSec)],
        },
        {
            sql: `INSERT OR REPLACE INTO seeker_usage_meta (key, value) VALUES ('total_domains', ?)`,
            args: [String(domains.length)],
        },
        {
            sql: `INSERT OR REPLACE INTO seeker_usage_meta (key, value) VALUES ('unique_owners', ?)`,
            args: [String(owners.length)],
        },
        {
            sql: `INSERT OR REPLACE INTO seeker_usage_meta (key, value) VALUES ('processed_owners', ?)`,
            args: [String(processed)],
        },
        {
            sql: `INSERT OR REPLACE INTO seeker_usage_meta (key, value) VALUES ('timed_out', ?)`,
            args: [timedOut ? "1" : "0"],
        },
    ], "write");

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json({
        ok: true,
        elapsed_sec: elapsed,
        total_domains: domains.length,
        unique_owners: owners.length,
        processed_owners: processed,
        timed_out: timedOut,
    });
}
