import type { Metadata } from "next";
import type { ReactNode } from "react";

const TITLE = "RKS";
const DESCRIPTION =
  "Live $RKS holder revenue. 3% transfer tax paid to holders in $SKR. Volume, payouts, burns.";
const OG = "https://seekertracker.com/og/rks.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/rks" },
  openGraph: {
    title: "RKS | Seeker Tracker",
    description: DESCRIPTION,
    url: "https://seekertracker.com/rks",
    images: [{ url: OG, width: 1200, height: 630, alt: "RKS | Seeker Tracker" }],
    type: "website",
    siteName: "SeekerTracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "RKS | Seeker Tracker",
    description: DESCRIPTION,
    images: [OG],
    creator: "@seeker_tracker",
  },
};

export default function RksLayout({ children }: { children: ReactNode }) {
  return children;
}
