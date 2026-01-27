import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Snake - Classic Game for Solana Seeker';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

async function getLeaderboardData() {
    try {
        const [prizeRes, leaderboardRes] = await Promise.all([
            fetch('https://seekertracker.com/api/snake/prize', { next: { revalidate: 60 } }),
            fetch('https://seekertracker.com/api/snake/leaderboard', { next: { revalidate: 60 } }),
        ]);
        const prize = await prizeRes.json();
        const leaderboard = await leaderboardRes.json();
        return {
            trackerBalance: prize.trackerBalance || 0,
            totalPlayers: leaderboard.stats?.totalPlayers || 0,
            totalGames: leaderboard.stats?.totalGames || 0,
            topScore: leaderboard.leaderboard?.[0]?.high_score || 0,
        };
    } catch {
        return { trackerBalance: 0, totalPlayers: 0, totalGames: 0, topScore: 0 };
    }
}

export default async function Image() {
    const data = await getLeaderboardData();

    const formatNumber = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'system-ui, sans-serif',
                    position: 'relative',
                    padding: 60,
                }}
            >
                {/* Grid overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(rgba(45, 248, 160, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(45, 248, 160, 0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Border frame */}
                <div
                    style={{
                        position: 'absolute',
                        top: 24,
                        left: 24,
                        right: 24,
                        bottom: 24,
                        border: '3px solid rgba(45, 248, 160, 0.3)',
                        borderRadius: 22,
                    }}
                />

                {/* Snake icon placeholder */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 24,
                    }}
                >
                    {/* Snake head */}
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 20,
                            background: '#2DF8A0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        {/* Eyes */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ width: 12, height: 12, borderRadius: 6, background: '#000' }} />
                            </div>
                            <div
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ width: 12, height: 12, borderRadius: 6, background: '#000' }} />
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 700,
                            color: '#2DF8A0',
                            fontFamily: 'monospace',
                            letterSpacing: '0.1em',
                            textShadow: '0 0 30px rgba(45, 248, 160, 0.5)',
                        }}
                    >
                        SNAKE
                    </div>
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 32,
                        color: '#a0a0a0',
                        marginTop: 8,
                        fontFamily: 'monospace',
                    }}
                >
                    for Solana Seeker
                </div>

                {/* Tagline */}
                <div
                    style={{
                        fontSize: 28,
                        color: '#666',
                        marginTop: 16,
                    }}
                >
                    Classic 1997-inspired snake game with instant airdrops
                </div>

                {/* Stats cards */}
                <div
                    style={{
                        display: 'flex',
                        gap: 24,
                        position: 'absolute',
                        bottom: 100,
                        left: 60,
                        right: 60,
                    }}
                >
                    {/* Prize Pool */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px 24px',
                            background: 'rgba(255, 215, 0, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(255, 215, 0, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 38, fontWeight: 700, color: '#FFD700' }}>
                            {formatNumber(data.trackerBalance)}
                        </div>
                        <div style={{ fontSize: 20, color: '#a0a0a0', marginTop: 4 }}>
                            TRACKER Prize Pool
                        </div>
                    </div>
                    {/* Players */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px 24px',
                            background: 'rgba(45, 248, 160, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(45, 248, 160, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 38, fontWeight: 700, color: '#2DF8A0' }}>
                            {data.totalPlayers}
                        </div>
                        <div style={{ fontSize: 20, color: '#a0a0a0', marginTop: 4 }}>
                            Players
                        </div>
                    </div>
                    {/* Games */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px 24px',
                            background: 'rgba(45, 248, 160, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(45, 248, 160, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 38, fontWeight: 700, color: '#2DF8A0' }}>
                            {data.totalGames}
                        </div>
                        <div style={{ fontSize: 20, color: '#a0a0a0', marginTop: 4 }}>
                            Games Played
                        </div>
                    </div>
                    {/* High Score */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px 24px',
                            background: 'rgba(138, 43, 226, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(138, 43, 226, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 38, fontWeight: 700, color: '#A855F7' }}>
                            {data.topScore}
                        </div>
                        <div style={{ fontSize: 20, color: '#a0a0a0', marginTop: 4 }}>
                            Top Score
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 48,
                        left: 60,
                        fontSize: 24,
                        fontWeight: 600,
                        color: '#2DF8A0',
                    }}
                >
                    seekertracker.com/snake
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
