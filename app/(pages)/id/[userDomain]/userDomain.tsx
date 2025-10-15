"use client"
import React, { useEffect, useState } from 'react'
import styles from './userDomain.module.css'
import { getOnchainDomainData } from 'app/(utils)/onchainData';
import { DomainInfo } from 'app/(utils)/constantTypes';
import Link from 'next/link';


const UserDomain = ({ userDomain }: { userDomain: string }) => {
    const [domainData, setDomainData] = useState<DomainInfo | null>(null);
    const [loaded, setLoaded] = useState(false);


    const splitted = userDomain.split('.');
    const subdomain = splitted[0]
    const domain = "." + splitted[1];

    useEffect(() => {
        const fetchDomainData = async () => {
            try {
                const fetchedData = await getOnchainDomainData(domain, subdomain)
                if (fetchedData) {
                    setDomainData(fetchedData);
                }
                console.log('Fetched domain data:', fetchedData);
            } catch (error) {
                console.error('Error fetching domain data:', error);
            } finally {
                setLoaded(true);
            }
        };
        fetchDomainData();
    }, [domain, subdomain, userDomain]);


    if (loaded && !domainData) {
        return <div className={styles.main}>Error loading domain data.</div>;
    }
    if (!loaded) {
        return <div className={styles.main}>Loading...</div>;
    }
    if (!domainData) {
        return <div className={styles.main}>No domain data found.</div>;
    }

    return (
        <div className={styles.main}>
            <div className={styles.activatedName}>
                <span className={styles.domain}>{userDomain}</span>
                <span>Seeker Profile</span>
                <span className={styles.badge}>✅ Activated</span>
            </div>

            <div className={styles.activationDetails}>
                <span className={styles.title}>📋 Activation Details</span>
                <div className={styles.Details}>
                    <div className={styles.eachDetail}>
                        <span className={styles.detailTitle}>Domain:</span>
                        <span className={styles.detailValue}>{userDomain}</span>
                    </div>
                    <hr />
                    <div className={styles.eachDetail}>
                        <span className={styles.detailTitle}>Length:</span>
                        <span className={styles.detailValue}>{subdomain.length}&nbsp;Characters</span>
                    </div>
                    <hr />
                    <div className={styles.eachDetail}>
                        <span className={styles.detailTitle}>Owner:</span>
                        <Link
                            href={`https://solscan.io/account/${domainData.owner}`}
                            target='_blank'
                        >
                            <span className={styles.detailValue}>
                                {domainData.owner?.slice(0, 5)}...{domainData.owner?.slice(-5)}
                            </span>
                        </Link>
                    </div>
                    <hr />
                    <div className={styles.eachDetail}>
                        <span className={styles.detailTitle}>Activated At:</span>
                        <span className={styles.detailValue}>
                            {new Date(domainData.created_at).toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                            })}</span>
                    </div>
                    <hr />
                    <div className={styles.eachDetail}>
                        <span className={styles.detailTitle}>Transaction:</span>
                        <Link
                            href={`https://solscan.io/tx/${domainData.subdomain_tx}`}
                            target='_blank'
                        >
                            <span className={styles.detailValue}>
                                {domainData.subdomain_tx.slice(0, 5)}...{domainData.subdomain_tx.slice(-5)}
                            </span>
                        </Link>
                    </div>
                    <hr />
                    <div className={styles.eachDetail}>
                        <span className={styles.detailTitle}>Domain Address:</span>
                        <Link
                            href={`https://solscan.io/account/${domainData.name_account}`}
                            target='_blank'
                        >
                            <span className={styles.detailValue}>
                                {domainData.name_account?.slice(0, 5)}...{domainData.name_account?.slice(-5)}
                            </span>
                        </Link>
                    </div>
                    <hr />

                </div>
            </div>
        </div>
    )
}

export default UserDomain