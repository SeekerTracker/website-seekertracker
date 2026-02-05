import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql"
const DAPPSTORE_CATALOG_API = "https://dappstore-catalog.solanamobile.com"

const SYSTEM_CONTEXT = {
    locale: "en-US",
    platformSdk: 34,
    pixelDensity: 480,
    model: "SEEKER"
}

const EXPLORE_QUERY = `
query Explore($systemContext: SystemContext!) {
    explore {
        units(systemContext: $systemContext) {
            edges {
                node {
                    __typename
                    ... on DAppsByCategoryUnit {
                        dApps(systemContext: $systemContext, first: 20) {
                            edges {
                                node {
                                    lastRelease(systemContext: $systemContext) {
                                        icon { uri }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
`

async function fetchAppsData(): Promise<{ count: number; icons: string[] }> {
    try {
        const response = await fetch(DAPPSTORE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: EXPLORE_QUERY,
                variables: { systemContext: SYSTEM_CONTEXT }
            })
        })
        const data = await response.json()
        const units = data?.data?.explore?.units?.edges || []
        let total = 0
        const icons: string[] = []

        for (const unit of units) {
            if (unit.node?.__typename === 'DAppsByCategoryUnit') {
                const apps = unit.node.dApps?.edges || []
                total += apps.length
                for (const app of apps) {
                    const iconUri = app.node?.lastRelease?.icon?.uri
                    if (icons.length < 10 && iconUri) {
                        icons.push(iconUri)
                    }
                }
            }
        }
        return { count: total || 178, icons }
    } catch {
        return { count: 178, icons: [] }
    }
}

