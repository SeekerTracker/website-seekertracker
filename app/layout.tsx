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

/** GA4 — Seeker Tracker property (existing stream since 2025-08) */
const GA_MEASUREMENT_ID = "G-2G1PFJ2R6G";

const DESCRIPTION =
  "Search and track .skr SeekerIDs, Seeker dApps, SKR stats, and analytics. Public API for agents.";
// Keep OG titles under ~60 chars so X/LinkedIn do not truncate awkwardly.
const TITLE = "Seeker Tracker — Solana Mobile explorer";
const OG_TITLE = "Seeker Tracker — .skr, dApps & SKR";
const SITE = "https://seekertracker.com";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s | Seeker Tracker",
  },
  description: DESCRIPTION,
  metadataBase: new URL(SITE),
  keywords: [
    "Solana Mobile",
    "Seeker",
    "SeekerID",
    ".skr",
    "Solana",
    "web3",
    "dApp Store",
    "SKR",
    "TRACKER",
    "on-chain analytics",
  ],
  authors: [{ name: "Seeker Tracker", url: SITE }],
  creator: "Seeker Tracker",
  publisher: "Seeker Tracker",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: OG_TITLE,
    description: DESCRIPTION,
    url: SITE,
    siteName: "SeekerTracker",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${SITE}/og/home.png`,
        width: 1200,
        height: 630,
        alt: OG_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: DESCRIPTION,
    site: "@Seeker_Tracker",
    creator: "@seeker_tracker",
    images: [`${SITE}/og/home.png`],
  },
  // Do NOT set root alternates.canonical — it bleeds onto every child page.
  // Each route sets its own canonical (home via app/page.tsx).
  alternates: {
    types: {
      "text/plain": [
        { url: `${SITE}/llms.txt`, title: "llms.txt" },
        { url: `${SITE}/llms-full.txt`, title: "llms-full.txt" },
      ],
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Seeker Tracker",
      url: SITE,
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/logo.png`,
      },
      sameAs: [
        "https://x.com/Seeker_Tracker",
        "https://t.me/seeker_tracker",
      ],
      description: DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Seeker Tracker",
      description: DESCRIPTION,
      publisher: { "@id": `${SITE}/#organization` },
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE}/lookup?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE}/#app`,
      name: "Seeker Tracker",
      url: SITE,
      applicationCategory: "BrowserApplication",
      operatingSystem: "Web, Android, iOS",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description: DESCRIPTION,
    },
  ],
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
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${jetBrains.variable}`}>
        {/* GA4 — afterInteractive so first paint is not blocked */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              anonymize_ip: true,
              send_page_view: true
            });
          `}
        </Script>
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
