import type { Metadata } from "next";

const TITLE = "Ledger x Solana Mobile";
const DESCRIPTION =
  "Seeker app and Solana dApp Store on Ledger Atom. First hardware partner. 8 million Ledger devices. Summer 2027.";
const OG = "https://seekertracker.com/og/ledger.png";
const URL = "https://seekertracker.com/ledger";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
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

export default function LedgerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
