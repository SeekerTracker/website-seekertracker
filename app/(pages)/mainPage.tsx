"use client";
import React, { Activity, useCallback, useEffect, useRef, useState } from 'react'
import style from './mainPage.module.css'
import Image from 'next/image'
import { useDataContext } from 'app/(utils)/context/dataProvider'
import { DomainInfo } from 'app/(utils)/constantTypes'
import SeekerCard from 'app/(components)/seekerCard'
import Link from 'next/link';
import TelegramModal from 'app/(components)/TelegramModal';
import PixelSnake from 'app/(components)/PixelSnake';
import { analytics } from 'app/(utils)/lib/analytics';
import { fetchDomains } from 'app/(utils)/lib/fetchDomains';
import { IoArrowDownOutline } from 'react-icons/io5';


/** Counts up from ~95% of target to target over ~1.2s */
function useCountUp(target: number, duration = 1200): number {
    const [display, setDisplay] = useState(target);
    const rafRef = useRef<number | null>(null);
    const prevTarget = useRef(target);

    const animate = useCallback((from: number, to: number, startTime: number) => {
        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (to - from) * eased));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [duration]);

    useEffect(() => {
        if (target === 0) { setDisplay(0); return; }
        const prev = prevTarget.current;
        prevTarget.current = target;
        // Start from 95% of the target (or previous value if it was close)
        const from = prev > 0 && Math.abs(prev - target) < target * 0.2
            ? prev
            : Math.floor(target * 0.95);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        animate(from, target, performance.now());
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target, animate]);

    return display;
}

