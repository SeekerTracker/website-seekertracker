"use client";

import React, { useEffect, useId, useState } from "react";
import Image from "next/image";
import styles from "./TelegramModal.module.css";
import { analytics } from "app/(utils)/lib/analytics";

const STORAGE_KEY = "seekertracker_telegram_modal_dismissed";
const TG_URL = "https://t.me/seeker_tracker";
const X_URL = "https://x.com/Seeker_Tracker";

export default function TelegramModal() {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const force = params?.get("modal") === "1" || params?.get("channels") === "1";
    if (force) {
      localStorage.removeItem(STORAGE_KEY);
      setIsOpen(true);
      return;
    }
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    const timer = setTimeout(() => setIsOpen(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    analytics.telegramDismiss();
  };

  const openExternal = (url: string, label: "telegram" | "x") => {
    if (label === "telegram") analytics.telegramJoin();
    else analytics.externalLink(url, "follow_x_modal");
    // Open first, then keep modal so user can hit the other channel
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <aside
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className={styles.glow} aria-hidden />
        <div className={styles.gridBg} aria-hidden />

        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Dismiss"
        >
          ×
        </button>

        <div className={styles.content}>
          <div className={styles.livePill}>
            <span className={styles.liveDot} aria-hidden />
            Live updates
          </div>

          <h2 id={titleId} className={styles.title}>
            Stay in the loop
          </h2>
          <p id={descId} className={styles.description}>
            .skr activations, alpha, and product drops. Pick a channel — or both.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.channelBtn} ${styles.tg}`}
              onClick={() => openExternal(TG_URL, "telegram")}
            >
              <Image
                src="/icons/tg.png"
                alt=""
                width={18}
                height={18}
                className={styles.channelIcon}
              />
              <span className={styles.channelCopy}>
                <strong>Telegram</strong>
                <em>Join the channel</em>
              </span>
              <span className={styles.chev} aria-hidden>
                →
              </span>
            </button>

            <button
              type="button"
              className={`${styles.channelBtn} ${styles.x}`}
              onClick={() => openExternal(X_URL, "x")}
            >
              <Image
                src="/icons/x.png"
                alt=""
                width={16}
                height={16}
                className={styles.channelIcon}
              />
              <span className={styles.channelCopy}>
                <strong>X</strong>
                <em>Follow @Seeker_Tracker</em>
              </span>
              <span className={styles.chev} aria-hidden>
                →
              </span>
            </button>
          </div>

          <button type="button" className={styles.dismissButton} onClick={handleClose}>
            Maybe later
          </button>
        </div>
      </aside>
    </div>
  );
}
