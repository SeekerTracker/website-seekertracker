"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import { SEEKER_TOKEN_ADDRESS, JUP_REFERRAL } from "app/(utils)/constant";

const GATED_FUN_URL = "https://gated.fun";
const TELEGRAM_INVITE = "https://t.me/+soucwemjeOc5ZTQ1";
const JUPITER_BUY_URL = `https://jup.ag/swap/SOL-${SEEKER_TOKEN_ADDRESS}?ref=${JUP_REFERRAL}`;
const WHALE_MIN = 10_000_000;

type Holder = {
  rank: number;
  wallet: string;
  balance: number;
  heldSince: number | null;
  heldDays: number | null;
};

type ApiResp = {
  success: boolean;
  holders?: Holder[];
  total?: number;
  totalSupplyHeld?: number;
  accountsScanned?: number;
  page?: number;
  pageSize?: number;
  cached?: boolean;
  error?: string;
  details?: string;
};

function formatBal(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 100 ? m.toFixed(1) : m.toFixed(2)}M`;
  }
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toLocaleString();
}

function formatHold(days: number | null) {
  if (days == null) return "—";
  if (days < 1) return "<1d";
  if (days < 30) return `${days}d`;
  if (days < 365) {
    const mo = Math.floor(days / 30);
    const d = days % 30;
    return d > 0 ? `${mo}mo ${d}d` : `${mo}mo`;
  }
  const y = Math.floor(days / 365);
  const mo = Math.floor((days % 365) / 30);
  return mo > 0 ? `${y}y ${mo}mo` : `${y}y`;
}

function shortWallet(w: string) {
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

function addressUrl(w: string) {
  return `https://sol.new/address/${w}`;
}

