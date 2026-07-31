import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Sweep | SeekerTracker',
    description:
        'Hourly SOL drip for TRACKER holders. Hold ≥1M; weight capped at 20M. Fee-funded — not a one-time dump.',
    alternates: { canonical: 'https://seekertracker.com/sweep' },
    openGraph: {
        title: 'Sweep | SeekerTracker',
        description:
            'Hourly SOL drip for TRACKER holders. Hold ≥1M; weight capped at 20M. Fee-funded — not a one-time dump.',
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
        url: 'https://seekertracker.com/sweep',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Sweep | SeekerTracker',
        description:
            'Hourly SOL drip for TRACKER holders. Hold ≥1M; weight capped at 20M.',
        images: ['/api/og?page=sweep'],
        creator: '@seeker_tracker',
    },
}

export default function SweepLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
