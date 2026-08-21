import React, { Suspense } from "react";
import SkrPage from "./SkrPage";
import type { Metadata } from "next";

const OG = "https://seekertracker.com/og/skr.png";

export const metadata: Metadata = {
  alternates: { canonical: "https://seekertracker.com/skr" },
  title: "SKR Allocation Checker",
  description:
    "Check your SKR token allocation by .skr domain or wallet address",
  openGraph: {
    title: "SKR Vault & Claims | Seeker Tracker",
    description:
      "Check SKR staking stats, vault balances, and your allocation",
    url: "https://seekertracker.com/skr",
    images: [{ url: OG, width: 1200, height: 630, alt: "SKR stats" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SKR Vault & Claims | Seeker Tracker",
    description:
      "Check SKR staking stats, vault balances, and your allocation",
    images: [OG],
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SkrPage />
    </Suspense>
  );
}
