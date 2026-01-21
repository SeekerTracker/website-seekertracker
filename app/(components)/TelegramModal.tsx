"use client";

import React, { useState, useEffect } from "react";
import styles from "./TelegramModal.module.css";
import Link from "next/link";
import { analytics } from "app/(utils)/lib/analytics";

const STORAGE_KEY = "seekertracker_telegram_modal_dismissed";

export default function TelegramModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        analytics.telegramDismiss();
    };

    const handleJoin = () => {
        analytics.telegramJoin();
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modal}>
            <button className={styles.closeButton} onClick={handleClose}>
                ×
            </button>
            <div className={styles.content}>
                <h2>📡 Live Updates & Alpha</h2>
                <p>
                    Join our Telegram channel for real-time alerts and alpha.
                </p>
                <Link
                    href="https://t.me/seeker_tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleJoin}
                >
                    <button className={styles.joinButton}>
                        Join Channel
                    </button>
                </Link>
                <button className={styles.dismissButton} onClick={handleClose}>
                    Dismiss
                </button>
            </div>
        </div>
    );
}
