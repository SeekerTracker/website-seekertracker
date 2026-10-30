import { Metadata } from "next";

// Omit brand from title — root template appends "| Seeker Tracker"
const TITLE = "Snake";
const DESCRIPTION =
  "Play Snake Seeker on iOS & Android. Hold ≥250k TRACKER and SKR to qualify and win SKR. App Store + Seeker dApp Store.";
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
  icons: {
    icon: [
      { url: "/snake/favicon.ico", sizes: "any" },
      { url: "/snake/icon.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/snake/icon.png", sizes: "180x180" }],
  },
};

export default function SnakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
