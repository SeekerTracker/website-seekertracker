import type { Metadata } from "next";
import Backbutton from "app/(components)/shared/Backbutton";
import ChatClient from "./ChatClient";
import styles from "./page.module.css";

const TITLE = "Seeker Tracker Chat";
const DESCRIPTION =
  "Wallet-to-wallet chat for Seeker Tracker. Powered by cherry.fun.";
const URL = "https://seekertracker.com/chat";
const OG_IMAGE = "https://seekertracker.com/og/home.png";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "SeekerTracker",
    type: "website",
    locale: "en_US",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function ChatPage() {
  return (
    <div className={styles.main}>
      <Backbutton />
      <header className={styles.header}>
        <p className={styles.eyebrow}>Chat</p>
        <h1 className={styles.title}>Seeker Tracker Chat</h1>
        <p className={styles.lead}>
          Wallet chat on cherry.fun. Connect a Solana wallet to talk.
        </p>
      </header>
      <ChatClient />
    </div>
  );
}
