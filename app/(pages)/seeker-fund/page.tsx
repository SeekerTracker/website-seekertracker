"use client"

import React, { useState } from 'react'
import styles from './page.module.css'
import Link from 'next/link'
import Image from 'next/image'
import { SEEKER_TOKEN_ADDRESS } from 'app/(utils)/constant'
import { useDataContext } from 'app/(utils)/context/dataProvider'
const Index = () => {
    const [isCopied, setIsCopied] = useState(false);
    const { solPrice, seekerData } = useDataContext();

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(SEEKER_TOKEN_ADDRESS);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
        catch (err) {
            console.error('Error copying domain link:', err);
        }
    };



    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href={"/"}>
                    ← Back to Tracker
                </Link>
            </div>
            <div className={styles.topBar}>
                <span className={styles.header}>
                    <Image src="/icons/bags-icon.png" alt="Bags" width={36} height={36} />
                    &nbsp;Seeker Fund</span>
                <span className={styles.tokenDesc}>SeekerTracker Token Analytics & Fee Tracking</span>
                <span className={styles.tokenAddress} onClick={copyToClipboard}>{isCopied ? "✅ Copied!!" : SEEKER_TOKEN_ADDRESS}</span>
            </div>
            <div className={styles.tokenStats}>
                <div className={styles.eachStat}>
                    <span className={styles.number}>{seekerData.lifeTimeSolFees}&nbsp;SOL</span>
                    <span className={styles.label}>Lifetime Fees</span>
                    <span className={styles.desc}>Total SOL earned from token trading</span>
                </div>

                <div className={styles.eachStat}>
                    <span className={styles.number}>${(seekerData.lifeTimeSolFees * solPrice).toFixed(2)}</span>
                    <span className={styles.label}>Fund Value (USD)</span>
                    <span className={styles.desc}>Real-time USD value of fees</span>
                </div>

                <div className={styles.eachStat}>
                    <span className={styles.number}>${solPrice}</span>
                    <span className={styles.label}>Current SOL Price</span>
                    <span className={styles.desc}>Live price via paid Helius RPC + Jupiter API</span>
                </div>

                <div className={styles.eachStat}>
                    <span className={styles.number}>{seekerData.fundBalance.toFixed(2)}&nbsp;SOL</span>
                    <span className={styles.label}>Current Fund Balance</span>
                    <span className={styles.desc}>Real-time balance via paid Helius RPC</span>
                </div>

                <div className={styles.eachStat}>
                    <span className={styles.number}>15</span>
                    <span className={styles.label}>
                        <Image src="/icons/seeker.png" alt="Seeker" width={24} height={24} />
                        Seekers Earned
                    </span>
                    <span className={styles.desc}>Seeker phones earned at $500 each</span>
                </div>
            </div>
            <div className={styles.creatorInfo}>
                <div className={styles.creatorCard}>
                    <span className={styles.title}>👤 Token Creator</span>
                    <div className={styles.cardInfo}>
                        <div className={styles.eachInfo}>
                            <div className={styles.creatorTwitter}>
                                <img src={`https://pbs.twimg.com/profile_images/1917530332145807360/LgkIGAjO.jpg`} alt="Creator Twitter" width={36} height={36} />
                                <Link href={`https://twitter.com/metasal`} target="_blank" rel="noopener noreferrer">@metasal</Link>
                            </div>
                            <span>0.0% fees</span>
                        </div>
                        <hr />
                        <div className={styles.eachInfo}>
                            <span className={styles.label}>Wallet:</span>
                            <Link href={`https://solscan.io/account/J9uACn4XkunF2V4DTE3T3p2PQ6qJxkvxmR4rfdzwQLoG`} target="_blank" rel="noopener noreferrer">
                                <span>J9uA...QLoG</span>
                            </Link>
                        </div>
                        <hr />
                        <div className={styles.eachInfo}>
                            <span className={styles.label}>Role:</span>
                            <span>Token Creator</span>
                        </div>
                    </div>
                </div>

                <div className={styles.creatorCard}>
                    <span className={styles.title}>🤝 Fee Share Users</span>
                    <div className={styles.cardInfo}>
                        <div className={styles.eachInfo}>
                            <div className={styles.creatorTwitter}>
                                <img src={`https://pbs.twimg.com/profile_images/1967433760754073600/Pi-_RDre.jpg`} alt="Fee Share User Twitter" width={36} height={36} />
                                <Link href={`https://twitter.com/Seeker_Tracker`} target="_blank" rel="noopener noreferrer">@Seeker_Tracker</Link>
                            </div>
                            <span>100.00%</span>
                        </div>
                    </div>
                </div>

                <div className={styles.creatorCard}>
                    <span className={styles.title}>📊 Token Information</span>
                    <div className={styles.cardInfo}>
                        <div className={styles.eachInfo}>
                            <span className={styles.label}>Token Address:</span>
                            <Link href={`https://solscan.io/account/${SEEKER_TOKEN_ADDRESS}`} target="_blank" rel="noopener noreferrer">
                                <span>ehip...2FGS</span>
                            </Link>
                        </div>
                        <hr />
                        <div className={styles.eachInfo}>
                            <span className={styles.label}>Platform:</span>
                            <span>Bags.fm</span>
                        </div>
                        <hr />
                        <div className={styles.eachInfo}>
                            <span className={styles.label}>View on Bags:</span>
                            <Link href={`https://bags.fm/${SEEKER_TOKEN_ADDRESS}`} target="_blank" rel="noopener noreferrer">
                                <span>open -&gt;</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Index