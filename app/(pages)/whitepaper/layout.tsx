import type { Metadata } from "next";

const TITLE = "Whitepaper | SeekerTracker";
const DESCRIPTION =
  "TRACKER tokenomics, fee split, Sweep, Snake, and Seeker ecosystem overview.";
const OG = "https://seekertracker.com/og/whitepaper.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/whitepaper" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://seekertracker.com/whitepaper",
    images: [{ url: OG, width: 1200, height: 630, alt: TITLE }],
    type: "website",
    siteName: "SeekerTracker",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG],
    creator: "@seeker_tracker",
  },
};

export default function WhitepaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
