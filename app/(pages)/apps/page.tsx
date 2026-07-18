import { Metadata } from 'next'
import AppsClient from './AppsClient'

const BASE_URL = 'https://www.seekertracker.com'
const DAPPSTORE_API = 'https://dappstore.solanamobile.com/graphql'
// This API ignores GraphQL variables — system context must be inlined.
const SC = `{locale: "en-US", platformSdk: 34, pixelDensity: 480, model: "SEEKER"}`

async function fetchAppData(androidPackage: string) {
    try {
        const pkg = androidPackage.replace(/"/g, '\\"')
        const query = `query {
            dAppByAndroidPackage(systemContext: ${SC}, androidPackage: "${pkg}") {
                androidPackage
                lastRelease(systemContext: ${SC}) {
                    displayName
                    subtitle
                    description
                }
            }
        }`
        const res = await fetch(DAPPSTORE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SeekerTracker/1.0',
            },
            body: JSON.stringify({ query }),
            next: { revalidate: 1800 },
        })
        const data = await res.json()
        if (data.data?.dAppByAndroidPackage) return data.data.dAppByAndroidPackage
    } catch {
        /* fall through */
    }
    // CF-safe fallback via our catalog package endpoint
    try {
        const res = await fetch(
            `${BASE_URL}/api/dappstore?package=${encodeURIComponent(androidPackage)}`,
            { next: { revalidate: 600 } }
        )
        if (res.ok) {
            const j = await res.json()
            return j.app || null
        }
    } catch {
        /* ignore */
    }
    return null
}

type Props = {
    searchParams: Promise<{ app?: string }>
}

// When a specific app is shared (e.g. /apps?app=com.foo.bar), emit metadata for
// that app so the share card shows its name, info and icon. Otherwise fall back
// to the store-level defaults defined in layout.tsx.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { app: appParam } = await searchParams
    if (!appParam) return {}

    const decoded = decodeURIComponent(appParam)
    const app = await fetchAppData(decoded)
    if (!app) return {}

    const release = app.lastRelease
    const name = release?.displayName || decoded
    const title = `${name} | Seeker dApp Store`
    const description =
        release?.subtitle ||
        release?.description?.slice(0, 160) ||
        `Discover ${name} on the Seeker dApp Store — apps optimized for Solana Seeker.`
    const ogImageUrl = `${BASE_URL}/api/apps/og?app=${encodeURIComponent(decoded)}`

    const pathApps = `${BASE_URL}/apps?app=${encodeURIComponent(decoded)}`
    return {
        title,
        description,
        alternates: {
            canonical: pathApps,
        },
        openGraph: {
            title: name,
            description,
            url: pathApps,
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: name }],
            type: 'website',
            siteName: 'SeekerTracker',
        },
        twitter: {
            card: 'summary_large_image',
            title: name,
            description,
            images: [ogImageUrl],
            creator: '@seeker_tracker',
        },
    }
}

export default function AppsPage() {
    return <AppsClient />
}
