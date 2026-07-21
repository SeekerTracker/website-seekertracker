import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import DataProviderClient from "./(utils)/context/dataProvider";
import { WalletProviderWrapper } from "./(utils)/context/walletProvider";
import Navbar from "./(components)/navbar";
import Footer from "./(components)/footer";
import ToastMessage from "./(components)/toastMessage";

const jetBrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPTION =
  "Search and track .skr SeekerIDs, Seeker dApps, SKR stats, and analytics. Public API for agents.";
// Keep OG titles under ~60 chars so X/LinkedIn do not truncate awkwardly.
const TITLE = "Seeker Tracker — Solana Mobile explorer";
const OG_TITLE = "Seeker Tracker — .skr, dApps & SKR";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s | Seeker Tracker",
  },
  description: DESCRIPTION,
  metadataBase: new URL("https://seekertracker.com"),
  keywords: [
    "Solana Mobile",
    "Seeker",
    "SeekerID",
    ".skr",
    "Solana",
    "web3",
    "dApp Store",
    "SKR",
    "on-chain analytics",
  ],
  openGraph: {
    title: OG_TITLE,
    description: DESCRIPTION,
    url: "https://seekertracker.com",
    siteName: "SeekerTracker",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: DESCRIPTION,
    site: "@Seeker_Tracker",
    creator: "@seeker_tracker",
  },
  alternates: {
    canonical: "https://seekertracker.com",
  },
};

/**
 * Root layout is intentionally synchronous.
 * Do not await Bags / RPC / price here — that was causing ~8s TTFB on every page.
 * Live data loads client-side via DataProviderClient.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="x-ogp-key"
          content="7828d28e-fd95-467f-9d72-d888e2b67bf3"
          id="ogp-key-meta"
        />
      </head>
      <body className={`${jetBrains.variable}`}>
        {/* afterInteractive: do not block first paint / hydration */}
        <Script
          src="https://plugin.jup.ag/plugin-v1.js"
          strategy="afterInteractive"
          data-preload
        />
        <div className={`mainWholeAppContainer`}>
          <WalletProviderWrapper>
            <DataProviderClient>
              <div className="gridBG" />
              <Navbar />
              <ToastMessage />
              {children}
              <Footer />
            </DataProviderClient>
          </WalletProviderWrapper>
        </div>
      </body>
    </html>
  );
}
