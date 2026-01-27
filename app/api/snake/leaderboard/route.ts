import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

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

        return NextResponse.json({
            success: true,
            leaderboard: result.rows,
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
