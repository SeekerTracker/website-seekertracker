import type { Metadata } from "next";

const TITLE = "SKR Buy and Burn";
const DESCRIPTION =
  "Official SKR buy-and-burn, live from on-chain records. Total SKR burned, share of the 10 billion initial supply, and every official burn since 15 October 2026.";
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
