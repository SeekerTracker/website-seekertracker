import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AppsClient from './AppsClient'

const BASE_URL = 'https://www.seekertracker.com'
// Rich store card (app icons + logo + CTA), served from /api so it never
// collides with the /apps/[package] dynamic route.
const OG_IMAGE = `${BASE_URL}/api/apps/og`

export const metadata: Metadata = {
    title: 'Seeker dApp Store – Browse Apps for Solana Seeker | SeekerTracker',
    description:
        'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
    // Public catalog URL is /dapps (/apps still rewrites to the same UI).
    alternates: {
        canonical: `${BASE_URL}/dapps`,
    },
    openGraph: {
        title: 'Seeker dApp Store – Browse Apps for the Solana Seeker',
        description:
            'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
        url: `${BASE_URL}/dapps`,
        images: [
            {
                url: OG_IMAGE,
                width: 1200,
                height: 630,
                alt: 'Seeker dApp Store',
            },
        ],
        type: 'website',
        siteName: 'SeekerTracker',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Seeker dApp Store – Browse Apps for the Solana Seeker',
        description:
            'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
        images: [OG_IMAGE],
        creator: '@seeker_tracker',
    },
}

type Props = {
    searchParams: Promise<{ app?: string }>
}

/**
 * Catalog index. Legacy deep links `?app=com.foo` redirect to
 * dedicated pages at `/dapps/com.foo`.
 */
export default async function AppsPage({ searchParams }: Props) {
    const { app: appParam } = await searchParams
    if (appParam) {
        const decoded = decodeURIComponent(appParam)
        redirect(`/dapps/${encodeURIComponent(decoded)}`)
    }
    return <AppsClient />
}
