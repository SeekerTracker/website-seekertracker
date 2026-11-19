import type { Metadata } from "next";
import { SEO_HOME_DESCRIPTION } from "app/(utils)/lib/dappStoreStats";
import MainPage from "./(pages)/mainPage";
import styles from "./page.module.css";

const SITE = "https://seekertracker.com";
const TITLE = "Seeker Tracker — Solana Mobile explorer";
const DESCRIPTION = SEO_HOME_DESCRIPTION;

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
