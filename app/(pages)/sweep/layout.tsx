import { Metadata } from "next";

const TITLE = "Sweep | SeekerTracker";
const DESCRIPTION =
  "Hourly SKR drip lottery for TRACKER holders. Hold 1M-20M TRACKER. Floor 1 SKR. LP excluded.";
const OG = "https://seekertracker.com/og/sweep.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/sweep" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://seekertracker.com/sweep",
    siteName: "SeekerTracker",
    type: "website",
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

export default function SweepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
