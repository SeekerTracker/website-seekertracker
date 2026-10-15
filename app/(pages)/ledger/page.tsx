import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import styles from "./page.module.css";

const SM =
  "https://solanamobile.com/blog/solana-mobile-announces-ledger-as-its-first-hardware-expansion-partner";
const LEDGER = "https://www.ledger.com/blog-introducing-ledger-atom";

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
  citation: [SM, LEDGER],
};

const STATS = [
  {
    num: "8M",
    label: "Ledger devices",
    source: "Ledger, 15 Oct 2026",
    href: LEDGER,
  },
  {
    num: "20%",
    label: "of world crypto",
    source: "Ledger, 15 Oct 2026",
    href: LEDGER,
  },
  {
    num: "1,500+",
    label: "dApps on the store",
    source: "Solana Mobile, 14 Oct 2026",
    href: SM,
  },
  {
    num: "200k+",
    label: "Saga + Seeker sold",
    source: "Solana Mobile, 14 Oct 2026",
    href: SM,
  },
];

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
        {STATS.map((s) => (
          <a key={s.label} className={styles.stat} href={s.href} target="_blank" rel="noopener noreferrer">
            <span className={styles.num}>{s.num}</span>
            <span className={styles.label}>{s.label}</span>
            <span className={styles.source}>{s.source}</span>
          </a>
        ))}
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
          <li>
            First time the Solana dApp Store ships on hardware Solana Mobile did
            not build.{" "}
            <a href={SM} target="_blank" rel="noopener noreferrer">
              Solana Mobile
            </a>
          </li>
          <li>
            Over $13 billion in Seeker volume and 154 million transactions.{" "}
            <a href={SM} target="_blank" rel="noopener noreferrer">
              Solana Mobile
            </a>
          </li>
          <li>
            More than eight million Ledger devices in 165 countries.{" "}
            <a href={LEDGER} target="_blank" rel="noopener noreferrer">
              Ledger
            </a>
          </li>
        </ul>
      </section>

      <section className={styles.block}>
        <h2>Seeker Tracker outlook</h2>
        <p>
          Seeker Tracker expects the Solana dApp Store to reach about 2 million
          devices next year as Atom joins Seeker. That is our view, not a Ledger
          or Solana Mobile forecast.
        </p>
      </section>

      <section className={styles.block} id="sources">
        <h2>Sources</h2>
        <ul>
          <li>
            <a href={SM} target="_blank" rel="noopener noreferrer">
              Solana Mobile: Ledger is the first hardware expansion partner
            </a>
            . Partner, Atom, summer 2027, 1,500+ apps, $13B volume, 154 million
            transactions, 200,000+ devices sold.
          </li>
          <li>
            <a href={LEDGER} target="_blank" rel="noopener noreferrer">
              Ledger: Introducing Ledger Atom
            </a>
            . More than eight million devices, 165 countries, more than 20% of
            the world crypto secured by Ledger.
          </li>
        </ul>
      </section>

      <div className={styles.actions}>
        <Link className={styles.btn} href="/dapps">
          Browse the dApp Store
        </Link>
        <a className={styles.btnGhost} href={SM} target="_blank" rel="noopener noreferrer">
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
