import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getBasicData } from "./(utils)/lib/getBasicData";
import DataProviderClient from "./(utils)/context/dataProvider";
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
  description: "Seeker Tracker - .skr SeekerID Search",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const basicData = await getBasicData();
  return (
    <html lang="en">
      <body className={`${jetBrains.variable}`}>
        <div className={`mainWholeAppContainer`}>
          <DataProviderClient initialData={basicData}>
            <div className="gridBG" />
            <Navbar />
            <ToastMessage />
            {children}
            <Analytics />
            <Footer />
          </DataProviderClient>
        </div>
      </body>
    </html>
  );
}
