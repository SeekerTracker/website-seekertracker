import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Seeker Tracker Sweep - TRACKER Holder Rewards';
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
                            linear-gradient(rgba(0, 255, 217, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 217, 0.03) 1px, transparent 1px)
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
                        border: '3px solid rgba(0, 255, 217, 0.3)',
                        borderRadius: 22,
                    }}
                />

                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                    }}
                >
                    <div style={{ fontSize: 64 }}>💰</div>
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 700,
                            background: 'linear-gradient(45deg, #00ffd9, #00ff66)',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        Seeker Tracker Sweep
                    </div>
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 32,
                        color: '#a0a0a0',
                        marginTop: 16,
                    }}
                >
                    10% of fees rewarded to $TRACKER holders
                </div>

                {/* Stats row */}
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
                    {/* Min Hold */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            background: 'rgba(0, 255, 217, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(0, 255, 217, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 36, fontWeight: 700, color: '#00ffd9' }}>
                            1,000,000
                        </div>
                        <div style={{ fontSize: 18, color: '#a0a0a0', marginTop: 8 }}>
                            Minimum Hold
                        </div>
                    </div>
                    {/* Max Hold */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            background: 'rgba(0, 255, 217, 0.1)',
                            borderRadius: 18,
                            border: '2px solid rgba(0, 255, 217, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 36, fontWeight: 700, color: '#00ffd9' }}>
                            20,000,000
                        </div>
                        <div style={{ fontSize: 18, color: '#a0a0a0', marginTop: 8 }}>
                            Maximum Counted
                        </div>
                    </div>
                    {/* Fee Distribution */}
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
                        <div style={{ fontSize: 36, fontWeight: 700, color: '#FFD700' }}>
                            10%
                        </div>
                        <div style={{ fontSize: 18, color: '#a0a0a0', marginTop: 8 }}>
                            Fee Distribution
                        </div>
                    </div>
                    {/* Hourly */}
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
                        <div style={{ fontSize: 36, marginBottom: 4 }}>⏰</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#A855F7' }}>
                            Hourly Rewards
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
                        color: '#00ffd9',
                    }}
                >
                    seekertracker.com/sweep
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
