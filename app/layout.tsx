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
import { Analytics } from "@vercel/analytics/next";

const jetBrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "Seeker Tracker - .skr SeekerID Search",
  description: "Search and track .skr SeekerIDs on Solana. View profiles, analytics, SKR allocations, and portfolio holdings.",
  metadataBase: new URL("https://seekertracker.com"),
  openGraph: {
    title: "Seeker Tracker - .skr SeekerID Search",
    description: "Search and track .skr SeekerIDs on Solana. View profiles, analytics, SKR allocations, and portfolio holdings.",
    url: "https://seekertracker.com",
    siteName: "Seeker Tracker",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seeker Tracker - .skr SeekerID Search",
    description: "Search and track .skr SeekerIDs on Solana. View profiles, analytics, SKR allocations, and portfolio holdings.",
    site: "@Seeker_Tracker",
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
        <Script
          src="https://plugin.jup.ag/plugin-v1.js"
          strategy="beforeInteractive"
          data-preload
        />
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="9fd8f232-a438-449a-a6d9-ac217f403a51"
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
              <Analytics />
              <Footer />
            </DataProviderClient>
          </WalletProviderWrapper>
        </div>
      </body>
    </html>
  );
}
