import { Metadata } from 'next'
import ClientRedirect from './ClientRedirect'

const DAPPSTORE_API = "https://dappstore.solanamobile.com/graphql"

const SYSTEM_CONTEXT = {
    locale: "en-US",
    platformSdk: 34,
    pixelDensity: 480,
    model: "SEEKER"
}

async function fetchAppData(androidPackage: string) {
    try {
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
                        description
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
            }),
            next: { revalidate: 3600 }
        })

        const data = await response.json()
        return data.data?.dAppByAndroidPackage
    } catch {
        return null
    }
}

type Props = {
    params: Promise<{ package: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { package: pkg } = await params
    const decodedPackage = decodeURIComponent(pkg)
    const app = await fetchAppData(decodedPackage)

    if (!app) {
        return {
            title: 'App Not Found | Seeker dApp Store',
        }
    }

    const release = app.lastRelease
    const title = `${release?.displayName || decodedPackage} | Seeker dApp Store`
    const description = release?.subtitle || release?.description?.slice(0, 160) || 'Discover this app on Seeker dApp Store'
    const ogImageUrl = `https://seekertracker.com/api/apps/og?app=${encodeURIComponent(decodedPackage)}`

    return {
        title,
        description,
        openGraph: {
            title: release?.displayName || decodedPackage,
            description,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: release?.displayName || decodedPackage,
                },
            ],
            type: 'website',
            siteName: 'SeekerTracker',
        },
        twitter: {
            card: 'summary_large_image',
            title: release?.displayName || decodedPackage,
            description,
            images: [ogImageUrl],
            creator: '@SeekerTracker',
        },
    }
}

export default async function AppPage({ params }: Props) {
    const { package: pkg } = await params
    return <ClientRedirect url={`/apps?app=${encodeURIComponent(pkg)}`} />
}
