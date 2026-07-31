import { Metadata } from "next";

const TITLE = "Sweep | SeekerTracker";
const DESCRIPTION =
  "Hourly SOL drip for TRACKER holders. Hold 1M–20M. Fee-funded. LP excluded.";
/** Static PNG — OpenNext edge ImageResponse routes 500 on this Worker */
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
