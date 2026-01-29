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
                    <div style={{ fontSize: 72, fontWeight: 'bold', color: '#00ffd9', marginBottom: 20 }}>
                        Seeker dApp Store
                    </div>
                    <div style={{ fontSize: 32, color: '#ededed' }}>
                        Discover apps optimized for Solana Seeker
                    </div>
                    <div style={{ fontSize: 24, color: 'rgba(237, 237, 237, 0.5)', marginTop: 30 }}>
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
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginRight: '12px',
                                }}
                            >
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill={star <= Math.floor(rating) ? '#00ff66' : 'rgba(0, 255, 102, 0.3)'}
                                    >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                ))}
                            </div>
                            <div style={{ fontSize: 26, color: '#ededed', fontWeight: 'bold' }}>
                                {rating.toFixed(1)}
                            </div>
                            {totalReviews > 0 && (
                                <div style={{ fontSize: 22, color: 'rgba(237, 237, 237, 0.6)', marginLeft: '12px' }}>
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
