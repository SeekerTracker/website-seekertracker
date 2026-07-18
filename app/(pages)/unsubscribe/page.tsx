"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

type Status = { kind: "ok" | "err" | "info"; text: string } | null;

function UnsubscribeForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [productUpdates, setProductUpdates] = useState(true);
  const [publisherNews, setPublisherNews] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [alreadyUnsub, setAlreadyUnsub] = useState(false);

  useEffect(() => {
    const q = params.get("email") || params.get("e") || "";
    if (q) setEmail(q.trim().toLowerCase());
  }, [params]);

  useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/unsubscribe?email=${encodeURIComponent(email)}`
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          unsubscribed?: boolean;
        };
        if (data.unsubscribed) {
          setAlreadyUnsub(true);
          setProductUpdates(false);
          setPublisherNews(false);
          setStatus({
            kind: "info",
            text: "This address is already unsubscribed from Seeker Tracker mail.",
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const submit = useCallback(
    async (mode: "preferences" | "all" | "resubscribe") => {
      const trimmed = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setStatus({ kind: "err", text: "Enter a valid email address." });
        return;
      }
      setBusy(true);
      setStatus(null);
      try {
        const unsubscribed =
          mode === "all" ||
          (mode === "preferences" && !productUpdates && !publisherNews);
        const wantSub = mode === "resubscribe" || !unsubscribed;

        const res = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmed,
            unsubscribed: !wantSub,
            topics: {
              product_updates: mode === "resubscribe" ? true : productUpdates,
              publisher_news: mode === "resubscribe" ? true : publisherNews,
            },
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };
        if (!res.ok || data.error) {
          throw new Error(data.error || "Request failed");
        }
        if (wantSub) {
          setAlreadyUnsub(false);
          setProductUpdates(true);
          setPublisherNews(true);
          setStatus({
            kind: "ok",
            text: "You’re subscribed again. Welcome back.",
          });
        } else if (mode === "all" || (!productUpdates && !publisherNews)) {
          setAlreadyUnsub(true);
          setStatus({
            kind: "ok",
            text: "You’ve been unsubscribed from all Seeker Tracker emails.",
          });
        } else {
          setStatus({
            kind: "ok",
            text: "Preferences saved. We’ll only send what you left on.",
          });
        }
      } catch (e) {
        setStatus({
          kind: "err",
          text: e instanceof Error ? e.message : "Something went wrong.",
        });
      } finally {
        setBusy(false);
      }
    },
    [email, productUpdates, publisherNews]
  );

  return (
    <div className={styles.card}>
      <div className={styles.logoWrap}>
        <Image
          src="/logo.png"
          alt="Seeker Tracker"
          width={56}
          height={56}
          className={styles.logo}
          priority
        />
        <span className={styles.brand}>Seeker Tracker</span>
      </div>

      {alreadyUnsub ? (
        <span className={styles.badge}>Unsubscribed</span>
      ) : null}

      <h1 className={styles.title}>Email preferences</h1>
      <p className={styles.desc}>
        Control messages about SeekerIDs, the dApp catalog, and builder updates.
        Matches the same list we use for Resend broadcasts.
      </p>

      {status ? (
        <p
          className={`${styles.status} ${
            status.kind === "ok"
              ? styles.statusOk
              : status.kind === "err"
                ? styles.statusErr
                : styles.statusInfo
          }`}
          role="status"
        >
          {status.text}
        </p>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className={styles.input}
          type="email"
          autoComplete="email"
          placeholder="you@studio.dev"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setAlreadyUnsub(false);
            setStatus(null);
          }}
        />
      </div>

      <div className={styles.topics} role="group" aria-label="Email topics">
        <label className={styles.topic}>
          <input
            type="checkbox"
            checked={productUpdates}
            onChange={(e) => setProductUpdates(e.target.checked)}
            disabled={alreadyUnsub}
          />
          <span>
            Product &amp; ecosystem updates
            <span className={styles.topicMeta}>
              SeekerID milestones, tracker features, mobile stats
            </span>
          </span>
        </label>
        <label className={styles.topic}>
          <input
            type="checkbox"
            checked={publisherNews}
            onChange={(e) => setPublisherNews(e.target.checked)}
            disabled={alreadyUnsub}
          />
          <span>
            dApp publisher news
            <span className={styles.topicMeta}>
              Store catalog, distribution, builder outreach
            </span>
          </span>
        </label>
      </div>

      <div className={styles.actions}>
        {alreadyUnsub ? (
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => submit("resubscribe")}
          >
            {busy ? "Working…" : "Resubscribe"}
          </button>
        ) : (
          <>
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={() => submit("preferences")}
            >
              {busy ? "Saving…" : "Save preferences"}
            </button>
            <button
              type="button"
              className={styles.danger}
              disabled={busy}
              onClick={() => submit("all")}
            >
              Unsubscribe from all
            </button>
          </>
        )}
      </div>

      <p className={styles.footer}>
        <Link href="/">Back to seekertracker.com</Link>
        {" · "}
        <Link href="/privacy">Privacy</Link>
      </p>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className={styles.page}>
      <Suspense
        fallback={
          <div className={styles.card}>
            <p className={styles.desc}>Loading preferences…</p>
          </div>
        }
      >
        <UnsubscribeForm />
      </Suspense>
    </main>
  );
}
