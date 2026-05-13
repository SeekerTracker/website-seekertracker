import { Metadata } from "next";

const TITLE = "DAS — Daily Active Seekers | SeekerTracker";
const DESCRIPTION = "On-chain transaction activity across every .skr ID. Daily, weekly, and monthly active wallet counts.";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
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
