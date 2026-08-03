import { Metadata } from "next";

const TITLE = "Snake | SeekerTracker";
const DESCRIPTION =
  "Play Snake Seeker on iOS & Android. Hold ≥1M TRACKER to earn airdrops. App Store + Seeker dApp Store.";
const OG = "https://seekertracker.com/og/snake.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/snake" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://seekertracker.com/snake",
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

export default function SnakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
