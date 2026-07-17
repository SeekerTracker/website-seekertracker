import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { getOwnerToShortestSubdomain } from "app/(utils)/lib/domainStore";

async function getDomainsByOwner(_wallets: string[]): Promise<Map<string, string>> {
    try {
        return await getOwnerToShortestSubdomain();
    } catch (error) {
        console.error("Error fetching domains:", error);
        return new Map();
    }
}

export async function GET() {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        return NextResponse.json(
            { error: "Database not configured", success: false },
            { status: 503 }
        );
    }

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        // Fetch top 20 players by high score
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
            LIMIT 20
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

        const errorMessage = String(error);

        // Handle authentication errors (401)
        if (errorMessage.includes("401") ||
            errorMessage.includes("UNAUTHORIZED") ||
            errorMessage.includes("authentication") ||
            errorMessage.includes("AUTH_")) {
            return NextResponse.json(
                { error: "Database authentication failed", success: false },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: "Failed to fetch leaderboard", success: false },
            { status: 500 }
        );
    }
}
