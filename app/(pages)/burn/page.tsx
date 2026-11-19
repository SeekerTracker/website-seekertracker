import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import styles from "./page.module.css";
import {
  BURN_SOURCES,
  SKR_BUY_AND_BURN_WALLET,
  SKR_INITIAL_SUPPLY,
  SKR_MINT,
  fetchSkrBurns,
  type SkrBurnsSnapshot,
} from "app/(utils)/lib/skrBurns";

export const dynamic = "force-dynamic";
export const revalidate = 300;

function fmtSkr(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}%`;
}

function fmtWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      timeZone: "Australia/Melbourne",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "SKR Buy and Burn",
  url: "https://seekertracker.com/burn",
  description:
    "Live SKR buy-and-burn totals from Solana Mobile's official on-chain program.",
  isPartOf: {
    "@type": "WebSite",
    name: "Seeker Tracker",
    url: "https://seekertracker.com",
  },
  citation: BURN_SOURCES.map((s) => s.href),
};

export default async function BurnPage() {
  let data: SkrBurnsSnapshot | null = null;
  let error: string | null = null;
  try {
    data = await fetchSkrBurns();
  } catch (e) {
    console.error("/burn fetchSkrBurns", e);
    error = "Live on-chain stats could not be loaded right now.";
  }

  const maxDay = data
    ? Math.max(1, ...data.daily.map((d) => d.amount))
    : 1;

  return (
    <div className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Backbutton />
      <p className={styles.kicker}>SKR · official program</p>
      <h1 className={styles.title}>Buy and burn</h1>
      <p className={styles.lead}>
        Solana Mobile uses a portion of Seed Vault Wallet fees and Solana Mobile
        validator commissions to buy SKR on the open market and burn it on-chain,
        every day since 15 October 2026. Nothing here is estimated — totals are
        summed from official{" "}
        <code>burnChecked</code> transactions signed by the published program
        wallet, each memoed &ldquo;Solana Mobile burn&rdquo;.
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      {data ? (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.num}>{fmtSkr(data.totalBurned, 0)}</span>
              <span className={styles.label}>SKR burned</span>
              <span className={styles.source}>
                {data.burnCount} official burns
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.num}>
                {fmtSkr(data.burnedLast30Days, 0)}
              </span>
              <span className={styles.label}>Last 30 days</span>
              <span className={styles.source}>Rolling from latest burn</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.num}>
                {fmtPct(data.percentOfInitialSupply)}
              </span>
              <span className={styles.label}>Of initial 10B supply</span>
              <span className={styles.source}>Official genesis tokenomics</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.num}>
                {fmtSkr(data.currentSupply, 0)}
              </span>
              <span className={styles.label}>Current mint supply</span>
              <span className={styles.source}>
                On-chain · includes inflation minus burns
              </span>
            </div>
          </div>
          <p className={styles.asOf}>
            As of {fmtWhen(data.lastBurnAt)} Australia/Melbourne · first burn{" "}
            {fmtWhen(data.firstBurnAt)} · refreshed {fmtWhen(data.fetchedAt)}
          </p>
        </>
      ) : null}

      <section className={styles.block}>
        <h2>How the mechanic works</h2>
        <p>
          SKR is the native asset of the Solana Mobile ecosystem (mint{" "}
          <a
            href={`https://solscan.io/token/${SKR_MINT}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SKR_MINT}
          </a>
          ). Official initial supply is {fmtSkr(SKR_INITIAL_SUPPLY, 0)} SKR, with
          a published inflation schedule (10% in year one, decaying toward a 2%
          terminal rate). Buy-and-burn is separate from staking — holders do not
          receive the purchased tokens.
        </p>
        <ol className={styles.steps}>
          <li>
            A portion of revenue from the Solana Mobile validator (staking
            commissions) and the Seed Vault Wallet (fees such as swaps and the
            USDC Earn Vault) is moved into a dedicated buy-and-burn wallet.
          </li>
          <li>
            Each month&apos;s budget is the prior month&apos;s wallet revenue,
            plus a share of earlier wallet revenue spread over 12 months. A
            fixed formula sets the amount; an automated recurring order buys SKR
            on the open market.
          </li>
          <li>
            Every SKR bought is burned on-chain from{" "}
            <a
              href={`https://solscan.io/account/${SKR_BUY_AND_BURN_WALLET}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {SKR_BUY_AND_BURN_WALLET}
            </a>{" "}
            with memo <code>Solana Mobile burn</code>. The program has been live
            since 15 October 2026. Days with no bar had no official burn
            transaction on that UTC date.
          </li>
        </ol>
      </section>

      {data && data.daily.length > 0 ? (
        <section className={styles.block}>
          <h2>Daily burns</h2>
          <p className={styles.chartNote}>
            UTC calendar days from the first official burn through the latest.
            Height is relative to the largest day in this window.
          </p>
          <div className={styles.chart} role="img" aria-label="Daily SKR burned">
            {data.daily.map((d) => {
              const pct = Math.max(d.amount > 0 ? 4 : 0, (d.amount / maxDay) * 100);
              return (
                <div key={d.day} className={styles.barWrap} title={`${d.day}: ${fmtSkr(d.amount, 2)} SKR`}>
                  <div
                    className={`${styles.bar} ${d.amount === 0 ? styles.barEmpty : ""}`}
                    style={{ height: `${pct}%` }}
                  />
                  <span className={styles.barDay}>{d.day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {data && data.recent.length > 0 ? (
        <section className={styles.block}>
          <h2>Recent burns</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When (Melbourne)</th>
                  <th>SKR burned</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((b) => (
                  <tr key={b.signature}>
                    <td>{fmtWhen(new Date(b.blockTime * 1000).toISOString())}</td>
                    <td>{fmtSkr(b.amount, 2)}</td>
                    <td>
                      <a
                        href={`https://solscan.io/tx/${b.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {b.signature.slice(0, 8)}…{b.signature.slice(-6)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className={styles.block}>
        <h2>Sources</h2>
        <ul className={styles.sources}>
          {BURN_SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.chartNote}>
          JSON: <Link href="/api/skr/burns">/api/skr/burns</Link>
          {" · "}
          SKR dashboard: <Link href="/skr">/skr</Link>
        </p>
      </section>
    </div>
  );
}
