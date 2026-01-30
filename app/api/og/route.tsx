import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

async function fetchSeekersCount(): Promise<number> {
    try {
        const response = await fetch('https://api.seeker.solana.charity/allDomains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageSize: 1 }),
        })
        const data = await response.json()
        return data.pagination?.total || 0
    } catch {
        return 0
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || 'home'

    // Special handling for home page
    if (page === 'home') {
        const seekersCount = await fetchSeekersCount()
        const formattedSeekers = seekersCount >= 1000 ? `${(seekersCount / 1000).toFixed(1)}K` : seekersCount.toString()

        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #003333 0%, #001a1a 50%, #000000 100%)',
                        position: 'relative',
                    }}
                >
                    {/* Grid overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'linear-gradient(rgba(0, 255, 217, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 217, 0.06) 1px, transparent 1px)',
                            backgroundSize: '50px 50px',
                            display: 'flex',
                        }}
                    />

                    {/* Glow effect */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '600px',
                            height: '600px',
                            background: 'radial-gradient(circle, rgba(0, 255, 217, 0.15) 0%, transparent 70%)',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                        }}
                    />

                    {/* Main content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            padding: '50px',
                        }}
                    >
                        {/* Logo/Title */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 90,
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #00ffd9 0%, #00ff66 50%, #00ffd9 100%)',
                                backgroundClip: 'text',
                                color: 'transparent',
                                marginBottom: '16px',
                            }}
                        >
                            SeekerTracker
                        </div>

                        {/* Tagline */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 32,
                                color: '#ededed',
                                marginBottom: '40px',
                            }}
                        >
                            Search and track .skr SeekerIDs on Solana
                        </div>

                        {/* Search bar visual */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px 32px',
                                background: 'rgba(0, 26, 26, 0.8)',
                                borderRadius: '50px',
                                border: '2px solid rgba(0, 255, 217, 0.4)',
                                marginBottom: '40px',
                                boxShadow: '0 0 30px rgba(0, 255, 217, 0.2)',
                            }}
                        >
                            <div style={{ display: 'flex', fontSize: 28, color: '#00ffd9', marginRight: '8px' }}>
                                🔍
                            </div>
                            <div style={{ display: 'flex', fontSize: 28, color: '#808080' }}>
                                yourname
                            </div>
                            <div style={{ display: 'flex', fontSize: 28, fontWeight: 'bold', color: '#00ffd9' }}>
                                .skr
                            </div>
                        </div>

                        {/* Stats row */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '20px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '16px 28px',
                                    background: 'linear-gradient(135deg, rgba(0, 255, 217, 0.1) 0%, rgba(0, 255, 102, 0.05) 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(0, 255, 217, 0.3)',
                                }}
                            >
                                <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', color: '#00ffd9' }}>
                                    {formattedSeekers}
                                </div>
                                <div style={{ display: 'flex', fontSize: 16, color: '#a0a0a0' }}>
                                    Total Seeker IDs
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '16px 28px',
                                    background: 'linear-gradient(135deg, rgba(0, 255, 102, 0.1) 0%, rgba(0, 255, 217, 0.05) 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(0, 255, 102, 0.3)',
                                }}
                            >
                                <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', color: '#00ff66' }}>
                                    Snake
                                </div>
                                <div style={{ display: 'flex', fontSize: 16, color: '#a0a0a0' }}>
                                    Play & Win
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '16px 28px',
                                    background: 'linear-gradient(135deg, rgba(160, 0, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(160, 0, 255, 0.3)',
                                }}
                            >
                                <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', color: '#a855f7' }}>
                                    Sweep
                                </div>
                                <div style={{ display: 'flex', fontSize: 16, color: '#a0a0a0' }}>
                                    Earn Rewards
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '16px 28px',
                                    background: 'linear-gradient(135deg, rgba(0, 170, 255, 0.1) 0%, rgba(0, 255, 217, 0.05) 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(0, 170, 255, 0.3)',
                                }}
                            >
                                <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', color: '#00aaff' }}>
                                    Free
                                </div>
                                <div style={{ display: 'flex', fontSize: 16, color: '#a0a0a0' }}>
                                    ID Lookup
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div
                            style={{
                                display: 'flex',
                                marginTop: '30px',
                                fontSize: 20,
                                color: 'rgba(237, 237, 237, 0.4)',
                            }}
                        >
                            seekertracker.com
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    }

    // Special handling for sweep page
    if (page === 'sweep') {
        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #1a0033 0%, #0d001a 50%, #000000 100%)',
                        position: 'relative',
                    }}
                >
                    {/* Grid overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'linear-gradient(rgba(255, 0, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 255, 0.06) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                            display: 'flex',
                        }}
                    />

                    {/* Left side - Big percentage */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '45%',
                            padding: '40px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 180,
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #00ff66 0%, #00ffd9 50%, #00aaff 100%)',
                                backgroundClip: 'text',
                                color: 'transparent',
                                lineHeight: 1,
                            }}
                        >
                            10%
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 32,
                                color: '#00ffd9',
                                marginTop: '10px',
                                fontWeight: 'bold',
                            }}
                        >
                            FEE REWARDS
                        </div>
                    </div>

                    {/* Right side - Info */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            width: '55%',
                            padding: '40px',
                            paddingLeft: '20px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 64,
                                fontWeight: 'bold',
                                color: '#ffffff',
                                marginBottom: '16px',
                            }}
                        >
                            Sweep
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                fontSize: 28,
                                color: '#ededed',
                                marginBottom: '30px',
                                lineHeight: 1.4,
                            }}
                        >
                            Rewarded to $TRACKER holders every hour
                        </div>

                        {/* Stats row */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '20px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '16px 24px',
                                    background: 'linear-gradient(135deg, rgba(0, 255, 102, 0.15) 0%, rgba(0, 255, 217, 0.1) 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(0, 255, 102, 0.3)',
                                }}
                            >
                                <div style={{ display: 'flex', fontSize: 28, fontWeight: 'bold', color: '#00ff66' }}>
                                    1M - 20M
                                </div>
                                <div style={{ display: 'flex', fontSize: 16, color: '#a0a0a0' }}>
                                    $TRACKER to qualify
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '16px 24px',
                                    background: 'linear-gradient(135deg, rgba(0, 170, 255, 0.15) 0%, rgba(0, 255, 217, 0.1) 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(0, 170, 255, 0.3)',
                                }}
                            >
                                <div style={{ display: 'flex', fontSize: 28, fontWeight: 'bold', color: '#00aaff' }}>
                                    Hourly
                                </div>
                                <div style={{ display: 'flex', fontSize: 16, color: '#a0a0a0' }}>
                                    SOL rewards
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div
                            style={{
                                display: 'flex',
                                marginTop: '30px',
                                fontSize: 20,
                                color: 'rgba(237, 237, 237, 0.5)',
                            }}
                        >
                            seekertracker.com/sweep
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    }

    const pages: Record<string, { title: string; subtitle: string }> = {
        home: {
            title: 'SeekerTracker',
            subtitle: 'Search and track .skr SeekerIDs on Solana',
        },
        snake: {
            title: 'Snake Game',
            subtitle: 'Compete on the leaderboard and win prizes!',
        },
        apps: {
            title: 'Seeker dApp Store',
            subtitle: 'Discover apps optimized for Solana Seeker',
        },
    }

    const config = pages[page] || pages.home

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #003333 0%, #001a1a 50%, #000000 100%)',
                    padding: '60px',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'linear-gradient(rgba(0, 255, 217, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 217, 0.08) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        display: 'flex',
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        fontSize: 80,
                        fontWeight: 'bold',
                        color: '#00ffd9',
                        marginBottom: '20px',
                        textAlign: 'center',
                    }}
                >
                    {config.title}
                </div>
                <div
                    style={{
                        display: 'flex',
                        fontSize: 36,
                        color: '#ededed',
                        textAlign: 'center',
                        marginBottom: '40px',
                    }}
                >
                    {config.subtitle}
                </div>
                <div
                    style={{
                        display: 'flex',
                        fontSize: 24,
                        color: 'rgba(237, 237, 237, 0.5)',
                    }}
                >
                    seekertracker.com
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    )
}
