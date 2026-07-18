"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import styles from './userDomain.module.css'
import { getOnchainDomainData } from 'app/(utils)/onchainData';
import { DomainInfo } from 'app/(utils)/constantTypes';
import Link from 'next/link';
import { TimeAgo } from 'app/(components)/seekerCard';
import { notFound } from 'next/navigation';
import { getPortfolio, formatUsd, formatBalance, PortfolioData } from 'app/(utils)/lib/portfolio';
import { analytics } from 'app/(utils)/lib/analytics';
import Backbutton from 'app/(components)/shared/Backbutton';
import ShareButtons from 'app/(components)/shared/ShareButtons';

const SOL_LOGO =
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";

const shortAddr = (a?: string) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : '');

// One label/value row inside a timeline card.
function DetailRow({ label, value, mono, href, extra, onCopy, copied }: {
    label: string;
    value: string;
    mono?: boolean;
    href?: string;
    extra?: React.ReactNode;
    onCopy?: () => void;
    copied?: boolean;
}) {
    const valueClass = `${styles.valText} ${mono ? styles.mono : ''}`.trim();
    return (
        <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>{label}</dt>
            <dd className={styles.detailValue}>
                {href ? (
                    <Link href={href} target="_blank" rel="noopener noreferrer" className={`${valueClass} ${styles.link}`}>
                        {value}
                    </Link>
                ) : (
                    <span className={valueClass}>{value}</span>
                )}
                {extra && <span className={styles.valExtra}>{extra}</span>}
                {onCopy && (
                    <button className={styles.miniCopy} aria-label={`Copy ${label}`} onClick={onCopy}>
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                )}
            </dd>
        </div>
    );
}

