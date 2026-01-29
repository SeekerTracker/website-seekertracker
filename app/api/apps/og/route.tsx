import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql"

const SYSTEM_CONTEXT = {
    locale: "en-US",
    platformSdk: 34,
    pixelDensity: 480,
    model: "SEEKER"
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
                        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
                        padding: '40px',
                    }}
                >
                    <div style={{ fontSize: 60, fontWeight: 'bold', color: '#00ffd9', marginBottom: 20 }}>
                        Seeker dApp Store
                    </div>
                    <div style={{ fontSize: 30, color: '#a0a0a0' }}>
                        Discover apps optimized for Solana Seeker
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
                        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
                        padding: '40px',
                    }}
                >
                    <div style={{ fontSize: 48, fontWeight: 'bold', color: '#fff' }}>
                        App not found
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
                    background: '#0a0a1a',
                    padding: '50px',
                }}
            >
                {/* Left side - App icon */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '350px',
                        marginRight: '50px',
                    }}
                >
                    {release?.icon?.uri ? (
                        <img
                            src={release.icon.uri}
                            width={280}
                            height={280}
                            style={{
                                borderRadius: '56px',
                                border: '4px solid rgba(0, 255, 217, 0.3)',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 280,
                                height: 280,
                                borderRadius: '56px',
                                background: 'linear-gradient(135deg, #00ffd9, #00e6c0)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 120,
                                fontWeight: 'bold',
                                color: '#000',
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
                            fontSize: 56,
                            fontWeight: 'bold',
                            color: '#fff',
                            marginBottom: '12px',
                            lineHeight: 1.1,
                        }}
                    >
                        {release?.displayName || appPackage}
                    </div>

                    {release?.subtitle && (
                        <div
                            style={{
                                fontSize: 28,
                                color: '#a0a0a0',
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
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: 32,
                                    color: '#ffd700',
                                    marginRight: '12px',
                                }}
                            >
                                {'★'.repeat(Math.floor(rating))}
                                {'☆'.repeat(5 - Math.floor(rating))}
                            </div>
                            <div style={{ fontSize: 28, color: '#fff', fontWeight: 'bold' }}>
                                {rating.toFixed(1)}
                            </div>
                            {totalReviews > 0 && (
                                <div style={{ fontSize: 24, color: '#666', marginLeft: '12px' }}>
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
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 'bold',
                                color: '#00ffd9',
                            }}
                        >
                            Seeker dApp Store
                        </div>
                        <div
                            style={{
                                marginLeft: 'auto',
                                fontSize: 22,
                                color: '#666',
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
