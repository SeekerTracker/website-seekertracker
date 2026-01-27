import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

const BE_URL = "https://api.seeker.solana.charity";

type DomainInfo = {
    owner: string;
    subdomain: string;
};

// Cache for domain lookups (5 minute TTL)
let domainCache: Map<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getDomainsByOwner(wallets: string[]): Promise<Map<string, string>> {
    const now = Date.now();

    // Return cached data if valid
    if (domainCache && domainCache.size > 0 && (now - cacheTimestamp) < CACHE_TTL) {
        return domainCache;
    }

    try {
        const response = await fetch(`${BE_URL}/allDomains`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageSize: 200000 }),
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error("Failed to fetch domains:", response.status);
            return domainCache || new Map();
        }

        const data = await response.json();
        const ownerToDomain = new Map<string, string>();

        if (data.success && Array.isArray(data.data)) {
            // Process all domains, prefer shorter/cleaner subdomain names
            for (const domain of data.data as DomainInfo[]) {
                if (domain.owner && domain.subdomain) {
                    const existing = ownerToDomain.get(domain.owner);
                    // Keep shorter subdomain names (they're usually the "main" ones)
                    if (!existing || domain.subdomain.length < existing.length) {
                        ownerToDomain.set(domain.owner, domain.subdomain);
                    }
                }
            }
            console.log(`Loaded ${ownerToDomain.size} domain owners from ${data.data.length} domains`);
        }

        if (ownerToDomain.size > 0) {
            domainCache = ownerToDomain;
            cacheTimestamp = now;
        }
        return ownerToDomain;
    } catch (error) {
        console.error("Error fetching domains:", error);
        return domainCache || new Map();
    }
}

export async function GET() {
    try {
        // Fetch top 50 players by high score
        const result = await client.execute(`
            SELECT
                u.wallet,
                u.username,
                s.high_score,
                s.total_plays,
                s.total_score
            FROM stats s
            JOIN users u ON u.id = s.user_id
            WHERE s.high_score > 0
            ORDER BY s.high_score DESC
            LIMIT 50
        `);

        // Get total players count
        const totalPlayers = await client.execute(`
            SELECT COUNT(*) as count FROM users
        `);

        // Get total games played
        const totalGames = await client.execute(`
            SELECT COUNT(*) as count FROM games
        `);

        // Get .skr domains for wallets
        const wallets = result.rows.map(row => row.wallet as string);
        const domainMap = await getDomainsByOwner(wallets);

        // Add skrId to leaderboard entries
        const leaderboardWithSkr = result.rows.map(row => ({
            ...row,
            skrId: domainMap.get(row.wallet as string) || null
        }));

        return NextResponse.json({
            success: true,
            leaderboard: leaderboardWithSkr,
            stats: {
                totalPlayers: totalPlayers.rows[0]?.count || 0,
                totalGames: totalGames.rows[0]?.count || 0,
            }
        });
    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard", details: String(error) },
            { status: 500 }
        );
    }
}
