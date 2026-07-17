import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getBasicData } from "./(utils)/lib/getBasicData";
import DataProviderClient from "./(utils)/context/dataProvider";
import { WalletProviderWrapper } from "./(utils)/context/walletProvider";
import Navbar from "./(components)/navbar";
import Footer from "./(components)/footer";
import ToastMessage from "./(components)/toastMessage";
const jetBrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const SLOGAN = "The unofficial Solana Mobile ecosystem explorer";
const DESCRIPTION = `${SLOGAN}. Search and track .skr SeekerIDs, on-chain activity, apps, and analytics.`;
const TITLE = "Seeker Tracker — The unofficial Solana Mobile ecosystem explorer";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL("https://seekertracker.com"),
  keywords: ["Solana Mobile", "Seeker", "SeekerID", ".skr", "Solana", "web3", "crypto", "on-chain analytics"],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://seekertracker.com",
    siteName: "Seeker Tracker",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    site: "@Seeker_Tracker",
    creator: "@seeker_tracker",
  },
  alternates: {
    canonical: "https://seekertracker.com",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const basicData = await getBasicData();
  return (
    <html lang="en">
      <head>
        <meta name="x-ogp-key" content="7828d28e-fd95-467f-9d72-d888e2b67bf3" id="ogp-key-meta" />
        <Script
          src="https://plugin.jup.ag/plugin-v1.js"
          strategy="beforeInteractive"
          data-preload
        />
</head>
      <body className={`${jetBrains.variable}`}>
        <div className={`mainWholeAppContainer`}>
          <WalletProviderWrapper>
            <DataProviderClient initialData={basicData}>
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
