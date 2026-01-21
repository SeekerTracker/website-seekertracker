import React, { Suspense } from "react";
import SkrPage from "./SkrPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "SKR Allocation Checker - Seeker Tracker",
    description: "Check your SKR token allocation by .skr domain or wallet address",
    openGraph: {
        title: "SKR Season 1 Stats - Seeker Tracker",
        description: "Check SKR staking stats, vault balances, and your allocation",
        images: [
            {
                url: "/api/skr/og",
                width: 1200,
                height: 630,
                alt: "SKR Season 1 Stats",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "SKR Season 1 Stats - Seeker Tracker",
        description: "Check SKR staking stats, vault balances, and your allocation",
        images: ["/api/skr/og"],
    },
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SkrPage />
        </Suspense>
    );
}
