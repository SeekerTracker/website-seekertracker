import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Seeker dApp Store | SeekerTracker',
    description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, and more.',
    openGraph: {
        title: 'Seeker dApp Store',
        description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, and more.',
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
        title: 'Seeker dApp Store',
        description: 'Discover apps optimized for Solana Seeker. Browse DeFi, Games, NFTs, and more.',
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
