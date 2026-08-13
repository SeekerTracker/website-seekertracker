import type { Metadata } from "next";
import WhalesClient from "./WhalesClient";

export const metadata: Metadata = {
  title: "TRACKER Whales & Holders | Seeker Tracker",
  description:
    "Live TRACKER holder leaderboard: wallet, balance, and how long they've been holding. Plus whale Telegram access.",
  openGraph: {
    title: "TRACKER Whales & Holders | Seeker Tracker",
    description:
      "Every TRACKER holder wallet, balance, and hold duration — ranked by size.",
    url: "https://seekertracker.com/whales",
    images: [
      {
        url: "https://seekertracker.com/og/home.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TRACKER Whales & Holders | Seeker Tracker",
    description:
      "Live TRACKER holders: balance + hold duration.",
    images: ["https://seekertracker.com/og/home.png"],
  },
};

export default function WhalesPage() {
  return <WhalesClient />;
}
