import Link from "next/link";
import React from "react";
import Backbutton from "./(components)/shared/Backbutton";
import styles from "./not-found.module.css";

const Custom404 = () => {
    return (
        <div className={styles.container}>
            <Backbutton />

            <div className={styles.card}>
                <div className={styles.badge}>
                    <span className={styles.badgeIcon}>?</span>
                    <span>Not Found</span>
                </div>

                <h1 className={styles.domain}>404.skr</h1>
                <p className={styles.subtitle}>SeekerID Profile</p>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>Lost</span>
                        <span className={styles.statLabel}>Status</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>???</span>
                        <span className={styles.statLabel}>Location</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>0</span>
                        <span className={styles.statLabel}>Results</span>
                    </div>
                </div>

                <p className={styles.message}>
                    This page got lost in the Solana blockchain.
                </p>

                <Link href="/" className={styles.homeButton}>
                    Search for a real .skr
                </Link>
            </div>
        </div>
    );
};

export default Custom404;
