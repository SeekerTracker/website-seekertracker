import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Seeker Tracker - .skr SeekerID Search';
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
                    background: 'linear-gradient(135deg, #002a2a 0%, #001a1a 50%, #000000 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, sans-serif',
                    position: 'relative',
                }}
            >
                {/* Grid overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 217, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 217, 0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                    }}
                />

                {/* Border frame */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 24,
                        border: '3px solid rgba(0, 255, 217, 0.25)',
                        borderRadius: 22,
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 24,
                    }}
                >
                    {/* Logo placeholder */}
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 24,
                            background: 'linear-gradient(135deg, #00ffd9 0%, #00e6c0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 64,
                            fontWeight: 700,
                            color: '#002a2a',
                        }}
                    >
                        ST
                    </div>

                    {/* Title */}
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 700,
                            color: '#00ffd9',
                            textAlign: 'center',
                            lineHeight: 1.1,
                        }}
                    >
                        Seeker Tracker
                    </div>

                    {/* Subtitle */}
                    <div
                        style={{
                            fontSize: 36,
                            color: '#b0b0b0',
                            textAlign: 'center',
                        }}
                    >
                        Search & Track .skr SeekerIDs
                    </div>

                    {/* Stats row */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 48,
                            marginTop: 32,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '16px 32px',
                                background: 'rgba(0, 255, 217, 0.1)',
                                borderRadius: 16,
                                border: '2px solid rgba(0, 255, 217, 0.3)',
                            }}
                        >
                            <div style={{ fontSize: 32, fontWeight: 700, color: '#00ffd9' }}>
                                Profiles
                            </div>
                            <div style={{ fontSize: 20, color: '#b0b0b0' }}>
                                Search any .skr
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '16px 32px',
                                background: 'rgba(0, 255, 217, 0.1)',
                                borderRadius: 16,
                                border: '2px solid rgba(0, 255, 217, 0.3)',
                            }}
                        >
                            <div style={{ fontSize: 32, fontWeight: 700, color: '#00ffd9' }}>
                                Analytics
                            </div>
                            <div style={{ fontSize: 20, color: '#b0b0b0' }}>
                                Track SKR Stats
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '16px 32px',
                                background: 'rgba(0, 255, 217, 0.1)',
                                borderRadius: 16,
                                border: '2px solid rgba(0, 255, 217, 0.3)',
                            }}
                        >
                            <div style={{ fontSize: 32, fontWeight: 700, color: '#00ffd9' }}>
                                Portfolio
                            </div>
                            <div style={{ fontSize: 20, color: '#b0b0b0' }}>
                                View Holdings
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 48,
                        fontSize: 24,
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
