import type { Metadata } from "next";
import type { ReactNode } from "react";

const TITLE = "MCP";
const DESCRIPTION =
  "Seeker Tracker MCP: lookup .skr SeekerIDs and Solana Seeker dApps. Streamable HTTP, no auth.";
const OG = "https://seekertracker.com/og/developers.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://seekertracker.com/mcp" },
  openGraph: {
    title: "MCP | Seeker Tracker",
    description: DESCRIPTION,
    url: "https://seekertracker.com/mcp",
    images: [{ url: OG, width: 1200, height: 630, alt: "Seeker Tracker MCP" }],
    type: "website",
    siteName: "SeekerTracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP | Seeker Tracker",
    description: DESCRIPTION,
    images: [OG],
    creator: "@seeker_tracker",
  },
};

export default function McpLayout({ children }: { children: ReactNode }) {
  return children;
}
