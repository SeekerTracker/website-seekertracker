"use client"

import React from 'react'
import styles from './page.module.css'
import Link from 'next/link'

const Apps = () => {
    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href={"/"}>
                    ← Back to Tracker
                </Link>
            </div>
            <div className={styles.comingSoon}>
                <span className={styles.icon}>🚀</span>
                <span className={styles.header}>Coming Soon</span>
                <span className={styles.desc}>Our favourite apps and tools will be listed here</span>
            </div>
        </div>
    )
}

export default Apps
