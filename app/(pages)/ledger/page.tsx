import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import styles from "./page.module.css";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Ledger x Solana Mobile",
  url: "https://seekertracker.com/ledger",
  description:
    "Seeker app and Solana dApp Store on Ledger Atom, Ledger's first Solana Mobile hardware partner.",
  isPartOf: {
    "@type": "WebSite",
    name: "Seeker Tracker",
    url: "https://seekertracker.com",
  },
};

export default function LedgerPage() {
  return (
    <div className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Backbutton />
      <p className={styles.kicker}>Ledger x Solana Mobile</p>
      <h1 className={styles.title}>Seeker app on Ledger Atom</h1>
      <p className={styles.lead}>
        Solana Mobile named Ledger its first hardware expansion partner. The
        Seeker app puts the Solana dApp Store and wallet on Ledger Atom, shipping
        summer 2027.
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.num}>8M</span>
          <span className={styles.label}>Ledger devices</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.num}>100M</span>
          <span className={styles.label}>$BTC secured</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.num}>$2B</span>
          <span className={styles.label}>company</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.num}>2M</span>
          <span className={styles.label}>dApp Store devices next year</span>
        </div>
      </div>

      <section className={styles.block}>
        <h2>What it is</h2>
        <p>
          One Seeker app on Atom. Same store submission builders already use on
          Seeker. If you own a Seeker, nothing changes. The phone stays fully
          supported.
        </p>
      </section>

      <section className={styles.block}>
        <h2>Why it matters</h2>
        <ul>
          <li>First time the Solana dApp Store ships on hardware Solana Mobile did not build.</li>
          <li>1,500+ apps on the store today, covering trading, payments, gaming, and AI.</li>
          <li>Seeker has done over $13 billion in volume and 154 million transactions.</li>
          <li>Over 200,000 Saga and Seeker devices sold.</li>
        </ul>
      </section>

      <div className={styles.actions}>
        <Link className={styles.btn} href="/dapps">
          Browse the dApp Store
        </Link>
        <a
          className={styles.btnGhost}
          href="https://solanamobile.com/blog/solana-mobile-announces-ledger-as-its-first-hardware-expansion-partner"
          target="_blank"
          rel="noopener noreferrer"
        >
          Solana Mobile announcement
        </a>
        <a
          className={styles.btnGhost}
          href="https://ledger.com/seeker"
          target="_blank"
          rel="noopener noreferrer"
        >
          Reserve Ledger Atom
        </a>
      </div>
    </div>
  );
}
