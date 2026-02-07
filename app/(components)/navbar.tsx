"use client";
import React, { useState, useEffect } from "react";
import styles from "./navbar.module.css";
import { useDataContext } from "app/(utils)/context/dataProvider";
import { useJupiter } from "app/(utils)/context/jupiterProvider";
import Image from "next/image";
import Link from "next/link";
import { SEEKER_TOKEN_ADDRESS } from "app/(utils)/constant";

export const socialMediaLinks = [
    {
        name: "GetApp",
        title: "Download Mobile App",
        url: "/getdapp",
        icon: "/sds-badge.svg",
        clickToCopy: false,
        internal: true,
    },
    {
        name: "Bags",
        title: "Bags Token Analytics",
        url: `https://bags.fm/${SEEKER_TOKEN_ADDRESS}`,
        icon: "/icons/bags-icon.png",
        clickToCopy: false,
    },
    {
        name: "Token",
        title: "Copy Token Address",
        url: "https://example.com/ref/abc123",
        icon: "/icons/token.png",
        clickToCopy: true,
    },
    {
        name: "RugCheck",
        title: "RugCheck",
        url: `https://rugcheck.xyz/tokens/${SEEKER_TOKEN_ADDRESS}`,
        icon: "/icons/rugcheck.png"
    },
    {
        name: "DexScreener",
        title: "DexScreener",
        url: `https://dexscreener.com/solana/${SEEKER_TOKEN_ADDRESS}`,
        icon: "/icons/dexscreener.png",
    },
    {
        name: "Telegram",
        title: "Official Telegram Channel",
        url: "https://t.me/seeker_tracker",
        icon: "/icons/tg.png",
    },
    {
        name: "Twitter",
        title: "Official Twitter Channel",
        url: "https://x.com/Seeker_Tracker",
        icon: "/icons/x.png",
    }
];

const Navbar = () => {
    const { solPrice, backendHealth, backendWS, seekerData } = useDataContext();
    const { openJupiter, isJupiterReady } = useJupiter();
    const [copiedName, setCopiedName] = useState<string | null>(null);
    const [skrPrice, setSkrPrice] = useState<number | null>(null);

    // Fetch SKR price
    useEffect(() => {
        const fetchSkrPrice = async () => {
            try {
                const response = await fetch("/api/skr/vault");
                if (response.ok) {
                    const data = await response.json();
                    setSkrPrice(data.skrPrice);
                }
            } catch (err) {
                console.error("Failed to fetch SKR price:", err);
            }
        };
        fetchSkrPrice();
        // Refresh every 5 minutes
        const interval = setInterval(fetchSkrPrice, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = async (name: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedName(name); // 🟢 only this item will show tick
            setTimeout(() => setCopiedName(null), 15090);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    return (
        <div className={styles.main}>
            <div className={styles.priceInfo}>
                <Link
                    href="https://jup.ag/tokens/So11111111111111111111111111111111111111112?ref=yfgv2ibxy07v"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.priceLink}
                >
                    <span>
                        SOL <strong>${solPrice.toFixed(2)}</strong>
                    </span>
                </Link>
                {skrPrice !== null && (
                    <Link
                        href="https://jup.ag/tokens/SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3?ref=yfgv2ibxy07v"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.priceLink}
                    >
                        <span>
                            SKR <strong>${skrPrice.toFixed(6)}</strong>
                        </span>
                    </Link>
                )}
                <Link
                    href={`https://jup.ag/tokens/${SEEKER_TOKEN_ADDRESS}?ref=yfgv2ibxy07v`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.priceLink}
                >
                    <span>
                        $TRACKER 24h <strong>${seekerData.token24hVol}</strong>
                    </span>
                </Link>
            </div>

            <div className={styles.navButtons}>
                <Link href="/skr" className={styles.skrButton}>
                    SKR
                </Link>
                <Link href="/sweep" className={styles.sweepButton}>
                    Sweep
                </Link>
                <Link href="/competitors" className={styles.competitorsButton}>
                    Competitors
                </Link>
<Link href="/snake" className={styles.snakeButton}>
                    Snake
                </Link>
                <Link href="/apps" className={styles.appsButton}>
                    Apps
                </Link>
                <a
                    href="https://stake.seekertracker.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.stakeButton}
                >
                    Stake
                </a>
                <button
                    className={styles.buyButton}
                    onClick={openJupiter}
                    disabled={!isJupiterReady}
                    title="Buy $TRACKER"
                >
                    Buy $TRACKER
                </button>
            </div>

            <div className={styles.socialMediaTab}>
                <div
                    className={`${styles.liveButton} ${backendWS ? styles.live : styles.offline}`}
                    title={backendHealth ? "Backend Healthy" : "Backend Down"}
                >
                    <div
                        className={styles.dot}
                    />

                    <span>{backendWS ? "Live" : "Offline"}</span>
                </div>

                <div className={styles.socialLinks}>
                    {socialMediaLinks.map((link) => {
                        const isCopied = copiedName === link.name;

                        if (link.clickToCopy) {
                            return (
                                <div
                                    key={link.name}
                                    className={styles.socialLink}
                                    onClick={() => handleCopy(link.name, link.url)}
                                    role="button"
                                    title={isCopied ? "Copied!" : "Click to copy"}
                                >
                                    {isCopied ? (
                                        <div className={styles.checkIcon}>✓</div>
                                    ) :
                                        <Image
                                            src={isCopied ? "/icons/check.svg" : link.icon}
                                            alt={link.name}
                                            width={32}
                                            height={32}
                                        />
                                    }
                                    <span className={styles.hoverName}>{link.title}</span>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={link.name}
                                className={styles.socialLink}
                            >
                                <Link
                                    key={link.name}
                                    href={link.url}
                                    {...(link.internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                                >
                                    <Image src={link.icon} alt={link.name} width={32} height={32} />
                                    <span className={styles.hoverName}>{link.title}</span>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
