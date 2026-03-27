import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Seeker dApp Store | SeekerTracker'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
    // Fetch live app count from the dappstore API
    let appCount: number | null = null
    try {
        const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`
        const query = `query { explore { units(systemContext: ${SC}) { edges { node { __typename ... on DAppsByCategoryUnit { dApps(systemContext: ${SC}, first: 50) { edges { node { androidPackage } } } } } } } } }`
        const res = await fetch('https://dappstore.solanamobile.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
            // @ts-ignore
            next: { revalidate: 3600 },
        })
        const data = await res.json()
        const units = data?.data?.explore?.units?.edges || []
        const seen = new Set<string>()
        for (const unit of units) {
            if (unit.node?.__typename === 'DAppsByCategoryUnit') {
                for (const edge of unit.node.dApps?.edges || []) {
                    if (edge.node?.androidPackage) seen.add(edge.node.androidPackage)
                }
            }
        }
        if (seen.size > 0) appCount = seen.size
    } catch {
        // will show label without count
    }

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #002233 0%, #001122 50%, #000000 100%)',
                    position: 'relative',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                }}
            >
                {/* Grid overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'linear-gradient(rgba(0, 255, 217, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 217, 0.05) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        display: 'flex',
                    }}
                />

                {/* App count — only shown when live data is available */}
                {appCount !== null && (
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 130,
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #00ffd9 0%, #00ff66 50%, #00aaff 100%)',
                            backgroundClip: 'text',
                            color: 'transparent',
                            lineHeight: 1,
                        }}
                    >
                        {appCount}+
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        fontSize: appCount !== null ? 26 : 80,
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
                        fontSize: 22,
                        color: '#b0b0b0',
                        marginTop: '12px',
                    }}
                >
                    Apps optimized for Solana Seeker • seekertracker.com/apps
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    )
}
