"use client"
import React, { useState } from 'react'
import styles from './footer.module.css'
import { socialMediaLinks } from './navbar';
import Image from 'next/image';
import Link from 'next/link';
import { SEEKER_TOKEN_ADDRESS } from 'app/(utils)/constant';
import { IoCopy } from 'react-icons/io5';
const Footer = () => {
    const [copied, setCopied] = useState(false);
    const [copiedName, setCopiedName] = useState<string | null>(null);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(SEEKER_TOKEN_ADDRESS);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }

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
        <>
            <div className={styles.downloadSection}>
                <div className={styles.downloadContent}>
                    <h2>Download Mobile App</h2>
                    <p>Get the Seeker Tracker Android application</p>
                    <Link href="/seekertracker.apk" download className={styles.downloadBadge}>
                        <Image
                            src="/sds-badge.svg"
                            alt="Get it on Solana dApp Store"
                            width={232}
                            height={91}
                        />
                    </Link>
                </div>
            </div>
            <div className={styles.main}>
                <div className={styles.sponsorship}>
                    <div className={styles.sponsor}>
                        <span>Launched on</span>
                        <Link href="https://bags.fm/$SEEKER_TRACKER" target="_blank">
                            <Image src="/icons/bags-icon.png" alt="" width={48} height={48} />
                        </Link>
                    </div>

                    <div className={styles.sponsor}>
                        <span>RPC sponsored by</span>
                        <Link href="https://helius.xyz" target="_blank">
                            <Image src="/icons/helius.png" alt="" width={48} height={48} />
                        </Link>
                    </div>

                    <div className={styles.sponsor}>
                        <span>API provided by</span>
                        <Link href="https://supalab.xyz" target="_blank">
                            <Image src="/icons/supalabs.png" alt="" width={48} height={48} />
                        </Link>
                    </div>

                    <div className={styles.sponsor}>
                        <span>Domain Managed by</span>
                        <Link href="https://alldomains.id/?ref=hmKOC9" target="_blank">
                            <Image src="/icons/alldomain.webp" alt="" width={48} height={48} />
                        </Link>
                    </div>
                </div>
                <div className={styles.tokenInfo}>
                    <span>Regional Activity calculated based on the UTC timestamp of .skr SeekerID registrations</span>
                    <p>© 2025 Seeker Tracker. All rights reserved. CA:&nbsp;
                        <span className={styles.contractAddress} title="Click to copy" onClick={copyToClipboard}>
                            {copied ? <strong>Copied</strong> : SEEKER_TOKEN_ADDRESS}
                        </span></p>
                    <div className={styles.legalLinks}>
                        <Link href="/whitepaper">Whitepaper</Link>
                        <span>•</span>
                        <Link href="/privacy">Privacy</Link>
                        <span>•</span>
                        <Link href="/license">License</Link>
                        <span>•</span>
                        <Link href="/copyright">Copyright</Link>
                        <span>•</span>
                        <Link href="/getdapp">Get App</Link>
                    </div>
                </div>
            </div>
            <div className={styles.mobileSocialIcons}>
                {socialMediaLinks.map((link: any) => {
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
                                ) : link.isReactIcon ? (
                                    <IoCopy size={32} title={link.title} />
                                ) : (
                                    <Image
                                        src={link.icon}
                                        alt={link.name}
                                        width={32}
                                        height={32}
                                        title={link.title}
                                    />
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={link.name}
                            href={link.url}
                            {...(link.internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                            className={styles.socialLink}
                            title={link.title}
                        >
                            {link.isReactIcon ? (
                                <IoCopy size={32} />
                            ) : (
                                <Image src={link.icon} alt={link.name} width={32} height={32} />
                            )}
                        </Link>
                    );
                })}
            </div>
        </>
    )
}

export default Footer