const UserDomain = ({ userDomain }: { userDomain: string }) => {
    const [domainData, setDomainData] = useState<DomainInfo | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [showAllTokens, setShowAllTokens] = useState(false);
    const [copied, setCopied] = useState<string>('');
    const passportRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
    const [tilting, setTilting] = useState(false);

    const splitted = userDomain.split('.');
    const subdomain = splitted[0];
    const domain = "." + splitted[1];

    const onPassportMove = useCallback((e: React.PointerEvent) => {
        const el = passportRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width; // 0..1
        const py = (e.clientY - rect.top) / rect.height;
        const ry = (px - 0.5) * 18; // rotateY
        const rx = (0.5 - py) * 12; // rotateX
        setTilt({
            rx,
            ry,
            glareX: px * 100,
            glareY: py * 100,
        });
        setTilting(true);
    }, []);

    const onPassportLeave = useCallback(() => {
        setTilting(false);
        setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
    }, []);

    useEffect(() => {
        analytics.domainView(userDomain);
        const fetchDomainData = async () => {
            try {
                const fetchedData = await getOnchainDomainData(domain, subdomain);
                if (fetchedData) setDomainData(fetchedData);
            } catch (error) {
                console.error('Error fetching domain data:', error);
            } finally {
                setLoaded(true);
            }
        };
        fetchDomainData();
    }, [domain, subdomain, userDomain]);

    useEffect(() => {
        if (!domainData?.owner) return;
        const fetchPortfolio = async () => {
            setPortfolioLoading(true);
            try {
                const data = await getPortfolio(domainData.owner);
                setPortfolio(data);
            } catch (error) {
                console.error('Error fetching portfolio:', error);
            } finally {
                setPortfolioLoading(false);
            }
        };
        fetchPortfolio();
    }, [domainData?.owner]);

    if (!loaded) {
        return (
            <div className={styles.main}>
                <Backbutton />
                <div className={styles.heroSkeleton} aria-busy="true" aria-label="Loading SeekerID profile" />
                <div className={styles.timelineSkeleton}>
                    <span /><span /><span />
                </div>
            </div>
        );
    }

    if (!domainData) {
        return notFound();
    }

    const host = document.location.host;
    const protocol = document.location.protocol || 'https:';
    const webDomain = `${protocol}//${host}`;
    const imageLink = `${webDomain}/image/${subdomain}?age=true`;
    const profileLink = `${webDomain}/id/${userDomain}`;

    const flash = (key: string) => {
        setCopied(key);
        setTimeout(() => setCopied(''), 1800);
    };

    const copyText = async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            flash(key);
        } catch (err) {
            console.error('Error copying text:', err);
        }
    };

    const copyImage = async () => {
        analytics.domainShare(userDomain, 'copy');
        try {
            const imageBlob = await fetch(imageLink).then((res) => res.blob());
            await navigator.clipboard.write([new ClipboardItem({ [imageBlob.type]: imageBlob })]);
            flash('image');
        } catch (error) {
            console.error('Error copying image:', error);
        }
    };

    return (
        <div className={styles.main}>
            <Backbutton />

            {/* HERO — flat OG card, live 3D tilt on hover */}
            <section className={styles.hero}>
                <div
                    ref={passportRef}
                    className={styles.passport}
                    onPointerMove={onPassportMove}
                    onPointerLeave={onPassportLeave}
                    onPointerCancel={onPassportLeave}
                >
                    <div className={styles.passportGlow} aria-hidden="true" />
                    <div
                        className={`${styles.passportStage} ${tilting ? styles.passportTilting : ''}`}
                        style={{
                            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilting ? 1.02 : 1})`,
                        }}
                        onClick={copyImage}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                copyImage();
                            }
                        }}
                        aria-label={`Copy ${userDomain} SeekerID card image`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/image/${subdomain}?age=true&raw=true`}
                            alt={`${userDomain} SeekerID passport`}
                            width={1200}
                            height={630}
                            className={styles.passportImg}
                            draggable={false}
                        />
                        <div
                            className={styles.passportGlare}
                            aria-hidden="true"
                            style={{
                                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.28) 0%, rgba(20,241,149,0.08) 28%, transparent 58%)`,
                                opacity: tilting ? 1 : 0,
                            }}
                        />
                    </div>
                    {copied === 'image' && (
                        <div className={styles.copiedOverlay} aria-live="polite">Copied</div>
                    )}
                </div>
                <div className={styles.heroActions}>
                    <button className={styles.ghostBtn} onClick={() => copyText('profile', profileLink)}>
                        {copied === 'profile' ? 'Link copied' : 'Copy profile link'}
                    </button>
                    <button className={styles.ghostBtn} onClick={copyImage}>
                        {copied === 'image' ? 'Copied' : 'Copy card image'}
                    </button>
                </div>
            </section>

            {/* TIMELINE */}
            <div className={styles.timeline}>

                {/* Activation */}
                <section className={styles.node}>
                    <span className={styles.dot} aria-hidden="true" />
                    <div className={styles.card}>
                        <header className={styles.cardHead}>
                            <h2 className={styles.cardTitle}>Activation</h2>
                            <span className={styles.badge}>Activated</span>
                        </header>
                        <dl className={styles.details}>
                            <DetailRow
                                label="Owner"
                                mono
                                value={shortAddr(domainData.owner)}
                                href={`https://solscan.io/account/${domainData.owner}`}
                                onCopy={() => copyText('owner', domainData.owner)}
                                copied={copied === 'owner'}
                            />
                            <DetailRow
                                label="Activated"
                                value={new Date(domainData.created_at).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                                extra={<TimeAgo time={domainData.created_at} />}
                            />
                            <DetailRow label="Length" value={`${subdomain.length} characters`} />
                            <DetailRow label="Transferable" value={domainData.non_transferable ? 'No · soulbound' : 'Yes'} />
                            <DetailRow
                                label="Transaction"
                                mono
                                value={shortAddr(domainData.subdomain_tx)}
                                href={`https://solscan.io/tx/${domainData.subdomain_tx}`}
                            />
                            <DetailRow
                                label="Domain address"
                                mono
                                value={shortAddr(domainData.name_account)}
                                href={`https://solscan.io/account/${domainData.name_account}`}
                            />
                        </dl>
                        <Link href={`/skr?q=${userDomain}`} className={styles.skrButton}>
                            Check SKR Allocation →
                        </Link>
                    </div>
                </section>

                {/* Portfolio */}
                <section className={styles.node}>
                    <span className={styles.dot} aria-hidden="true" />
                    <div className={styles.card}>
                        <header className={styles.cardHead}>
                            <h2 className={styles.cardTitle}>Portfolio</h2>
                            {portfolio && <span className={styles.total}>{formatUsd(portfolio.totalUsdValue)}</span>}
                        </header>
                        {portfolioLoading ? (
                            <div className={styles.portfolioLoading}>Loading portfolio…</div>
                        ) : portfolio ? (
                            <div className={styles.tokens}>
                                <div className={styles.tokenRow}>
                                    <div className={styles.tokenInfo}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={SOL_LOGO} alt="SOL" className={styles.tokenLogo} />
                                        <div className={styles.tokenMeta}>
                                            <span className={styles.tokenSymbol}>SOL</span>
                                            <span className={styles.tokenBalance}>{formatBalance(portfolio.solBalance)}</span>
                                        </div>
                                    </div>
                                    <span className={styles.tokenValue}>{formatUsd(portfolio.solUsdValue)}</span>
                                </div>

                                {portfolio.tokens.slice(0, showAllTokens ? undefined : 5).map((token) => (
                                    <div key={token.mint} className={styles.tokenRow}>
                                        <div className={styles.tokenInfo}>
                                            {token.logoURI ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={token.logoURI}
                                                    alt={token.symbol}
                                                    className={styles.tokenLogo}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/token-placeholder.png';
                                                    }}
                                                />
                                            ) : (
                                                <div className={styles.tokenLogoFallback}>{token.symbol.slice(0, 2)}</div>
                                            )}
                                            <div className={styles.tokenMeta}>
                                                <span className={styles.tokenSymbol}>{token.symbol}</span>
                                                <span className={styles.tokenBalance}>{formatBalance(token.balance)}</span>
                                            </div>
                                        </div>
                                        <span className={styles.tokenValue}>{formatUsd(token.usdValue)}</span>
                                    </div>
                                ))}

                                {portfolio.tokens.length > 5 && (
                                    <button className={styles.showMore} onClick={() => setShowAllTokens(!showAllTokens)}>
                                        {showAllTokens ? 'Show less' : `Show ${portfolio.tokens.length - 5} more`}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className={styles.empty}>No portfolio data available</div>
                        )}
                    </div>
                </section>

                {/* Share */}
                <section className={styles.node}>
                    <span className={styles.dot} aria-hidden="true" />
                    <div className={styles.card}>
                        <header className={styles.cardHead}>
                            <h2 className={styles.cardTitle}>Share</h2>
                        </header>
                        <p className={styles.shareHint}>Share this profile, or copy the passport card to post anywhere.</p>
                        <ShareButtons
                            url={profileLink}
                            title={`${userDomain} - SeekerID Profile`}
                            text={`Check out ${userDomain} on @Seeker_Tracker @solanamobile`}
                            onShare={(method) => analytics.domainShare(userDomain, method === 'x' ? 'tweet' : method)}
                        />
                        <div className={styles.copyRow}>
                            <code className={styles.copyText}>{imageLink}</code>
                            <button className={styles.copyBtn} onClick={() => copyText('imglink', imageLink)}>
                                {copied === 'imglink' ? 'Copied' : 'Copy image URL'}
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default UserDomain
