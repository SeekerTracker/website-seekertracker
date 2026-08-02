import type { Metadata } from "next";

const TITLE = "Seeker Phone Awards | SeekerTracker";
const DESCRIPTION =
  "Community Seeker phone giveaway winners. For TRACKER hourly drips see /sweep.";
const OG = "https://seekertracker.com/og/winners.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/winners" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://seekertracker.com/winners",
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

export default function WinnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
