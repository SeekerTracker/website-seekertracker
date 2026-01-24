"use client"
import React, { useState, useCallback } from 'react';
import styles from './ShareButtons.module.css';

interface ShareButtonsProps {
    url: string;
    title: string;
    text?: string;
    hashtags?: string[];
    onShare?: (method: 'native' | 'x' | 'telegram' | 'copy') => void;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({
    url,
    title,
    text,
    hashtags = [],
    onShare,
}) => {
    const [copied, setCopied] = useState(false);
    const [nativeShareError, setNativeShareError] = useState(false);

    const shareText = text || title;
    const hashtagString = hashtags.length > 0 ? hashtags.map(h => h.replace('#', '')).join(',') : '';

    const canUseNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

    const handleNativeShare = useCallback(async () => {
        if (!canUseNativeShare) {
            setNativeShareError(true);
            return;
        }

        try {
            await navigator.share({
                title,
                text: shareText,
                url,
            });
            onShare?.('native');
        } catch (err) {
            // User cancelled or share failed
            if ((err as Error).name !== 'AbortError') {
                setNativeShareError(true);
            }
        }
    }, [canUseNativeShare, title, shareText, url, onShare]);

    const handleShareX = useCallback(() => {
        const params = new URLSearchParams({
            text: shareText,
            url,
        });
        if (hashtagString) {
            params.set('hashtags', hashtagString);
        }
        window.open(
            `https://twitter.com/intent/tweet?${params.toString()}`,
            '_blank',
            'noopener,noreferrer'
        );
        onShare?.('x');
    }, [shareText, url, hashtagString, onShare]);

    const handleShareTelegram = useCallback(() => {
        const params = new URLSearchParams({
            url,
            text: shareText,
        });
        window.open(
            `https://t.me/share/url?${params.toString()}`,
            '_blank',
            'noopener,noreferrer'
        );
        onShare?.('telegram');
    }, [url, shareText, onShare]);

    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            onShare?.('copy');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [url, onShare]);

    // Show native share button on supported devices, fallback buttons otherwise
    const showNativeShare = canUseNativeShare && !nativeShareError;

    return (
        <div className={styles.shareContainer}>
            {showNativeShare ? (
                <button
                    onClick={handleNativeShare}
                    className={styles.nativeShareButton}
                    aria-label="Share"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                </button>
            ) : null}

            <div className={styles.fallbackButtons}>
                <button
                    onClick={handleShareX}
                    className={styles.xButton}
                    aria-label="Share on X"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className={styles.buttonText}>X</span>
                </button>

                <button
                    onClick={handleShareTelegram}
                    className={styles.telegramButton}
                    aria-label="Share on Telegram"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    <span className={styles.buttonText}>Telegram</span>
                </button>

                <button
                    onClick={handleCopyLink}
                    className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                    aria-label="Copy link"
                >
                    {copied ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    )}
                    <span className={styles.buttonText}>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
            </div>
        </div>
    );
};

export default ShareButtons;
