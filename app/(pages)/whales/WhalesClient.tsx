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

function formatHold(days: number | null, since: number | null) {
  if (days == null && since == null) return "—";
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

export default function WhalesClient() {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [total, setTotal] = useState(0);
  const [supplyHeld, setSupplyHeld] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minFilter, setMinFilter] = useState<"all" | "1m" | "10m">("all");
  const [q, setQ] = useState("");

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
  }, [minFilter]);

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
          alt="Tracker Whale"
          width={120}
          height={120}
          className={styles.whaleLogo}
          priority
        />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>$TRACKER · holders</p>
          <h1 className={styles.title}>TRACKER Whales</h1>
          <p className={styles.subtitle}>
            Every holder wallet, balance, and how long they&apos;ve been
            holding. Sorted by size.
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
          <span className={styles.metricLabel}>≥10M (this page)</span>
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
          <div className={styles.filters} role="group" aria-label="Min balance">
            {(
              [
                ["all", "All"],
                ["1m", "≥1M"],
                ["10m", "≥10M whales"],
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
          <input
            className={styles.search}
            type="search"
            placeholder="Filter wallet on this page…"
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
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {error && (
          <p className={styles.error}>
            {error}
            <button type="button" className={styles.retry} onClick={() => void load()}>
              Retry
            </button>
          </p>
        )}

        {loading && holders.length === 0 ? (
          <div className={styles.skeletonList} aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : (
          <div className={styles.tableWrap}>
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
              {filtered.length === 0 ? (
                <p className={styles.empty}>No holders match this filter.</p>
              ) : (
                filtered.map((h) => {
                  const isWhale = h.balance >= WHALE_MIN;
                  return (
                    <div
                      key={h.wallet}
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
                        title={
                          h.heldSince
                            ? new Date(h.heldSince * 1000).toISOString()
                            : "Hold time from first TRACKER ATA activity (top wallets)"
                        }
                      >
                        {formatHold(h.heldDays, h.heldSince)}
                      </span>
                      <span className={`${styles.num} ${styles.since}`} role="cell">
                        {h.heldSince
                          ? new Date(h.heldSince * 1000).toLocaleDateString(
                              undefined,
                              { year: "numeric", month: "short", day: "numeric" }
                            )
                          : "—"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
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
            Page {page} / {totalPages}
            {total > 0 && ` · ${total.toLocaleString()} wallets`}
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
          Hold duration uses the oldest on-chain activity on each wallet&apos;s
          primary TRACKER token account (enriched for the largest holders).
          Balances refresh about every few minutes. Not financial advice.
        </p>
      </section>

      {/* Whale chat CTA */}
      <section className={styles.chatCard}>
        <div>
          <h2 className={styles.chatTitle}>Whale Telegram</h2>
          <p className={styles.chatText}>
            Hold ≥{formatBal(WHALE_MIN)} TRACKER, verify on gated.fun, then join
            the private group.
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
