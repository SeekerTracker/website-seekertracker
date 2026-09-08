"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JUP_REFERRAL } from "app/(utils)/constant";
import styles from "./page.module.css";

const MINT = "9ZrGHKCdX2Bf5GWiGb9wSGGdBTMoZQqdEyzChapwE2Cx";
const BUY = `https://jup.ag/tokens/${MINT}?ref=${JUP_REFERRAL}`;
const CHART = `https://birdeye.so/token/${MINT}?chain=solana`;
const TV = `https://birdeye.so/tv-widget/${MINT}?chain=solana&viewMode=pair&chartInterval=15&chartType=CANDLE&theme=dark`;
const ICON =
  "https://gateway.irys.xyz/Drf1WTjkGeNCDME1A2vZDRsALrfpPtMKJAubmdTpbx6b";

type Payout = {
  signature?: string;
  at?: string;
  skrAmount?: number;
  usd?: number;
  receipt?: string;
};

type Stats = {
  ok?: boolean;
  asOf?: string;
  token?: {
    mint?: string;
    symbol?: string;
    name?: string;
    icon?: string;
    taxBps?: number;
    daysLive?: number;
  };
  market?: {
    priceUsd?: number;
    skrUsd?: number;
    mcapUsd?: number;
    peakMcapUsd?: number;
    change24h?: number;
    holders?: number;
  };
  volume?: {
    h1?: number;
    h6?: number;
    h24?: number;
    traders24h?: number;
    buys24h?: number;
    sells24h?: number;
  };
  rewards?: {
    distributedSkr?: number;
    distributedUsd?: number;
    undistributedSkr?: number;
    undistributedUsd?: number;
    payoutCount?: number;
    holderCount?: number;
    lastPayoutAt?: string;
    dailyAvgUsd?: number;
    dailyAvgSkr?: number;
  };
  burns?: { amount?: number; valueUsd?: number; count?: number };
  payouts?: Payout[];
};

