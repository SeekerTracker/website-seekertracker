import { Metadata } from "next";

const TITLE = "Snake | SeekerTracker";
const DESCRIPTION =
  "Play Snake on Solana Seeker (com.snakeseeker). Hold ≥1M TRACKER to earn airdrops. Live on the dApp Store.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/snake" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://seekertracker.com/snake",
    images: [
      {
        url: "/snake/banner.png",
        width: 1200,
        height: 630,
        alt: "SeekerTracker Snake",
      },
    ],
    type: "website",
    siteName: "SeekerTracker",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/snake/banner.png"],
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
