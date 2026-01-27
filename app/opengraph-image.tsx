import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Seeker Tracker - .skr SeekerID Search';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

async function getTotalActivations(): Promise<number> {
    try {
        const response = await fetch('https://api.seeker.solana.charity/allDomains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageSize: 1 }),
            next: { revalidate: 60 },
        });
        const data = await response.json();
        return data.total || data.totalCount || data.data?.length || 0;
    } catch {
        return 0;
    }
}

export default async function Image() {
    const totalActivations = await getTotalActivations();

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #002a2a 0%, #001a1a 50%, #000000 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'system-ui, sans-serif',
                    position: 'relative',
                    padding: 60,
                }}
            >
                {/* Grid overlay effect */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 217, 0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 217, 0.06) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
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
                        border: '3px solid rgba(0, 255, 217, 0.25)',
                        borderRadius: 22,
                    }}
                />

                {/* Top badge - like profile "Activated" pill */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: 'linear-gradient(135deg, #00FF66 0%, #00E6C0 100%)',
                        padding: '12px 24px',
                        borderRadius: 30,
                    }}
                >
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            background: '#01C772',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: 700,
                        }}
                    >
                        S
                    </div>
                    <span style={{ fontSize: 28, fontWeight: 700, color: '#07271D' }}>
                        SeekerID Tracker
                    </span>
                </div>

                {/* Main title */}
                <div
                    style={{
                        fontSize: 96,
                        fontWeight: 700,
                        color: '#00ffd9',
                        marginTop: 32,
                        lineHeight: 1.1,
                    }}
                >
                    Seeker Tracker
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 42,
                        color: '#b0b0b0',
                        marginTop: 12,
                    }}
                >
                    Search & Track .skr SeekerIDs on Solana
                </div>

                {/* Stats cards row - matching profile card style */}
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
                            padding: '20px 24px',
                            background: 'rgba(0, 255, 217, 0.12)',
                            borderRadius: 18,
                            border: '2px solid rgba(0, 255, 217, 0.35)',
                        }}
                    >
                        <div style={{ fontSize: 42, fontWeight: 700, color: '#00ffd9' }}>
                            {totalActivations > 0 ? totalActivations.toLocaleString() : 'Live'}
                        </div>
                        <div style={{ fontSize: 22, color: '#b0b0b0', marginTop: 4 }}>
                            Total Activations
                        </div>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px 24px',
                            background: 'rgba(0, 255, 217, 0.12)',
                            borderRadius: 18,
                            border: '2px solid rgba(0, 255, 217, 0.35)',
                        }}
                    >
                        <div style={{ fontSize: 42, fontWeight: 700, color: '#00ffd9' }}>
                            Analytics
                        </div>
                        <div style={{ fontSize: 22, color: '#b0b0b0', marginTop: 4 }}>
                            Track SKR Stats
                        </div>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px 24px',
                            background: 'rgba(0, 255, 217, 0.12)',
                            borderRadius: 18,
                            border: '2px solid rgba(0, 255, 217, 0.35)',
                        }}
                    >
                        <div style={{ fontSize: 42, fontWeight: 700, color: '#00ffd9' }}>
                            Portfolio
                        </div>
                        <div style={{ fontSize: 22, color: '#b0b0b0', marginTop: 4 }}>
                            View Holdings
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
                        color: '#00e6c0',
                    }}
                >
                    seekertracker.com
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
