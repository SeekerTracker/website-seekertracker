import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Seeker dApp Store – Browse 199+ Apps for Solana Seeker | SeekerTracker',
    description: 'Discover 199+ apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
    openGraph: {
        title: 'Seeker dApp Store – Browse 199+ Apps for Solana Seeker',
        description: 'Discover 199+ apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
        images: [
            {
                url: '/api/apps/og',
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
        title: 'Seeker dApp Store – Browse 199+ Apps for Solana Seeker',
        description: 'Discover 199+ apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, Social, and more categories. Find the best dApps for your Seeker device.',
        images: ['/api/apps/og'],
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
