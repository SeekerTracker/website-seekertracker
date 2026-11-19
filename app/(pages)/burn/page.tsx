import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import styles from "./page.module.css";
import BurnHero from "./BurnHero";
import BurnChart from "./BurnChart";
import { fmtPct, fmtRelative, fmtSkr, fmtWhen, fmtWhenShort } from "./format";
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

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "SKR Buy and Burn",
  url: "https://seekertracker.com/burn",
  description:
    "Official SKR buy-and-burn, live from on-chain records. Total SKR burned, share of the 10 billion initial supply, and every official burn since 15 October 2026.",
  isPartOf: {
    "@type": "WebSite",
    name: "Seeker Tracker",
    url: "https://seekertracker.com",
  },
  citation: BURN_SOURCES.map((s) => s.href),
};

const STEPS = [
  {
    title: "Fees collected",
    body: "A portion of Seed Vault Wallet fees — including swaps and the USDC Earn Vault — and Solana Mobile validator commissions is moved into a dedicated buy-and-burn wallet.",
  },
  {
    title: "SKR bought on the open market",
    body: "Each month’s budget is the prior month’s wallet revenue, plus a share of earlier revenue spread over 12 months. A fixed formula sets the amount; an automated recurring order buys SKR.",
  },
  {
    title: "Burned on-chain",
    body: "Every SKR purchased is burned from the official program wallet with memo “Solana Mobile burn.” Holders do not receive the purchased tokens. The program has been live since 15 October 2026.",
  },
] as const;

function chartLabel(day: string, index: number, total: number): string {
  if (index === 0 || index === total - 1 || index % 4 === 0) {
    return day.slice(5);
  }
  return "";
}

export default async function BurnPage() {
  let data: SkrBurnsSnapshot | null = null;
  let error: string | null = null;
  try {
    data = await fetchSkrBurns();
  } catch (e) {
    console.error("/burn fetchSkrBurns", e);
    error = "Live on-chain stats could not be loaded right now.";
  }

  const maxDay = data ? Math.max(1, ...data.daily.map((d) => d.amount)) : 1;
  const lastActiveDay = data
    ? [...data.daily].reverse().find((d) => d.amount > 0)?.day
    : undefined;
  const peak = data
    ? data.daily.reduce(
        (best, d) => (d.amount > best.amount ? d : best),
        { day: "", amount: 0 }
      )
    : null;

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
        Solana Mobile directs a portion of Seed Vault Wallet fees and validator
        commissions to buy SKR on the open market and burn it on-chain. Totals
        are summed from official <code>burnChecked</code> transactions signed by
        the published program wallet, each memoed “Solana Mobile burn.”
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      {data ? (
        <>
          <BurnHero
            totalBurned={data.totalBurned}
            burnCount={data.burnCount}
            lastBurnAt={data.lastBurnAt}
          />

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.num}>
                {fmtSkr(data.burnedLast30Days, 0)}
              </span>
              <span className={styles.label}>Last 30 days</span>
              <span className={styles.source}>Rolling from the latest burn</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.num}>
                {fmtPct(data.percentOfInitialSupply)}
              </span>
              <span className={styles.label}>Of initial supply</span>
              <span className={styles.source}>
                Official genesis, {fmtSkr(SKR_INITIAL_SUPPLY, 0)} SKR
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.num}>
                {fmtSkr(data.currentSupply, 0)}
              </span>
              <span className={styles.label}>Current supply</span>
              <span className={styles.source}>
                On-chain mint · inflation minus burns
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.num}>
                {data.burnCount.toLocaleString("en-US")}
              </span>
              <span className={styles.label}>Official burns</span>
              <span className={styles.source}>
                First burn {fmtWhen(data.firstBurnAt)}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.num}>
                {fmtWhenShort(data.lastBurnAt)}
              </span>
              <span className={styles.label}>Latest burn</span>
              <span className={styles.source}>
                {fmtRelative(data.lastBurnAt)} · Australia/Melbourne
              </span>
            </div>
          </div>
          <p className={styles.asOf}>
            Figures as of {fmtWhen(data.lastBurnAt)} · refreshed{" "}
            {fmtWhen(data.fetchedAt)}
          </p>
        </>
      ) : null}

      <section className={styles.block}>
        <h2>How it works</h2>
        <p className={styles.blockLead}>
          SKR is the native asset of the Solana Mobile ecosystem. Buy-and-burn
          is separate from staking.
        </p>
        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className={styles.stepTitle}>{step.title}</p>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
        <p className={styles.footnote}>
          Mint{" "}
          <a
            href={`https://solscan.io/token/${SKR_MINT}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SKR_MINT}
          </a>
          . Official wallet{" "}
          <a
            href={`https://solscan.io/account/${SKR_BUY_AND_BURN_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SKR_BUY_AND_BURN_WALLET}
          </a>
          . Published inflation starts at 10% in year one and decays toward a
          2% terminal rate.
        </p>
      </section>

      {data && data.daily.length > 0 ? (
        <section className={styles.block}>
          <h2>Daily burns</h2>
          <p className={styles.chartNote}>
            UTC calendar days from the first official burn through the latest.
            Bar height is relative to the peak day in this window
            {peak && peak.amount > 0
              ? ` (${fmtSkr(peak.amount, 0)} SKR on ${peak.day})`
              : ""}
            . Days without a bar had no official burn that date.
          </p>
          <BurnChart>
            <div
              className={styles.chart}
              role="img"
              aria-label="Daily SKR burned"
            >
              {data.daily.map((d, i) => {
                const pct = Math.max(
                  d.amount > 0 ? 4 : 0,
                  (d.amount / maxDay) * 100
                );
                const latest = d.day === lastActiveDay;
                return (
                  <div
                    key={d.day}
                    className={styles.barWrap}
                    tabIndex={0}
                  >
                    <span className={styles.barTip}>
                      {d.day}: {fmtSkr(d.amount, 2)} SKR
                    </span>
                    <div
                      className={`${styles.bar} ${
                        d.amount === 0 ? styles.barEmpty : ""
                      } ${latest ? styles.barLatest : ""}`.trim()}
                      style={{
                        height: `${pct}%`,
                        animationDelay: `${Math.min(i, 24) * 28}ms`,
                      }}
                    />
                    <span className={styles.barDay}>
                      {chartLabel(d.day, i, data.daily.length)}
                    </span>
                  </div>
                );
              })}
            </div>
          </BurnChart>
        </section>
      ) : null}

      {data && data.recent.length > 0 ? (
        <section className={styles.block}>
          <h2>Recent burns</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>SKR burned</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((b) => {
                  const iso = new Date(b.blockTime * 1000).toISOString();
                  return (
                    <tr key={b.signature}>
                      <td>
                        <span className={styles.whenCell}>
                          <span className={styles.whenAbs}>{fmtWhen(iso)}</span>
                          <span className={styles.whenRel}>
                            {fmtRelative(iso)}
                          </span>
                        </span>
                      </td>
                      <td>{fmtSkr(b.amount, 2)}</td>
                      <td>
                        <a
                          className={styles.txLink}
                          href={`https://solscan.io/tx/${b.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {b.signature.slice(0, 8)}…{b.signature.slice(-6)}
                        </a>
                      </td>
                    </tr>
                  );
                })}
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
