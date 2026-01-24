"use client"
import React, { useEffect, useState } from 'react'
import styles from './userDomain.module.css'
import { getOnchainDomainData } from 'app/(utils)/onchainData';
import { DomainInfo } from 'app/(utils)/constantTypes';
import Link from 'next/link';
import Image from 'next/image';
import { TimeAgo } from 'app/(components)/seekerCard';
import { notFound } from 'next/navigation';
import { getPortfolio, formatUsd, formatBalance, PortfolioData } from 'app/(utils)/lib/portfolio';
import { analytics } from 'app/(utils)/lib/analytics';
import Backbutton from 'app/(components)/shared/Backbutton';
import ShareButtons from 'app/(components)/shared/ShareButtons';


const UserDomain = ({ userDomain }: { userDomain: string }) => {
    const [domainData, setDomainData] = useState<DomainInfo | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [showAllTokens, setShowAllTokens] = useState(false);


    const splitted = userDomain.split('.');
    const subdomain = splitted[0]
    const domain = "." + splitted[1];

    const [copyImageSuccess, setCopyImageSuccess] = useState('');
    const [copyImageLinkSuccess, setCopyImageLinkSuccess] = useState('');
    const [copyDomainLinkSuccess, setCopyDomainLinkSuccess] = useState('');

    useEffect(() => {
        analytics.domainView(userDomain);
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

    // Fetch portfolio when domain data is available
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
        analytics.domainShare(userDomain, 'copy');
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
            <Backbutton />

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

                <Link href={`/skr?q=${userDomain}`} className={styles.skrButton}>
                    Check SKR Allocation
                </Link>
            </div>

            {/* Portfolio Section */}
            <div className={styles.portfolioSection}>
                <span className={styles.title}>💰 Portfolio</span>
                {portfolioLoading ? (
                    <div className={styles.portfolioLoading}>Loading portfolio...</div>
                ) : portfolio ? (
                    <div className={styles.portfolioContent}>
                        <div className={styles.portfolioTotal}>
                            <span className={styles.totalLabel}>Total Value</span>
                            <span className={styles.totalValue}>{formatUsd(portfolio.totalUsdValue)}</span>
                        </div>

                        <div className={styles.portfolioBreakdown}>
                            {/* SOL Balance */}
                            <div className={styles.tokenRow}>
                                <div className={styles.tokenInfo}>
                                    <img
                                        src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                                        alt="SOL"
                                        className={styles.tokenLogo}
                                    />
                                    <div className={styles.tokenDetails}>
                                        <span className={styles.tokenSymbol}>SOL</span>
                                        <span className={styles.tokenBalance}>{formatBalance(portfolio.solBalance)}</span>
                                    </div>
                                </div>
                                <span className={styles.tokenValue}>{formatUsd(portfolio.solUsdValue)}</span>
                            </div>

                            {/* Token Holdings */}
                            {portfolio.tokens.slice(0, showAllTokens ? undefined : 5).map((token) => (
                                <div key={token.mint} className={styles.tokenRow}>
                                    <div className={styles.tokenInfo}>
                                        {token.logoURI ? (
                                            <img
                                                src={token.logoURI}
                                                alt={token.symbol}
                                                className={styles.tokenLogo}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/token-placeholder.png';
                                                }}
                                            />
                                        ) : (
                                            <div className={styles.tokenLogoPlaceholder}>
                                                {token.symbol.slice(0, 2)}
                                            </div>
                                        )}
                                        <div className={styles.tokenDetails}>
                                            <span className={styles.tokenSymbol}>{token.symbol}</span>
                                            <span className={styles.tokenBalance}>{formatBalance(token.balance)}</span>
                                        </div>
                                    </div>
                                    <span className={styles.tokenValue}>{formatUsd(token.usdValue)}</span>
                                </div>
                            ))}

                            {portfolio.tokens.length > 5 && (
                                <button
                                    className={styles.showMoreButton}
                                    onClick={() => setShowAllTokens(!showAllTokens)}
                                >
                                    {showAllTokens ? 'Show Less' : `Show ${portfolio.tokens.length - 5} More`}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.portfolioEmpty}>No portfolio data available</div>
                )}
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
                    </div>

                    <ShareButtons
                        url={`https://seekertracker.com/id/${userDomain}`}
                        title={`${userDomain} - SeekerID Profile`}
                        text={`Check out ${userDomain} on @Seeker_Tracker`}
                        onShare={(method) => analytics.domainShare(userDomain, method === 'x' ? 'tweet' : method)}
                    />

                    <div className={styles.instructions}>
                        <span>1. Copy image above</span>
                        <span>2. Share via your preferred platform</span>
                        <span>3. Paste image in your post</span>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default UserDomain
