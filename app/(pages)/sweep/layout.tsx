import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Sweep | SeekerTracker',
    description: '10% of fees rewarded to $TRACKER holders hourly. Hold 1M-20M $TRACKER to participate.',
    openGraph: {
        title: 'Sweep | SeekerTracker',
        description: '10% of fees rewarded to $TRACKER holders hourly. Hold 1M-20M $TRACKER to participate.',
        images: [
            {
                url: '/api/og?page=sweep',
                width: 1200,
                height: 630,
                alt: 'SeekerTracker Sweep',
            },
        ],
        type: 'website',
        siteName: 'SeekerTracker',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Sweep | SeekerTracker',
        description: '10% of fees rewarded to $TRACKER holders hourly. Hold 1M-20M $TRACKER to participate.',
        images: ['/api/og?page=sweep'],
        creator: '@SeekerTracker',
    },
}

export default function SweepLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
