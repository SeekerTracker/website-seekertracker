"use client"
import React, { useState } from 'react'
import styles from './footer.module.css'
import { socialMediaLinks } from './navbar';
import Image from 'next/image';
import Link from 'next/link';
const Footer = () => {
    const [copied, setCopied] = useState(false);
    const [copiedName, setCopiedName] = useState<string | null>(null);

    const copyToClipboard = () => {
        navigator.clipboard.writeText('ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS');
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
            <div className={styles.main}>
                <div className={styles.sponsorship}>
                    <span>RPC sponsored by</span>
                    <Link href={"https://helius.xyz"} target="_blank" rel="noopener noreferrer">
                        <Image src="/icons/helius.png" alt="" width={48} height={48} />
                    </Link>
                    <span>API provided by</span>
                    <Link href={"https://supalab.xyz"} target="_blank" rel="noopener noreferrer">
                        <Image src="/icons/supalabs.png" alt="" width={48} height={48} />
                    </Link>
                </div>
                <div className={styles.tokenInfo}>
                    <span>Regional Activity calculated based on the UTC timestamp of .skr SeekerID registrations</span>
                    <p>© 2025 Seeker Tracker. All rights reserved. CA:&nbsp;
                        <span className={styles.contractAddress} title="Click to copy" onClick={copyToClipboard}>
                            {copied ? <strong>Copied</strong> : 'ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS'}
                        </span></p>
                </div>


            </div>
            <div className={styles.mobileSocialIcons}>
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
                                        title={link.title}
                                    />
                                }
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                        >
                            <Image src={link.icon} alt={link.name} width={32} height={32} title={link.title} />
                        </Link>
                    );
                })}
            </div>
        </>
    )
}

export default Footer