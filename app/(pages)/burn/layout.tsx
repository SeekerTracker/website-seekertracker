import type { Metadata } from "next";

const TITLE = "SKR Buy and Burn";
const DESCRIPTION =
  "Live SKR buy-and-burn stats from Solana Mobile's official on-chain program. Total burned, share of initial supply, and recent burns.";
const URL = "https://seekertracker.com/burn";
const OG = "https://seekertracker.com/og/skr.png";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
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

export default function BurnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
