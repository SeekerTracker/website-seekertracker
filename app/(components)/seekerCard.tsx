"use client"
import React, { useEffect, useState } from 'react'
import styles from './seekerCard.module.css'
import { DomainInfo } from 'app/(utils)/constantTypes'
import Link from 'next/link'

const SeekerCard = ({ domainInfo, showRank }: { domainInfo: DomainInfo, showRank: boolean }) => {
    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if user clicked a link inside the card
        const target = e.target as HTMLElement
        if (target.closest('a')) return

        // External SeekerID profile on MySeeker
        const base = domainInfo.subdomain
        window.open(
            `https://myseeker.id/${encodeURIComponent(base)}`,
            '_blank',
            'noopener,noreferrer'
        )
    }

    return (
        <div
            className={styles.seekerCard}
            key={`${domainInfo.name_account} ${domainInfo.created_at}`}
            onClick={handleCardClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick(e as unknown as React.MouseEvent)
                }
            }}
            role="link"
            tabIndex={0}
            aria-label={`${domainInfo.subdomain}${domainInfo.domain}`}
        >
            <div className={styles.tagCont}>
                {isNew(domainInfo.created_at) && <span className={styles.nameTag}>New</span>}
                {showRank && <span className={styles.rankTag}>#{domainInfo.rank}</span>}
            </div>
            <span className={styles.domainName}>
                {domainInfo.subdomain}{domainInfo.domain}
            </span>
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
                        href={`https://sol.new/address/${domainInfo.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span>
                            {domainInfo.owner?.slice(0, 5)}...{domainInfo.owner?.slice(-5)}
                        </span>
                    </Link>
                </div>
                <div className={styles.eachInfo}>
                    <span>Transaction</span>
                    <Link
                        href={`https://solscan.io/tx/${domainInfo.subdomain_tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span>
                            {domainInfo.subdomain_tx?.slice(0, 5)}...
                            {domainInfo.subdomain_tx?.slice(-5)}
                        </span>
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
                setDisplay(`${secondsPast}s ago`);
            } else if (secondsPast < 3600) {
                setDisplay(`${Math.floor(secondsPast / 60)}m ago`);
            } else if (secondsPast < 86400) {
                setDisplay(`${Math.floor(secondsPast / 3600)}h ago`);
            } else if (secondsPast < 2592000) {
                setDisplay(`${Math.floor(secondsPast / 86400)}d ago`);
            } else if (secondsPast < 31536000) {
                setDisplay(`${Math.floor(secondsPast / 2592000)}mo ago`);
            } else {
                setDisplay(`${Math.floor(secondsPast / 31536000)}y ago`);
            }
        };

        update();
        const id = setInterval(update, 30_000);
        return () => clearInterval(id);
    }, [time]);

    return <>{display}</>;
};

function isNew(created_at: string) {
    if (!created_at) return false;
    const t = new Date(created_at).getTime();
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < 24 * 60 * 60 * 1000;
}