function usd(n: number | undefined | null, d?: number) {
  if (n == null || !Number.isFinite(n)) return "-";
  const abs = Math.abs(n);
  const digits = d != null ? d : abs >= 1000 ? 0 : abs >= 1 ? 2 : 4;
  return (
    "$" +
    n.toLocaleString("en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    })
  );
}

function tok(n: number | undefined | null, sym: string) {
  if (n == null || !Number.isFinite(n)) return "-";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : 4;
  return (
    n.toLocaleString("en-US", { maximumFractionDigits: digits }) +
    (sym ? " " + sym : "")
  );
}

function ago(iso?: string) {
  if (!iso) return "-";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 48) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

export default function RksClient() {
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState(false);
  const [volKey, setVolKey] = useState<"h1" | "h6" | "h24">("h24");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rks", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as Stats;
      setData(json);
      setErr(false);
    } catch {
      setErr(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const t = data?.token || {};
  const m = data?.market || {};
  const v = data?.volume || {};
  const r = data?.rewards || {};
  const b = data?.burns || {};
  const chg = m.change24h;
  const chgTxt =
    chg == null || !Number.isFinite(chg)
      ? ""
      : (chg > 0 ? "+" : "") + chg.toFixed(1) + "% 24h";
  const volNow = v[volKey] || 0;
  const maxV = Math.max(v.h1 || 0, v.h6 || 0, v.h24 || 0, 1);
  const taxPct = ((t.taxBps || 300) / 100).toFixed(0);

  const bars = useMemo(
    () =>
      [
        ["1h", v.h1],
        ["6h", v.h6],
        ["24h", v.h24],
      ] as const,
    [v.h1, v.h6, v.h24],
  );

  function copyCa() {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(MINT).then(done).catch(() => window.prompt("CA", MINT));
    } else window.prompt("CA", MINT);
  }

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <p className={styles.eyebrow}>$RKS · {taxPct}% holder tax</p>
        <h1 className={styles.header}>RKS</h1>
        <p className={styles.subheader}>
          {t.symbol ? `$${t.symbol}` : "$RKS"} · {t.name || "REKEES"} · tax paid in $SKR
        </p>
      </div>

      <div className={styles.hero}>
        <img
          className={styles.tokenIcon}
          src={t.icon || ICON}
          alt=""
          width={56}
          height={56}
        />
        <p className={styles.lead}>
          Every transfer of $RKS takes a {taxPct}% tax. That tax is paid to holders in $SKR.
          There is no creator fee wallet. Trading fees on the pool go to the launchpad.
        </p>
      </div>

      <div className={styles.actions}>
        <a className={styles.primary} href={BUY} target="_blank" rel="noopener noreferrer">
          Buy $RKS
        </a>
        <button className={styles.btn} type="button" onClick={copyCa}>
          {copied ? "Copied" : "Copy CA"}
        </button>
        <a className={styles.btn} href={CHART} target="_blank" rel="noopener noreferrer">
          Chart
        </a>
      </div>

      <p className={styles.note}>
        USD uses the live $SKR mark. Volume is 1h / 6h / 24h on the token markets. Burns are
        platform fee-sweep burns of $RKS, which may be zero.
      </p>

      <h2 className={styles.h2}>Traded volume</h2>
      <div className={styles.tabs}>
        {(["h1", "h6", "h24"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={volKey === k ? styles.tabOn : styles.tab}
            onClick={() => setVolKey(k)}
          >
            {k === "h24" ? "24h" : k === "h6" ? "6h" : "1h"}
          </button>
        ))}
      </div>
      <div className={styles.grid3}>
        <Card
          k="Volume"
          v={usd(volNow)}
          s={`Selected window · ${volKey === "h24" ? "24h" : volKey === "h6" ? "6h" : "1h"}`}
        />
        <Card
          k="Market cap"
          v={usd(m.mcapUsd)}
          s={`Peak ${usd(m.peakMcapUsd)}${chgTxt ? " · " + chgTxt : ""}`}
          tone={chg != null && chg > 0 ? "up" : chg != null && chg < 0 ? "down" : undefined}
        />
        <Card
          k="Traders 24h"
          v={(v.traders24h || 0).toLocaleString("en-US")}
          s={`${v.buys24h || 0} buys · ${v.sells24h || 0} sells`}
        />
      </div>

      <div className={styles.grid3}>
        <Card
          k="Holder revenue"
          v={usd(r.distributedUsd)}
          s={`${tok(r.distributedSkr, "SKR")} paid to holders`}
        />
        <Card
          k="Payouts"
          v={(r.payoutCount || 0).toLocaleString("en-US")}
          s={`${(r.holderCount || 0).toLocaleString("en-US")} holders paid · last ${ago(r.lastPayoutAt)}`}
        />
        <Card
          k="$RKS burned"
          v={usd(b.valueUsd)}
          s={`${tok(b.amount, "RKS")} · ${b.count || 0} burns`}
        />
      </div>

      <h2 className={styles.h2}>Volume mix</h2>
      <div className={styles.card}>
        <div className={styles.bars}>
          {bars.map(([lab, val]) => (
            <div key={lab} className={styles.barCol}>
              <div className={styles.barVal}>{usd(val)}</div>
              <div
                className={styles.bar}
                style={{ height: Math.max(4, Math.round(((val || 0) / maxV) * 120)) }}
              />
              <div className={styles.barLab}>{lab}</div>
            </div>
          ))}
        </div>
      </div>

      <h2 className={styles.h2}>Payouts</h2>
      <div className={styles.grid2}>
        <Card
          k="Daily average"
          v={usd(r.dailyAvgUsd)}
          s={`${tok(r.dailyAvgSkr, "SKR")} / day · ${t.daysLive ? t.daysLive.toFixed(1) + " days live" : "since launch"}`}
        />
        <Card
          k="Undistributed"
          v={tok(r.undistributedSkr, "SKR")}
          s={`${usd(r.undistributedUsd)} waiting on the next sweep · $SKR ${usd(m.skrUsd, 4)}`}
        />
      </div>

      <h2 className={styles.h2}>Latest payouts</h2>
      <p className={styles.note}>
        Each row is one tax sweep: withheld $RKS sold for $SKR, then paid to holders. Receipt
        opens sol.new.
      </p>
      <div className={styles.list}>
        {!data?.payouts?.length ? (
          <div className={styles.s}>No sweeps in the recent window</div>
        ) : (
          data.payouts.map((p) => (
            <div key={p.signature || p.at} className={styles.pay}>
              <div>
                <div className={styles.amt}>{tok(p.skrAmount, "SKR")}</div>
                <div className={styles.meta}>{usd(p.usd)} · tax swept to $SKR</div>
              </div>
              <div className={styles.payRight}>
                <div className={styles.meta}>{ago(p.at)}</div>
                {p.receipt ? (
                  <a href={p.receipt} target="_blank" rel="noopener noreferrer">
                    receipt
                  </a>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className={styles.h2}>Price</h2>
      <div className={styles.chartWrap}>
        <iframe title="$RKS chart" src={TV} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>

      <p className={styles.disclaimer}>
        Not financial advice. Holder tax is on-chain. Figures refresh every 30 seconds. Peak
        market cap is the all-time print from the launch tape, not a promise it returns.
      </p>
      <div className={styles.live}>
        <span className={err ? styles.dotErr : styles.dot} />
        <span>{err ? "Refresh failed" : data?.asOf ? "Updated " + ago(data.asOf) : "Loading"}</span>
      </div>
    </main>
  );
}

function Card({
  k,
  v,
  s,
  tone,
}: {
  k: string;
  v: string;
  s?: string;
  tone?: "up" | "down";
}) {
  return (
    <div className={styles.card}>
      <div className={styles.k}>{k}</div>
      <div
        className={
          tone === "up" ? styles.vUp : tone === "down" ? styles.vDown : styles.v
        }
      >
        {v}
      </div>
      {s ? <div className={styles.s}>{s}</div> : null}
    </div>
  );
}
