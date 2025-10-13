"use client"
import React, { useEffect, useState } from 'react'
import styles from './seekerCard.module.css'
import { DomainInfo } from 'app/(utils)/constantTypes'
import Link from 'next/link'

const SeekerCard = ({ domainInfo }: { domainInfo: DomainInfo }) => {
    return (
        <div className={styles.seekerCard} key={`${domainInfo.name_account} ${domainInfo.created_at}`}>
            <div className={styles.seekerAnimation} />
            {isNew(domainInfo.created_at) && <span className={styles.nameTag}>New</span>}
            <span className={styles.domainName}>{domainInfo.subdomain}{domainInfo.domain}</span>
            <div className={styles.domainInfo}>
                <div className={styles.eachInfo}>
                    <span>Activated</span>
                    <span>
                        {new Date(domainInfo.created_at).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                        })}
                    </span>
                </div>
                <div className={styles.eachInfo}>
                    <span>Length</span>
                    <span>{domainInfo?.subdomain?.length}&nbsp;chars</span>
                </div>
                <div className={styles.eachInfo}>
                    <span>Owner</span>
                    <Link
                        href={`https://solscan.io/account/${domainInfo.owner}`}
                        target='_blank'
                    >
                        <span>{domainInfo.owner.slice(0, 5)}...{domainInfo.owner.slice(-5)}</span>
                    </Link>
                </div>
                <div className={styles.eachInfo}>
                    <span>Transaction</span>
                    <Link
                        href={`https://solscan.io/tx/${domainInfo.subdomain_tx}`}
                        target='_blank'
                    >
                        <span>{domainInfo.subdomain_tx.slice(0, 5)}...{domainInfo.subdomain_tx.slice(-5)}</span>
                    </Link>
                </div>
                <div className={styles.eachInfo}>
                    <span>Time Ago</span>
                    <span><TimeAgo time={domainInfo.created_at} /></span>
                </div>
            </div>
        </div>
    )
}

export default SeekerCard


export const TimeAgo = ({ time }: { time: string }) => {
    const [display, setDisplay] = useState("...");

    useEffect(() => {
        if (!time) return;

        const update = () => {
            const timeStamp = new Date(time).getTime();
            const now = Date.now();
            const secondsPast = Math.floor((now - timeStamp) / 1000);

            if (secondsPast < 60) {
                setDisplay(`${secondsPast}s`);
            } else if (secondsPast < 3600) {
                const minutes = Math.floor(secondsPast / 60);
                setDisplay(`${minutes}m`);
            } else if (secondsPast < 86400) {
                const hours = Math.floor(secondsPast / 3600);
                setDisplay(`${hours}h`);
            } else {
                const days = Math.floor(secondsPast / 86400);
                setDisplay(`${days}d`);
            }
        };

        update(); // initial render

        // ⏱ update more frequently at first, then slow down
        const secondsPast = Math.floor((Date.now() - new Date(time).getTime()) / 1000);
        const interval = secondsPast < 60 ? 1000 : 60_000;

        const timer = setInterval(update, interval);
        return () => clearInterval(timer);
    }, [time]);

    return <span>{display}</span>;
};

function isNew(createdAt: string | Date, minutes = 9): boolean {
    return (Date.now() - new Date(createdAt).getTime()) / 60000 <= minutes;
}
