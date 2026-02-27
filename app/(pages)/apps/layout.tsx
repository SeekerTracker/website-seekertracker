import { Metadata } from 'next'

const BASE_URL = 'https://seekertracker.com'

export const metadata: Metadata = {
    title: 'Seeker dApp Store – Browse Apps for Solana Seeker | SeekerTracker',
    description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
    openGraph: {
        title: 'Seeker dApp Store – Apps for Solana Seeker',
        description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
        url: `${BASE_URL}/apps`,
        images: [
            {
                url: `${BASE_URL}/apps/opengraph-image`,
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
        title: 'Seeker dApp Store – Apps for Solana Seeker',
        description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
        images: [`${BASE_URL}/apps/opengraph-image`],
        creator: '@SeekerTracker',
    },
}

export default function AppsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
