import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const DEFAULT_CONFIG = {
    min_tracker_balance: 100000,
    tokens_per_pill: 10,
    airdrop_enabled: true,
    maintenance_mode: false,
};

export async function GET() {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        return NextResponse.json({ config: DEFAULT_CONFIG });
    }

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        const result = await client.execute(`SELECT key, value FROM config`);

        const config: Record<string, string | number | boolean> = { ...DEFAULT_CONFIG };

        for (const row of result.rows) {
            const key = row.key as string;
            const value = row.value as string;
            if (!key) continue;
            // Parse value type
            if (value === "true") config[key] = true;
            else if (value === "false") config[key] = false;
            else if (!isNaN(Number(value))) config[key] = Number(value);
            else config[key] = value;
        }

        return NextResponse.json({ config }, { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } });
    } catch (error) {
        console.error("Config API error:", error);
        // Return defaults on error so the page still works
        return NextResponse.json({ config: DEFAULT_CONFIG });
    }
}
