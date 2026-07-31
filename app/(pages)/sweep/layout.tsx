import { Metadata } from "next";

const TITLE = "Sweep | SeekerTracker";
const DESCRIPTION =
  "Hourly SOL drip for TRACKER holders. Hold 1M–20M. Fee-funded. LP excluded.";

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
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@seeker_tracker",
  },
};

export default function SweepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
