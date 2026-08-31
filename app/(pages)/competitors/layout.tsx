import type { Metadata } from "next";

const TITLE = "Competitors";
const DESCRIPTION =
  "$SKR circulating mcap vs public phone OEM equity. Token vs company, not Solana Mobile Inc.";
const OG = "https://seekertracker.com/og/competitors.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/competitors" },
  openGraph: {
    title: "$SKR vs phone OEMs | Seeker Tracker",
    description: DESCRIPTION,
    url: "https://seekertracker.com/competitors",
    images: [{ url: OG, width: 1200, height: 630, alt: "$SKR vs phone OEMs" }],
    type: "website",
    siteName: "SeekerTracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "$SKR vs phone OEMs | Seeker Tracker",
    description: DESCRIPTION,
    images: [OG],
    creator: "@seeker_tracker",
  },
};

export default function CompetitorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
