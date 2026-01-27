import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Snake - Classic Game for Solana Seeker';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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

                {/* Snake head and title */}
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
                            width: 100,
                            height: 100,
                            borderRadius: 24,
                            background: '#2DF8A0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Eyes */}
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ width: 14, height: 14, borderRadius: 7, background: '#000' }} />
                            </div>
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ width: 14, height: 14, borderRadius: 7, background: '#000' }} />
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: 96,
                            fontWeight: 700,
                            color: '#2DF8A0',
                            fontFamily: 'monospace',
                            letterSpacing: '0.1em',
                            textShadow: '0 0 40px rgba(45, 248, 160, 0.5)',
                        }}
                    >
                        SNAKE
                    </div>
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 36,
                        color: '#a0a0a0',
                        marginTop: 12,
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
                        marginTop: 20,
                    }}
                >
                    Classic 1997-inspired snake game with instant airdrops
                </div>

                {/* Features row */}
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
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            background: 'rgba(255, 215, 0, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(255, 215, 0, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#FFD700' }}>
                            Prize Pool
                        </div>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            background: 'rgba(45, 248, 160, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(45, 248, 160, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🎮</div>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#2DF8A0' }}>
                            Global Leaderboard
                        </div>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            background: 'rgba(138, 43, 226, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(138, 43, 226, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 36, marginBottom: 8 }}>💸</div>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#A855F7' }}>
                            Instant Airdrops
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 48,
                        left: 60,
                        fontSize: 26,
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
