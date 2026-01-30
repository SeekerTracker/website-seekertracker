import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Snake Game | SeekerTracker',
    description: 'Play Snake on Solana Seeker. Compete on the leaderboard and win prizes!',
    openGraph: {
        title: 'Snake Game | SeekerTracker',
        description: 'Play Snake on Solana Seeker. Compete on the leaderboard and win prizes!',
        images: [
            {
                url: '/snake/banner.png',
                width: 1200,
                height: 630,
                alt: 'SeekerTracker Snake Game',
            },
        ],
        type: 'website',
        siteName: 'SeekerTracker',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Snake Game | SeekerTracker',
        description: 'Play Snake on Solana Seeker. Compete on the leaderboard and win prizes!',
        images: ['/snake/banner.png'],
        creator: '@SeekerTracker',
    },
}

export default function SnakeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