function sinceLabel(since: number | null) {
  if (!since) return null;
  return new Date(since * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function WhalesClient() {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [total, setTotal] = useState(0);
  const [supplyHeld, setSupplyHeld] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minFilter, setMinFilter] = useState<"all" | "1m" | "10m">("all");
  const [q, setQ] = useState("");

  // Smaller pages on narrow phones
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setPageSize(mq.matches ? 25 : 50);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const minBal =
    minFilter === "10m" ? WHALE_MIN : minFilter === "1m" ? 1_000_000 : 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/tracker/holders?page=${page}&pageSize=${pageSize}&min=${minBal}&enrich=100`;
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as ApiResp;
      if (!res.ok || !data.success) {
        throw new Error(data.details || data.error || `HTTP ${res.status}`);
      }
      setHolders(data.holders || []);
      setTotal(data.total || 0);
      setSupplyHeld(data.totalSupplyHeld || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load holders");
      setHolders([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, minBal]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [minFilter, pageSize]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return holders;
    return holders.filter((h) => h.wallet.toLowerCase().includes(needle));
  }, [holders, q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const whaleCount = useMemo(
    () => holders.filter((h) => h.balance >= WHALE_MIN).length,
    [holders]
  );

  return (
    <main className={styles.main}>
      <div className={styles.backRow}>
        <Backbutton />
      </div>

      <header className={styles.hero}>
        <Image
          src="/tracker-whale.png"
          alt=""
          width={88}
          height={88}
          className={styles.whaleLogo}
          priority
        />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>$TRACKER · holders</p>
          <h1 className={styles.title}>TRACKER Whales</h1>
          <p className={styles.subtitle}>
            Balance + how long each wallet has been holding. Sorted by size.
          </p>
        </div>
      </header>

      <section className={styles.metrics} aria-label="Holder stats">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Holders</span>
          <strong className={styles.metricValue}>
            {loading && !total ? "…" : total.toLocaleString()}
          </strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Held supply</span>
          <strong className={styles.metricValue}>
            {loading && !supplyHeld ? "…" : formatBal(supplyHeld)}
          </strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>≥10M here</span>
          <strong className={styles.metricValue}>
            {loading ? "…" : whaleCount.toLocaleString()}
          </strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Mint</span>
          <a
            className={styles.metricLink}
            href={addressUrl(SEEKER_TOKEN_ADDRESS)}
            target="_blank"
            rel="noopener noreferrer"
          >
            ehip…BAGS
          </a>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.filterScroll}>
            <div className={styles.filters} role="group" aria-label="Min balance">
              {(
                [
                  ["all", "All"],
                  ["1m", "≥1M"],
                  ["10m", "≥10M"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.chip} ${
                    minFilter === id ? styles.chipActive : ""
                  }`}
                  onClick={() => setMinFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.searchRow}>
            <input
              className={styles.search}
              type="search"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Filter wallet…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Filter wallets"
            />
            <button
              type="button"
              className={styles.refresh}
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? "…" : "↻"}
              <span className={styles.refreshLabel}>
                {loading ? "Loading" : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <p className={styles.error}>
            <span>{error}</span>
            <button
              type="button"
              className={styles.retry}
              onClick={() => void load()}
            >
              Retry
            </button>
          </p>
        )}

        {loading && holders.length === 0 ? (
          <div className={styles.skeletonList} aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>No holders match this filter.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className={styles.tableWrap} data-desktop>
              <div className={styles.table} role="table">
                <div className={styles.thead} role="row">
                  <span role="columnheader">#</span>
                  <span role="columnheader">Wallet</span>
                  <span role="columnheader" className={styles.num}>
                    TRACKER
                  </span>
                  <span role="columnheader" className={styles.num}>
                    Held
                  </span>
                  <span role="columnheader" className={styles.num}>
                    Since
                  </span>
                </div>
                {filtered.map((h) => {
                  const isWhale = h.balance >= WHALE_MIN;
                  return (
                    <div
                      key={`t-${h.wallet}`}
                      className={`${styles.trow} ${
                        isWhale ? styles.trowWhale : ""
                      }`}
                      role="row"
                    >
                      <span className={styles.rank} role="cell">
                        {h.rank}
                      </span>
                      <span className={styles.wallet} role="cell">
                        <a
                          href={addressUrl(h.wallet)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.walletLink}
                        >
                          {shortWallet(h.wallet)}
                        </a>
                        {isWhale && (
                          <span className={styles.whaleChip}>whale</span>
                        )}
                      </span>
                      <span
                        className={`${styles.num} ${styles.bal}`}
                        role="cell"
                        title={h.balance.toLocaleString()}
                      >
                        {formatBal(h.balance)}
                      </span>
                      <span
                        className={`${styles.num} ${styles.hold}`}
                        role="cell"
                      >
                        {formatHold(h.heldDays)}
                      </span>
                      <span
                        className={`${styles.num} ${styles.since}`}
                        role="cell"
                      >
                        {sinceLabel(h.heldSince) || "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile cards */}
            <ul className={styles.cardList} data-mobile>
              {filtered.map((h) => {
                const isWhale = h.balance >= WHALE_MIN;
                const since = sinceLabel(h.heldSince);
                return (
                  <li
                    key={`c-${h.wallet}`}
                    className={`${styles.card} ${
                      isWhale ? styles.cardWhale : ""
                    }`}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.cardRank}>#{h.rank}</span>
                      <a
                        href={addressUrl(h.wallet)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.cardWallet}
                      >
                        {shortWallet(h.wallet)}
                      </a>
                      {isWhale && (
                        <span className={styles.whaleChip}>whale</span>
                      )}
                    </div>
                    <div className={styles.cardStats}>
                      <div className={styles.cardStat}>
                        <span className={styles.cardStatLabel}>TRACKER</span>
                        <strong className={styles.cardBal}>
                          {formatBal(h.balance)}
                        </strong>
                      </div>
                      <div className={styles.cardStat}>
                        <span className={styles.cardStatLabel}>Held</span>
                        <strong className={styles.cardHold}>
                          {formatHold(h.heldDays)}
                        </strong>
                      </div>
                      <div className={styles.cardStat}>
                        <span className={styles.cardStatLabel}>Since</span>
                        <strong className={styles.cardSince}>
                          {since || "—"}
                        </strong>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className={styles.pageMeta}>
            <span className={styles.pageNum}>
              {page}/{totalPages}
            </span>
            {total > 0 && (
              <span className={styles.pageTotal}>
                {total.toLocaleString()} wallets
              </span>
            )}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>

        <p className={styles.note}>
          Hold time = first on-chain activity on the wallet&apos;s main TRACKER
          token account (top holders). Refreshes every few minutes.
        </p>
      </section>

      <section className={styles.chatCard}>
        <div className={styles.chatCopy}>
          <h2 className={styles.chatTitle}>Whale Telegram</h2>
          <p className={styles.chatText}>
            Hold ≥{formatBal(WHALE_MIN)} TRACKER, verify on gated.fun, join the
            private group.
          </p>
        </div>
        <div className={styles.chatActions}>
          <Link
            href={GATED_FUN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primaryButton}
          >
            Verify on gated.fun
          </Link>
          <Link
            href={TELEGRAM_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.telegramButton}
          >
            Join Whale Chat
          </Link>
          <Link
            href={JUPITER_BUY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.buyLink}
          >
            Buy TRACKER →
          </Link>
        </div>
      </section>
    </main>
  );
}
