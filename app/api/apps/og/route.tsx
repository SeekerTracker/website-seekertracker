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
                }
                lastRelease(systemContext: $systemContext) {
                    displayName
                    subtitle
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

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)',
                    padding: '60px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '40px',
                    }}
                >
                    {release?.icon?.uri && (
                        <img
                            src={release.icon.uri}
                            width={120}
                            height={120}
                            style={{
                                borderRadius: '24px',
                                marginRight: '30px',
                            }}
                        />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                            style={{
                                fontSize: 52,
                                fontWeight: 'bold',
                                color: '#fff',
                                marginBottom: '10px',
                            }}
                        >
                            {release?.displayName || appPackage}
                        </div>
                        {release?.subtitle && (
                            <div style={{ fontSize: 28, color: '#a0a0a0' }}>
                                {release.subtitle}
                            </div>
                        )}
                        {rating && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginTop: '15px',
                                    fontSize: 24,
                                    color: '#ffd700',
                                }}
                            >
                                {'★'.repeat(Math.floor(rating))}
                                {'☆'.repeat(5 - Math.floor(rating))}
                                <span style={{ marginLeft: '10px', color: '#888' }}>
                                    {rating.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: 'auto',
                        paddingTop: '30px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <div
                        style={{
                            fontSize: 32,
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #00ffd9, #00ff66)',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        Seeker dApp Store
                    </div>
                    <div
                        style={{
                            marginLeft: 'auto',
                            fontSize: 24,
                            color: '#666',
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
