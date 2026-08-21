import type { Metadata } from "next";
import MainPage from "./(pages)/mainPage";
import styles from "./page.module.css";

const SITE = "https://seekertracker.com";
const TITLE = "Seeker Tracker — Solana Mobile explorer";
const DESCRIPTION =
  "Search and track .skr SeekerIDs, Seeker dApps, SKR stats, and analytics. Public API for agents.";

/** Homepage-only canonical (root layout intentionally has none). */
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: SITE,
  },
  openGraph: {
    url: SITE,
    title: "Seeker Tracker — .skr, dApps & SKR",
    description: DESCRIPTION,
  },
};

export default function Home() {
  return (
    <div className={styles.mainContainer}>
      <MainPage />
    </div>
  );
}
