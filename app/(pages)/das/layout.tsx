import { Metadata } from "next";

const TITLE = "DAS — Daily Active Seekers | SeekerTracker";
const DESCRIPTION =
    "Live Daily / Weekly / Monthly Active .skr IDs from on-chain scans. Stickiness, distribution, and most-active SeekerIDs.";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "https://seekertracker.com/das" },
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        type: "website",
        siteName: "SeekerTracker",
        url: "https://seekertracker.com/das",
    },
    twitter: {
        card: "summary_large_image",
        title: TITLE,
        description: DESCRIPTION,
        creator: "@seeker_tracker",
    },
};

export default function DasLayout({ children }: { children: React.ReactNode }) {
    return children;
}
