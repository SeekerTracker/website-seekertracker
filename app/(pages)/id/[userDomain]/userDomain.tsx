"use client"
import React, { useEffect, useState } from 'react'
import styles from './userDomain.module.css'
import { getOnchainDomainData } from 'app/(utils)/onchainData';
import { DomainInfo } from 'app/(utils)/constantTypes';
import Link from 'next/link';
import Image from 'next/image';
import { TimeAgo } from 'app/(components)/seekerCard';
import { notFound } from 'next/navigation';


const UserDomain = ({ userDomain }: { userDomain: string }) => {
    const [domainData, setDomainData] = useState<DomainInfo | null>(null);
    const [loaded, setLoaded] = useState(false);


    const splitted = userDomain.split('.');
    const subdomain = splitted[0]
    const domain = "." + splitted[1];

    const [copyImageSuccess, setCopyImageSuccess] = useState('');
    const [copyImageLinkSuccess, setCopyImageLinkSuccess] = useState('');
    const [copyDomainLinkSuccess, setCopyDomainLinkSuccess] = useState('');

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
        return notFound();
    }
    if (!loaded) {
        return <div className={styles.main}>Loading...</div>;
    }
    if (!domainData) {
        return notFound();
    }

    const host = document.location.host;
    const protocol =
        document.location.protocol || 'https';
    const webDomain = `${protocol}//${host}`;

    const imageLink = `${webDomain}/image/${subdomain}?age=true`;

    const copyToClipboard = async (type: 'imageLink' | 'DomainLink' | 'image') => {
        if (type === 'image') {
            try {
                const imageBlob = await fetch(imageLink).then(res => res.blob());
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [imageBlob.type]: imageBlob
                    })
                ]);
                setCopyImageSuccess('Image copied to clipboard!');
                setTimeout(() => setCopyImageSuccess(''), 2000);
            } catch (error) {
                console.error('Error copying image:', error);
            }
        }
        if (type === 'imageLink') {
            try {
                await navigator.clipboard.writeText(imageLink);
                setCopyImageLinkSuccess('Image link copied to clipboard!');
                setTimeout(() => setCopyImageLinkSuccess(''), 2000);
            } catch (err) {
                setCopyImageLinkSuccess('Failed to copy image link.');
                setTimeout(() => setCopyImageLinkSuccess(''), 2000);
                console.error('Error copying image link:', err);
            }
        }
        if (type === 'DomainLink') {
            try {
                await navigator.clipboard.writeText(webDomain + '/id/' + userDomain);
                setCopyDomainLinkSuccess('Domain link copied to clipboard!');
                setTimeout(() => setCopyDomainLinkSuccess(''), 2000);
            }
            catch (err) {
                setCopyDomainLinkSuccess('Failed to copy domain link.');
                setTimeout(() => setCopyDomainLinkSuccess(''), 2000);
                console.error('Error copying domain link:', err);
            }
        }
    };



    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href={"/"}>
                    ← Back to Tracker
                </Link>
            </div>

            <button className={styles.copyButton} onClick={() => copyToClipboard('DomainLink')}>{copyDomainLinkSuccess ? '✅ Copied!' : 'Copy Link'}</button>
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
                        <span className={styles.detailTitle}>Age:</span>
                        <span className={styles.detailValue}>
                            <TimeAgo time={domainData.created_at} />
                        </span>
                    </div>
                    <hr />
                    <div className={styles.eachDetail}>
                        <span className={styles.detailTitle}>Transaction:</span>
                        <Link
                            href={`https://solscan.io/tx/${domainData.subdomain_tx}`}
                            target='_blank'
                        >
                            <span className={styles.detailValue}>
                                {domainData.subdomain_tx?.slice(0, 5)}...{domainData.subdomain_tx?.slice(-5)}
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
            <div className={styles.nameCardCont}>
                <span className={styles.title}>🖼 Share Image</span>
                <div className={styles.nameImage}>
                    <Image
                        src={`/image/${subdomain}?age=true`}
                        alt="" width={400}
                        height={400}
                        unoptimized // ✅ disables Next.js image cache
                        onClick={() => copyToClipboard('image')}
                    />
                </div>
                <div className={styles.copyImage}>
                    <span style={{
                        color: copyImageSuccess ? "#00ffd9" : "#A0A0A0"
                    }}>{copyImageSuccess ? '✅ Image copied to clipboard!' : 'Click the image to copy it'}</span>

                    <div className={styles.manualCopy}>
                        <span className={styles.showLink} onClick={() => copyToClipboard('imageLink')}>{imageLink}</span>
                        <button className={styles.copyButton} onClick={() => copyToClipboard('imageLink')}>{copyImageLinkSuccess ? '✅ Copied!' : 'Copy Image URL'}</button>
                        <Link href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Check out ${userDomain} on @Seeker_Tracker 🔥 `)}`} target='_blank' rel="noopener noreferrer">
                            <button className={styles.tweetButton}>Tweet</button>
                        </Link>
                    </div>

                    <div className={styles.instructions}>
                        <span>1. Copy image</span>
                        <span>2. Click Tweet button</span>
                        <span>3. Paste image</span>
                        <span>4. Tweet</span>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default UserDomain