const MainPage = () => {
    const { seekerData } = useDataContext()

    const [totalSeekerIds, setTotalSeekerIds] = useState(0)
    /** Matches for current search/rank filter (not global total) */
    const [matchCount, setMatchCount] = useState(0)
    const [dAppCount, setDAppCount] = useState<number | null>(null)
    const [das, setDas] = useState<number | null>(null)
    const currSkrIdCount = useRef(0);
    const [uiSeekerData, setUiSeekerData] = useState<DomainInfo[]>([])
    const [listLoading, setListLoading] = useState(true)
    const [todaySeekerIds, setTodaySeekerIds] = useState(0)
    const [regionDistribution, setRegionDistribution] = useState<{
        Americas: number;
        Europe: number;
        "Asia-Pacific": number;
        Other: number;
    }>({
        Americas: 0,
        Europe: 0,
        "Asia-Pacific": 0,
        Other: 0,
    });

    // sortby
    const [searchText, setSearchText] = useState<string>("");
    const [filterRank, setFilterRank] = useState<number | undefined>();
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "name-reverse" | "length">("newest")
    const [pageLimit, setPageLimit] = useState<number>(10);

    const animatedTotal = useCountUp(totalSeekerIds)
    const animatedToday = useCountUp(todaySeekerIds)
    const animatedDApps = useCountUp(dAppCount ?? 0)
    const animatedDas = useCountUp(das ?? 0)
    const isFiltered = Boolean(searchText.trim() || (filterRank && filterRank > 0))

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentPage, setCurrentPage] = useState<number>(1);

    const applyDomainsPayload = useCallback((data: {
        totalDomains: number,
        matchCount?: number,
        pagination?: { total: number },
        domainsByDate: Record<string, number>,
        domainsByTimeRange: Record<string, number>,
        data: DomainInfo[]
    }) => {
        const {
            totalDomains,
            data: domains,
            domainsByDate,
            domainsByTimeRange
        } = data;
        // Global activation total for hero stats (never use filtered match count)
        if (totalDomains > 0) {
            setTotalSeekerIds(totalDomains)
            currSkrIdCount.current = totalDomains;
        }
        const matches =
            data.matchCount ??
            data.pagination?.total ??
            domains.length;
        setMatchCount(matches);
        setUiSeekerData(domains)

        const todayDate = new Date().toISOString().split('T')[0];
        setTodaySeekerIds(domainsByDate[todayDate] || 0)

        if (domainsByTimeRange) {
            setRegionDistribution({
                Americas: domainsByTimeRange["12-18"] || 0,
                Europe: domainsByTimeRange["6-12"] || 0,
                "Asia-Pacific": domainsByTimeRange["0-6"] || 0,
                Other: domainsByTimeRange["18-24"] || 0,
            });
        }
    }, []);

    const loadDomains = useCallback(async (opts?: {
        sortBy?: typeof sortBy;
        query?: string;
        rank?: number;
        limit?: number;
        page?: number;
        soft?: boolean;
    }) => {
        if (!opts?.soft) setListLoading(true);
        try {
            const data = await fetchDomains({
                sortBy: opts?.sortBy ?? sortBy,
                query: opts?.query ?? searchText.replace(".skr", "").trim(),
                rank: opts?.rank ?? filterRank,
                limit: opts?.limit ?? pageLimit,
                page: opts?.page ?? currentPage,
            });
            applyDomainsPayload(data);
        } catch (e) {
            console.error("loadDomains", e);
        } finally {
            setListLoading(false);
        }
    }, [sortBy, searchText, filterRank, pageLimit, currentPage, applyDomainsPayload]);

    // Initial load + poll for new activations (replaces WebSocket)
    useEffect(() => {
        loadDomains();
        const id = setInterval(() => {
            // Only auto-refresh when not searching/filtering
            if (!searchText && !filterRank) {
                loadDomains({ sortBy: "newest", query: "", rank: undefined, soft: true });
            }
        }, 30_000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSort = (by: "newest" | "oldest" | "name" | "length") => {
        if (by === sortBy) return;
        setSortBy(by);
        loadDomains({ sortBy: by });
    }

    const handlePageLimitChange = (newLimit: number) => {
        setPageLimit(newLimit);
        loadDomains({ limit: newLimit });
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            handleTextSearch(searchText.replace(".skr", "").trim());
        }, 300);
        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            handleRankSearch(filterRank);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterRank]);


    useEffect(() => {
        fetch('/api/das')
            .then(r => r.json())
            .then(data => { if (data.das != null) setDas(data.das); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        // Instant count from apps catalog cache when available
        try {
            const raw = sessionStorage.getItem('dappstore-catalog-v1');
            if (raw) {
                const p = JSON.parse(raw);
                if (typeof p.activeCount === 'number') setDAppCount(p.activeCount);
                else if (typeof p.totalApps === 'number') setDAppCount(p.totalApps);
            }
        } catch { /* ignore */ }

        fetch('/api/dappstore')
            .then(r => r.json())
            .then(data => {
                if (typeof data.activeCount === 'number') {
                    setDAppCount(data.activeCount);
                } else if (data.totalApps) {
                    setDAppCount(data.totalApps);
                } else {
                    const units = data.data?.explore?.units?.edges || [];
                    const seen = new Set<string>();
                    units.forEach((u: any) => {
                        u.node?.dApps?.edges?.forEach((e: any) => seen.add(e.node.androidPackage));
                    });
                    if (seen.size > 0) setDAppCount(seen.size);
                }
            })
            .catch(() => {});
    }, []);

    const handleRankSearch = (rankNumber?: number) => {
        if (rankNumber && rankNumber <= 0) return;
        if (rankNumber === 0 || !rankNumber) {
            handleTextSearch(searchText);
            return;
        }
        loadDomains({ rank: rankNumber, query: "" });
    }


    const handleTextSearch = (text: string) => {
        if (text.trim()) {
            analytics.domainSearch(text.trim());
        }
        loadDomains({ query: text, rank: undefined });
    }


    return (
        <div className={style.main}>
            <PixelSnake />
            <header className={style.hero}>
                <div className={style.title}>
                    <Image src="/logo.png" alt="Seeker Tracker" width={100} height={100} priority />
                    <div className={style.titleText}>
                        <span>Seeker Tracker</span>
                        <p className={style.slogan}>The unofficial Solana Mobile ecosystem explorer</p>
                    </div>
                </div>
                <div className={style.heroCtas}>
                    <Link href="/dapps" className={style.heroCtaPrimary}>
                        Browse apps
                        {dAppCount != null ? ` · ${animatedDApps.toLocaleString()}` : ''}
                    </Link>
                    <Link href="/dapps/manage" className={style.heroCtaSecondary}>
                        Maintain listing
                    </Link>
                    <Link href="/explore" className={style.heroCtaSecondary}>
                        Explore SeekerIDs
                    </Link>
                </div>
            </header>

            <div className={style.statsRow} aria-label="Ecosystem stats">
                <div className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>{animatedTotal.toLocaleString()}</strong>
                        <span>SeekerIDs</span>
                    </div>
                </div>
                <div className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>{animatedToday.toLocaleString()}</strong>
                        <span>Today</span>
                    </div>
                </div>
                <Link href="/dapps" className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>{dAppCount !== null ? animatedDApps.toLocaleString() : '—'}</strong>
                        <span>Apps</span>
                    </div>
                </Link>
                <Link href="/usage" className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>{das !== null ? animatedDas.toLocaleString() : '—'}</strong>
                        <span>DAS</span>
                    </div>
                </Link>
                <Link href="/seeker-fund" className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>{seekerData.lifeTimeSolFees}&nbsp;SOL</strong>
                        <span>Seeker Fund</span>
                    </div>
                </Link>
            </div>

            <div className={style.pageTabs} aria-label="Quick links">
                <div className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>15</strong>
                        <span>
                            <Image src="/icons/seeker.png" alt="" width={16} height={16} />
                            Seekers earned
                        </span>
                    </div>
                </div>
                <Link href="https://store.solanamobile.com/" target="_blank" rel="noopener noreferrer" className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <Image src="/icons/sol.png" alt="" width={32} height={32} />
                        <span>Order Seeker</span>
                    </div>
                </Link>
                <Link href="https://solyd.store/?ref=tracker" target="_blank" rel="noopener noreferrer" className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <Image src="/icons/seeker.png" alt="" width={32} height={32} />
                        <span>Order case</span>
                    </div>
                </Link>
                <Link href="/export" className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>SKR list</strong>
                        <span>Seeker holders</span>
                    </div>
                </Link>
            </div>

            <div className={style.reginalCont}>
                <span>Seeker activation regional activity</span>
                <div className={style.reginalData}>
                    <div className={style.eachRegion}>
                        <strong>Americas:&nbsp;</strong>
                        <span>{regionDistribution.Americas}</span>
                    </div>
                    <hr />
                    <div className={style.eachRegion}>
                        <strong>Europe:&nbsp;</strong>
                        <span>{regionDistribution.Europe}</span>
                    </div>
                    <hr />
                    <div className={style.eachRegion}>
                        <strong>Other:&nbsp;</strong>
                        <span>{regionDistribution.Other}</span>
                    </div>
                    <hr />
                    <div className={style.eachRegion}>
                        <strong>Asia-Pacific:&nbsp;</strong>
                        <span>{regionDistribution["Asia-Pacific"]}</span>
                    </div>
                </div>
            </div>

            <div className={style.diffSearchType}>
                <div className={style.nameSearchCont}>
                    <input
                        type="text"
                        placeholder='Search .skr SeekerIDs... (e.g. web3dev.skr)'
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <button onClick={() => handleTextSearch(searchText)}>Search</button>
                </div>
                <div className={style.nameSearchCont}>
                    <input
                        type="text"
                        placeholder='Search by rank... (e.g. 1 for oldest SeekerID, 100 for 100th oldest)'
                        value={filterRank || ""}
                        onChange={(e) => setFilterRank(Number(e.target.value))}
                    />
                    <button onClick={() => handleRankSearch(filterRank)}>Find Rank</button>
                </div>
            </div>


            <div className={style.seekerShowcase}>
                <div className={style.showTop}>
                    <div className={style.resultInfo}>
                        <strong>SeekerID Results</strong>
                        <span>
                            {isFiltered
                                ? `Showing ${uiSeekerData.length.toLocaleString()} of ${matchCount.toLocaleString()} matches · ${totalSeekerIds.toLocaleString()} total`
                                : `Showing ${uiSeekerData.length.toLocaleString()} most recent · ${totalSeekerIds.toLocaleString()} total`}
                        </span>
                    </div>
                    <div className={style.filterTabs} role="group" aria-label="Sort SeekerIDs">
                        <button type="button" onClick={() => handleSort("newest")} className={`${style.filterTab} ${sortBy === "newest" ? style.active : ""}`}>Newest</button>
                        <button type="button" onClick={() => handleSort("oldest")} className={`${style.filterTab} ${sortBy === "oldest" ? style.active : ""}`}>Oldest</button>
                        <button type="button" onClick={() => handleSort("name")} className={`${style.filterTab} ${sortBy === "name" ? style.active : ""}`}>Name</button>
                        <button type="button" onClick={() => handleSort("length")} className={`${style.filterTab} ${sortBy === "length" ? style.active : ""}`}>Length</button>
                        <div className={style.pageLimitCont}>
                            <label className={style.pageLimitLabel} htmlFor="pageLimit">Show</label>
                            <select
                                id="pageLimit"
                                name="pageLimit"
                                className={style.pageLimit}
                                value={pageLimit}
                                onChange={(e) => handlePageLimitChange(Number(e.target.value))}
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>
                {listLoading && uiSeekerData.length === 0 ? (
                    <div className={style.listSkeleton} aria-busy="true" aria-label="Loading SeekerIDs">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={style.listSkeletonCard} />
                        ))}
                    </div>
                ) : null}

                {uiSeekerData.length > 0 && (
                    <>
                        <div className={`${style.seekerCardOuter} ${listLoading ? style.listRefreshing : ''}`}>
                            {uiSeekerData.map((domain) => (
                                <SeekerCard key={domain.name_account} domainInfo={domain} showRank={filterRank! > 0} />
                            ))}
                        </div>
                        <Link href="/explore" className={style.showAllLink}>
                            <button className={style.showAll}>View all <IoArrowDownOutline /></button>
                        </Link>
                    </>
                )}
                {!listLoading && uiSeekerData.length === 0 && (
                    <div className={style.noResult}>
                        <span className={style.noResultLabel}>No SeekerIDs match</span>
                        <Link href="https://store.solanamobile.com/" target="_blank" rel="noopener noreferrer" className={style.link}>
                            Order a Seeker to claim a .skr ID
                        </Link>
                    </div>
                )}
            </div>

            <TelegramModal />
        </div>
    )
}

export default MainPage