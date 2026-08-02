import { Metadata } from "next";

const TITLE = "DAS — Daily Active Seekers | SeekerTracker";
const DESCRIPTION =
  "Live Daily / Weekly / Monthly Active .skr IDs from on-chain scans. Stickiness, distribution, and most-active SeekerIDs.";
const OG = "https://seekertracker.com/og/das.png";

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
    images: [{ url: OG, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@seeker_tracker",
    images: [OG],
  },
};

export default function DasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
