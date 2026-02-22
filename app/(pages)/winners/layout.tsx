import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Seeker Winners - Solana Ecosystem Contributors | Seeker Tracker",
    description:
        "Meet the 11 Solana ecosystem contributors awarded a brand new Solana Mobile Seeker by Seeker Tracker.",
    openGraph: {
        title: "🏆 Seeker Winners - Solana Ecosystem Contributors",
        description:
            "Meet the 11 Solana ecosystem contributors awarded a brand new Solana Mobile Seeker by Seeker Tracker.",
        url: "https://seekertracker.com/winners",
        siteName: "Seeker Tracker",
        type: "website",
        images: [
            {
                url: "/api/og/winners",
                width: 1200,
                height: 630,
                alt: "Seeker Tracker Winners",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "🏆 Seeker Winners",
        description:
            "11 Solana ecosystem contributors awarded a brand new Solana Mobile Seeker.",
        site: "@Seeker_Tracker",
        images: ["/api/og/winners"],
    },
};

export default function WinnersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
