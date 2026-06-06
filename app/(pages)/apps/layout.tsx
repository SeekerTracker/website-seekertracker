import { Metadata } from 'next'

const BASE_URL = 'https://seekertracker.com'

// Rich store card (app icons + logo + CTA), served from /api so it never
// collides with the /apps/[package] dynamic route.
const OG_IMAGE = `${BASE_URL}/api/apps/og`

export const metadata: Metadata = {
    title: 'Seeker dApp Store – Browse Apps for Solana Seeker | SeekerTracker',
    description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
    openGraph: {
        title: 'Seeker dApp Store – Browse Apps for the Solana Seeker',
        description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
        url: `${BASE_URL}/apps`,
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
        description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
        images: [OG_IMAGE],
        creator: '@seeker_tracker',
    },
}

export default function AppsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
