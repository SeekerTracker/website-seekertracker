"use client";

import React, { useState } from "react";
import { useConnector, useAccount } from "@solana/connector/react";
import { useTransactionSigner } from "@solana/connector";
import { useWalletContext } from "../../(utils)/context/walletProvider";
import { signVerificationTransaction } from "../../(utils)/lib/walletSigning";
import WalletButton from "../../(components)/wallet/WalletButton";
import TokenGate from "../../(components)/wallet/TokenGate";
import Link from "next/link";
import styles from "./page.module.css";
import { REQUIRED_TRACKER_BALANCE } from "../../(utils)/constant";

type FilterType = "all" | "before" | "first";

export default function ExportPage() {
    const { connected } = useConnector();
    const { address } = useAccount();
    const { signer, ready: signerReady } = useTransactionSigner();
    const { isEligible } = useWalletContext();

    const [filterType, setFilterType] = useState<FilterType>("all");
    const [beforeDate, setBeforeDate] = useState<string>("");
    const [firstN, setFirstN] = useState<number>(5000);
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(false);

    const handleDownload = async () => {
        if (!address || !signer || !signerReady) {
            setError("Wallet not connected");
            return;
        }

        setIsDownloading(true);
        setProgress(0);
        setError(null);

        try {
            // Sign a verification transaction (works with all wallets including Ledger)
            const { signedTransaction, message } = await signVerificationTransaction(
                signer,
                address,
                "SeekerTracker CSV Export Request"
            );

            // Build filter params
            const filterParams: Record<string, string> = { type: filterType };
            if (filterType === "before" && beforeDate) {
                filterParams.beforeTimestamp = new Date(beforeDate)
                    .getTime()
                    .toString();
            }
            if (filterType === "first" && firstN) {
                filterParams.firstN = firstN.toString();
            }

            // Request CSV from API with streaming
            const response = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: address,
                    signedTransaction,
                    message,
                    filter: filterParams,
                }),
            });

            if (!response.ok && response.headers.get("content-type")?.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Download failed");
            }

            // Read streaming response
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Failed to read response");
            }

            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // Parse progress updates from current text
                const lines = fullText.split("\n");
                for (const line of lines) {
                    if (line.startsWith("PROGRESS:")) {
                        const percent = parseInt(line.replace("PROGRESS:", ""));
                        setProgress(percent);
                    } else if (line.startsWith("ERROR:")) {
                        throw new Error(line.replace("ERROR:", ""));
                    }
                }
            }

            // Extract CSV content (after CSV_START marker)
            const csvStartIndex = fullText.indexOf("CSV_START\n");
            if (csvStartIndex === -1) {
                throw new Error("Invalid response format");
            }
            const csvContent = fullText.substring(csvStartIndex + "CSV_START\n".length);

            // Download the CSV
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `seeker-holders-${filterType}-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setProgress(100);
            setCooldown(true);
            setTimeout(() => {
                setCooldown(false);
                setProgress(0);
            }, 10000);
        } catch (err) {
            console.error("Download error:", err);
            setError((err as Error).message);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href="/">Back to Tracker</Link>
            </div>

            <div className={styles.header}>
                <h1>Export SKR List</h1>
                <p>Download CSV data of all .skr domain holders</p>
            </div>

            {connected && (
                <div className={styles.walletSection}>
                    <WalletButton />
                </div>
            )}

            <TokenGate requiredBalance={REQUIRED_TRACKER_BALANCE}>
                <div className={styles.exportSection}>
                    <h2>Download Options</h2>

                    <div className={styles.filterOptions}>
                        <label className={styles.radioOption}>
                            <input
                                type="radio"
                                name="filterType"
                                value="all"
                                checked={filterType === "all"}
                                onChange={() => setFilterType("all")}
                            />
                            <span>All Holders</span>
                            <small>Complete list of all SeekerID activations</small>
                        </label>

                        <label className={styles.radioOption}>
                            <input
                                type="radio"
                                name="filterType"
                                value="before"
                                checked={filterType === "before"}
                                onChange={() => setFilterType("before")}
                            />
                            <span>Before Date</span>
                            <small>Holders who activated before a specific date</small>
                            {filterType === "before" && (
                                <input
                                    type="datetime-local"
                                    value={beforeDate}
                                    onChange={(e) => setBeforeDate(e.target.value)}
                                    className={styles.dateInput}
                                />
                            )}
                        </label>

                        <label className={styles.radioOption}>
                            <input
                                type="radio"
                                name="filterType"
                                value="first"
                                checked={filterType === "first"}
                                onChange={() => setFilterType("first")}
                            />
                            <span>First N Holders</span>
                            <small>First N activations by rank</small>
                            {filterType === "first" && (
                                <input
                                    type="number"
                                    value={firstN}
                                    onChange={(e) =>
                                        setFirstN(parseInt(e.target.value) || 0)
                                    }
                                    min={1}
                                    max={100000}
                                    placeholder="e.g. 5000"
                                    className={styles.numberInput}
                                />
                            )}
                        </label>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        className={styles.downloadButton}
                        onClick={handleDownload}
                        disabled={isDownloading || cooldown || !isEligible}
                    >
                        {cooldown
                            ? "100% - Download starting shortly..."
                            : isDownloading
                              ? `Generating CSV... ${progress}%`
                              : "Download CSV"}
                    </button>

                    <div className={styles.csvPreview}>
                        <h3>CSV Format</h3>
                        <code>
                            activation_number, domain, owner, activation_timestamp
                        </code>
                    </div>
                </div>
            </TokenGate>
        </div>
    );
}
