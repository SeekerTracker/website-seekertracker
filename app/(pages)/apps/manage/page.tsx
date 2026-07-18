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

  // claim form
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [pkg, setPkg] = useState("");
  const [email, setEmail] = useState("");

  // edit form
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

  // Exchange magic link token
  useEffect(() => {
    const token = params.get("token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setStatus({ kind: "info", text: "Verifying magic link…" });
      try {
        const res = await fetch("/api/dapps/manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(data.error || "Invalid link");
        }
        fillForm(data.listing as Listing);
        setStatus({
          kind: "ok",
          text: "You’re in. Update fields below and save.",
        });
        // strip token from URL without reload
        window.history.replaceState({}, "", "/apps/manage");
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

  // Existing session?
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

  // Search packages
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
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  const requestLink = async () => {
    if (!pkg || !email) {
      setStatus({ kind: "err", text: "Pick an app and enter your support email." });
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
      setStatus({ kind: "ok", text: "Saved. Catalog will show updates shortly." });
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
    setStatus({ kind: "info", text: "Signed out of manage session." });
  };

  if (phase === "boot") {
    return (
      <main className={styles.main}>
        <Backbutton />
        <p className={styles.lead}>Loading…</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Backbutton />

      <header className={styles.hero}>
        <span className={styles.eyebrow}>Publishers</span>
        <h1 className={styles.title}>Maintain your listing</h1>
        <p className={styles.lead}>
          Claim with the support email on your Solana Mobile dApp Store listing.
          Store name, description, and ratings still sync from the official
          store — you control Seeker Tracker extras (X, Telegram, pitch, links).
        </p>
      </header>

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
          <div className={styles.field}>
            <label className={styles.label} htmlFor="q">
              Find your app
            </label>
            <input
              id="q"
              className={styles.input}
              placeholder="Name or package (e.g. seekertracker)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
            {hits.length > 0 && (
              <ul className={styles.results}>
                {hits.map((h) => (
                  <li key={h.androidPackage}>
                    <button
                      type="button"
                      className={`${styles.resultBtn} ${
                        pkg === h.androidPackage ? styles.resultBtnActive : ""
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
                      <div>
                        <div className={styles.resultName}>{h.displayName}</div>
                        <div className={styles.resultPkg}>
                          {h.androidPackage}
                          {h.supportEmailDomain
                            ? ` · @${h.supportEmailDomain}`
                            : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pkg">
              Android package
            </label>
            <input
              id="pkg"
              className={styles.input}
              value={pkg}
              onChange={(e) => setPkg(e.target.value)}
              placeholder="com.example.app"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Support email on store listing
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.dev"
            />
            <span className={styles.hint}>
              Must match the support email published on the Solana Mobile dApp
              Store (or a contact email you already set here).
            </span>
          </div>

          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => void requestLink()}
          >
            {busy ? "Sending…" : "Email magic link"}
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
                Signed in as {listing.sessionEmail}
              </p>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="blurb">
              Short pitch (Seeker Tracker)
            </label>
            <textarea
              id="blurb"
              className={styles.textarea}
              maxLength={280}
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              placeholder="One or two lines builders see on seekertracker.com"
            />
            <span className={styles.hint}>{blurb.length}/280</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="twitter">
              X / Twitter handle
            </label>
            <input
              id="twitter"
              className={styles.input}
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="@project"
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
              placeholder="t.me/project or @project"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="website">
              Website (override)
            </label>
            <input
              id="website"
              className={styles.input}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
            />
            <span className={styles.hint}>
              Optional. Shown instead of store website when set. Store value:{" "}
              {listing.storeWebsite || "—"}
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="contact">
              Contact email (optional)
            </label>
            <input
              id="contact"
              className={styles.input}
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="team@…"
            />
            <span className={styles.hint}>
              Not shown publicly. Lets you claim with this address later. Store
              support: {listing.supportEmail || "—"}
            </span>
          </div>

          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : "Save listing"}
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
      ) : null}

      <p className={styles.footerNote}>
        <Link href="/apps">Back to dApp catalog</Link>
        {" · "}
        Official store listings still managed via Solana Mobile publisher tools.
      </p>
    </main>
  );
}

export default function ManageListingPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.main}>
          <p className={styles.lead}>Loading…</p>
        </main>
      }
    >
      <ManageInner />
    </Suspense>
  );
}