async function fetchAppData(androidPackage: string) {
    const query = `
        query DAppByPackage($systemContext: SystemContext!, $androidPackage: String!) {
            dAppByAndroidPackage(systemContext: $systemContext, androidPackage: $androidPackage) {
                androidPackage
                rating {
                    rating
                    reviewsByRating
                }
                lastRelease(systemContext: $systemContext) {
                    displayName
                    subtitle
                    updatedOn
                    icon {
                        uri
                    }
                }
            }
        }
    `

    const response = await fetch(DAPPSTORE_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: {
                systemContext: SYSTEM_CONTEXT,
                androidPackage
            }
        })
    })

    const data = await response.json()
    return data.data?.dAppByAndroidPackage
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const appPackage = searchParams.get('app')

    if (!appPackage) {
        const { count: appCount, icons } = await fetchAppsData()

        // Icon positions - scattered around the edges (left uses 'left', right uses 'right')
        const iconPositions: Array<{ top: number; left?: number; right?: number; size: number; rotate: number }> = [
            { top: 40, left: 50, size: 72, rotate: -8 },
            { top: 150, left: 130, size: 64, rotate: 5 },
            { top: 280, left: 50, size: 56, rotate: -3 },
            { top: 400, left: 120, size: 58, rotate: 10 },
            { top: 520, left: 50, size: 52, rotate: -6 },
            // Right side
            { top: 40, right: 50, size: 70, rotate: 8 },
            { top: 150, right: 120, size: 62, rotate: -5 },
            { top: 280, right: 50, size: 58, rotate: 3 },
            { top: 400, right: 130, size: 54, rotate: -8 },
            { top: 520, right: 50, size: 56, rotate: 6 },
        ]

        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #002233 0%, #001122 50%, #000000 100%)',
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
                            backgroundImage: 'linear-gradient(rgba(0, 255, 217, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 217, 0.05) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                            display: 'flex',
                        }}
                    />

                    {/* Scattered app icons - left side */}
                    {icons[0] && (
                        <img src={icons[0]} width={72} height={72}
                            style={{ position: 'absolute', top: 40, left: 50, borderRadius: 16, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}
                    {icons[1] && (
                        <img src={icons[1]} width={64} height={64}
                            style={{ position: 'absolute', top: 150, left: 130, borderRadius: 14, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}
                    {icons[2] && (
                        <img src={icons[2]} width={56} height={56}
                            style={{ position: 'absolute', top: 280, left: 50, borderRadius: 12, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}
                    {icons[3] && (
                        <img src={icons[3]} width={58} height={58}
                            style={{ position: 'absolute', top: 400, left: 120, borderRadius: 13, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}
                    {icons[4] && (
                        <img src={icons[4]} width={52} height={52}
                            style={{ position: 'absolute', top: 530, left: 50, borderRadius: 11, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}

                    {/* Scattered app icons - right side */}
                    {icons[5] && (
                        <img src={icons[5]} width={70} height={70}
                            style={{ position: 'absolute', top: 40, right: 50, borderRadius: 15, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}
                    {icons[6] && (
                        <img src={icons[6]} width={62} height={62}
                            style={{ position: 'absolute', top: 150, right: 120, borderRadius: 14, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}
                    {icons[7] && (
                        <img src={icons[7]} width={58} height={58}
                            style={{ position: 'absolute', top: 280, right: 50, borderRadius: 13, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}
                    {icons[8] && (
                        <img src={icons[8]} width={54} height={54}
                            style={{ position: 'absolute', top: 400, right: 130, borderRadius: 12, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}
                    {icons[9] && (
                        <img src={icons[9]} width={56} height={56}
                            style={{ position: 'absolute', top: 530, right: 50, borderRadius: 12, border: '2px solid rgba(0, 255, 217, 0.3)' }} />
                    )}

                    {/* Center content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            padding: '40px',
                        }}
                    >
                        {/* Big number */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 140,
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #00ffd9 0%, #00ff66 50%, #00aaff 100%)',
                                backgroundClip: 'text',
                                color: 'transparent',
                                lineHeight: 1,
                            }}
                        >
                            {appCount}+
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                fontSize: 28,
                                color: '#00ffd9',
                                marginTop: '8px',
                                fontWeight: 'bold',
                                letterSpacing: '0.1em',
                            }}
                        >
                            SEEKER APPS
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                fontSize: 48,
                                fontWeight: 'bold',
                                color: '#ffffff',
                                marginTop: '24px',
                            }}
                        >
                            Seeker dApp Store
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                fontSize: 24,
                                color: '#b0b0b0',
                                marginTop: '12px',
                            }}
                        >
                            Apps optimized for Solana Seeker
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '30px',
                                padding: '12px 32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #00ffd9 0%, #00ff66 100%)',
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: '#001a1a',
                            }}
                        >
                            Browse All Apps →
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                fontSize: 18,
                                color: 'rgba(237, 237, 237, 0.4)',
                                marginTop: '16px',
                            }}
                        >
                            seekertracker.com/apps
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

    const app = await fetchAppData(appPackage)

    if (!app) {
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
                        padding: '40px',
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
                        }}
                    />
                    <div style={{ fontSize: 48, fontWeight: 'bold', color: '#ededed' }}>
                        App not found
                    </div>
                    <div style={{ fontSize: 24, color: 'rgba(237, 237, 237, 0.5)', marginTop: 20 }}>
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

    const release = app.lastRelease
    const rating = app.rating?.rating
    const totalReviews = app.rating?.reviewsByRating?.reduce((a: number, b: number) => a + b, 0) || 0

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #003333 0%, #001a1a 50%, #000000 100%)',
                    padding: '50px',
                    position: 'relative',
                }}
            >
                {/* Grid pattern overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'linear-gradient(rgba(0, 255, 217, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 217, 0.08) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Left side - App icon */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '320px',
                        marginRight: '50px',
                    }}
                >
                    {release?.icon?.uri ? (
                        <img
                            src={release.icon.uri}
                            width={260}
                            height={260}
                            style={{
                                borderRadius: '52px',
                                border: '3px solid #00ffd9',
                                boxShadow: '0 0 40px rgba(0, 255, 217, 0.3)',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 260,
                                height: 260,
                                borderRadius: '52px',
                                background: 'linear-gradient(135deg, #00ffd9, #00ff66)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 110,
                                fontWeight: 'bold',
                                color: '#001a1a',
                                border: '3px solid #00ffd9',
                            }}
                        >
                            {(release?.displayName || appPackage).charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Right side - App details */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: 52,
                            fontWeight: 'bold',
                            color: '#ededed',
                            marginBottom: '12px',
                            lineHeight: 1.1,
                        }}
                    >
                        {release?.displayName || appPackage}
                    </div>

                    {release?.subtitle && (
                        <div
                            style={{
                                fontSize: 26,
                                color: '#00ffd9',
                                marginBottom: '24px',
                                lineHeight: 1.3,
                            }}
                        >
                            {release.subtitle.length > 80 ? release.subtitle.slice(0, 80) + '...' : release.subtitle}
                        </div>
                    )}

                    {rating && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={rating >= 1 ? '#00ff66' : 'rgba(0, 255, 102, 0.3)'} style={{ marginRight: '4px' }}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={rating >= 2 ? '#00ff66' : 'rgba(0, 255, 102, 0.3)'} style={{ marginRight: '4px' }}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={rating >= 3 ? '#00ff66' : 'rgba(0, 255, 102, 0.3)'} style={{ marginRight: '4px' }}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={rating >= 4 ? '#00ff66' : 'rgba(0, 255, 102, 0.3)'} style={{ marginRight: '4px' }}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={rating >= 5 ? '#00ff66' : 'rgba(0, 255, 102, 0.3)'} style={{ marginRight: '12px' }}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <div style={{ display: 'flex', fontSize: 26, color: '#ededed', fontWeight: 'bold' }}>
                                {rating.toFixed(1)}
                            </div>
                            {totalReviews > 0 && (
                                <div style={{ display: 'flex', fontSize: 22, color: 'rgba(237, 237, 237, 0.6)', marginLeft: '12px' }}>
                                    ({totalReviews.toLocaleString()} reviews)
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: 'auto',
                            paddingTop: '24px',
                            borderTop: '1px solid rgba(0, 255, 217, 0.2)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 26,
                                fontWeight: 'bold',
                                color: '#00ffd9',
                            }}
                        >
                            Seeker dApp Store
                        </div>
                        <div
                            style={{
                                marginLeft: 'auto',
                                fontSize: 20,
                                color: 'rgba(237, 237, 237, 0.5)',
                            }}
                        >
                            seekertracker.com
                        </div>
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
