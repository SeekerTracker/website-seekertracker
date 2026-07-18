"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Backbutton from "app/(components)/shared/Backbutton";
import styles from "./page.module.css";

type Listing = {
  androidPackage: string;
  displayName: string;
  iconUri: string | null;
  publisherName: string | null;
  storeWebsite: string | null;
  supportEmail: string | null;
  status: string;
  claimedAt: string | null;
  sessionEmail: string;
  twitter: string;
  telegram: string;
  blurb: string;
  website_override: string;
  contact_email: string;
};

type SearchHit = {
  androidPackage: string;
  displayName: string;
  iconUri: string | null;
  publisherName: string | null;
  supportEmailDomain: string | null;
  status: string;
};

type Status = { kind: "ok" | "err" | "info"; text: string } | null;

function ManageInner() {
  const params = useSearchParams();
  const [phase, setPhase] = useState<"boot" | "claim" | "edit">("boot");
  const [listing, setListing] = useState<Listing | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [pkg, setPkg] = useState("");
  const [email, setEmail] = useState("");

  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [blurb, setBlurb] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const fillForm = useCallback((l: Listing) => {
    setListing(l);
    setTwitter(l.twitter || "");
    setTelegram(l.telegram || "");
    setBlurb(l.blurb || "");
    setWebsite(l.website_override || "");
    setContactEmail(l.contact_email || "");
    setPhase("edit");
  }, []);

  useEffect(() => {
    const token = params.get("token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setStatus({ kind: "info", text: "Verifying your link…" });
      try {
        const res = await fetch("/api/dapps/manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Invalid link");
        fillForm(data.listing as Listing);
        setStatus({
          kind: "ok",
          text: "Signed in. Update your Seeker Tracker extras below.",
        });
        const base = window.location.pathname.startsWith("/dapps")
          ? "/dapps/manage"
          : "/apps/manage";
        window.history.replaceState({}, "", base);
      } catch (e) {
        if (!cancelled) {
          setStatus({
            kind: "err",
            text: e instanceof Error ? e.message : "Link failed",
          });
          setPhase("claim");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, fillForm]);

  useEffect(() => {
    if (params.get("token")) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dapps/manage");
        const data = await res.json();
        if (cancelled) return;
        if (data.authenticated && data.listing) {
          fillForm(data.listing as Listing);
        } else {
          setPhase("claim");
        }
      } catch {
        if (!cancelled) setPhase("claim");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, fillForm]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dapps/claim?q=${encodeURIComponent(q.trim())}`
        );
        const data = await res.json();
        setHits((data.results as SearchHit[]) || []);
      } catch {
        setHits([]);
      }
    }, 260);
    return () => clearTimeout(t);
  }, [q]);

  const requestLink = async () => {
    if (!pkg || !email) {
      setStatus({
        kind: "err",
        text: "Select an app and enter the support email from the store listing.",
      });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/dapps/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ androidPackage: pkg, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setStatus({
        kind: "ok",
        text:
          data.message ||
          "If that email matches the listing, check your inbox for a magic link.",
      });
    } catch (e) {
      setStatus({
        kind: "err",
        text: e instanceof Error ? e.message : "Failed",
      });
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/dapps/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitter,
          telegram,
          blurb,
          website_override: website,
          contact_email: contactEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.listing) fillForm(data.listing as Listing);
      setStatus({ kind: "ok", text: "Saved. Changes show on the catalog shortly." });
    } catch (e) {
      setStatus({
        kind: "err",
        text: e instanceof Error ? e.message : "Save failed",
      });
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/dapps/manage", { method: "DELETE" });
    setListing(null);
    setPhase("claim");
    setStatus({ kind: "info", text: "Signed out." });
  };

  if (phase === "boot") {
    return (
      <div className={styles.shell}>
        <main className={styles.main}>
          <Backbutton />
          <div className={styles.loadingBox}>
            <div className={styles.spinner} aria-hidden />
            <span>Loading…</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Backbutton />

        <header className={styles.hero}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden />
            Publisher tools
          </p>
          <h1 className={styles.title}>
            Maintain your{" "}
            <span className={styles.titleAccent}>listing</span>
          </h1>
          <p className={styles.lead}>
            Verify ownership with the support email on your Solana Mobile store
            listing. Official store metadata keeps syncing — you control X,
            Telegram, pitch, and links on Seeker Tracker.
          </p>
        </header>

        {phase === "claim" ? (
          <div className={styles.steps} aria-hidden>
            <div className={`${styles.step} ${styles.stepOn}`} />
            <div className={styles.step} />
          </div>
        ) : (
          <div className={styles.steps} aria-hidden>
            <div className={`${styles.step} ${styles.stepOn}`} />
            <div className={`${styles.step} ${styles.stepOn}`} />
          </div>
        )}

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

        {phase === "claim" ? (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2>Claim your app</h2>
              <p>Search the catalog, then we email a one-time sign-in link.</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="q">
                Find your app
              </label>
              <input
                id="q"
                className={styles.input}
                placeholder="Search by name or package"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
                autoFocus
              />
              {hits.length > 0 && (
                <ul className={styles.results} role="listbox" aria-label="Matching apps">
                  {hits.map((h) => {
                    const active = pkg === h.androidPackage;
                    return (
                      <li key={h.androidPackage}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`${styles.resultBtn} ${
                            active ? styles.resultBtnActive : ""
                          }`}
                          onClick={() => {
                            setPkg(h.androidPackage);
                            setQ(h.displayName);
                          }}
                        >
                          {h.iconUri ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className={styles.resultIcon}
                              src={h.iconUri}
                              alt=""
                            />
                          ) : (
                            <div className={styles.resultIcon} />
                          )}
                          <div className={styles.resultText}>
                            <div className={styles.resultName}>
                              {h.displayName}
                            </div>
                            <div className={styles.resultPkg}>
                              {h.androidPackage}
                              {h.supportEmailDomain
                                ? ` · @${h.supportEmailDomain}`
                                : ""}
                            </div>
                          </div>
                          <span className={styles.check} aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {pkg ? (
                <div className={styles.pkgChip}>
                  Selected <strong>{pkg}</strong>
                </div>
              ) : null}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Store support email
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.dev"
              />
              <span className={styles.hint}>
                Must match the support email on the Solana Mobile dApp Store
                listing (or a contact email already saved here).
              </span>
            </div>

            <button
              type="button"
              className={styles.primary}
              disabled={busy || !pkg || !email}
              onClick={() => void requestLink()}
            >
              {busy ? "Sending…" : "Send magic link"}
            </button>
          </div>
        ) : null}

        {phase === "edit" && listing ? (
          <div className={styles.card}>
            <div className={styles.appRow}>
              {listing.iconUri ? (
                <Image
                  className={styles.appIcon}
                  src={listing.iconUri}
                  alt=""
                  width={52}
                  height={52}
                  unoptimized
                />
              ) : (
                <div className={styles.appIcon} />
              )}
              <div>
                <p className={styles.appName}>{listing.displayName}</p>
                <p className={styles.appMeta}>
                  {listing.androidPackage}
                  <br />
                  {listing.sessionEmail}
                </p>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="blurb">
                Short pitch
              </label>
              <textarea
                id="blurb"
                className={styles.textarea}
                maxLength={280}
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                placeholder="One or two lines builders see on Seeker Tracker"
              />
              <span className={styles.charCount}>{blurb.length}/280</span>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="twitter">
                  X handle
                </label>
                <input
                  id="twitter"
                  className={styles.input}
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@project"
                  autoComplete="off"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="telegram">
                  Telegram
                </label>
                <input
                  id="telegram"
                  className={styles.input}
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@project"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="website">
                Website
              </label>
              <input
                id="website"
                className={styles.input}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                inputMode="url"
              />
              <span className={styles.hint}>
                Optional override. Store default:{" "}
                {listing.storeWebsite || "none"}
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="contact">
                Backup claim email
              </label>
              <input
                id="contact"
                className={styles.input}
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="team@…"
                autoComplete="email"
              />
              <span className={styles.hint}>
                Private. Not shown on the catalog. Store support:{" "}
                {listing.supportEmail || "—"}
              </span>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primary}
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className={styles.secondary}
                disabled={busy}
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : null}

        <p className={styles.footerNote}>
          <Link href="/apps">Back to catalog</Link>
          {" · "}
          Official store listings stay on Solana Mobile publisher tools.
        </p>
      </main>
    </div>
  );
}

export default function ManageListingPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.shell}>
          <main className={styles.main}>
            <div className={styles.loadingBox}>
              <div className={styles.spinner} aria-hidden />
              <span>Loading…</span>
            </div>
          </main>
        </div>
      }
    >
      <ManageInner />
    </Suspense>
  );
}
