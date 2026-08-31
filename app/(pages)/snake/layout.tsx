import { Metadata } from "next";

// Omit brand from title — root template appends "| Seeker Tracker"
const TITLE = "Snake";
const DESCRIPTION =
  "Play Snake Seeker on iOS & Android. Hold ≥1M TRACKER to qualify and win SKR. App Store + Seeker dApp Store.";
const OG = "https://seekertracker.com/og/snake.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/snake" },
  openGraph: {
    title: "Snake | Seeker Tracker",
    description: DESCRIPTION,
    url: "https://seekertracker.com/snake",
    images: [{ url: OG, width: 1200, height: 630, alt: "Snake | Seeker Tracker" }],
    type: "website",
    siteName: "SeekerTracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Snake | Seeker Tracker",
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
