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
    const { seekerData, backendWS } = useDataContext()

    const [totalSeekerIds, setTotalSeekerIds] = useState(0)
    const [dAppCount, setDAppCount] = useState<number | null>(null)
    const currSkrIdCount = useRef(0);
    const [uiSeekerData, setUiSeekerData] = useState<DomainInfo[]>([])
    const [todaySeekerIds, setTodaySeekerIds] = useState(0)
    const animatedTotal = useCountUp(totalSeekerIds)
    const animatedToday = useCountUp(todaySeekerIds)
    const animatedDApps = useCountUp(dAppCount ?? 0)

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        if (!backendWS) return;

        backendWS.emit("getDomains", { sortBy: "newest", limit: pageLimit });

        backendWS.on("sortedDomains", (data: {
            totalDomains: number,
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
            setTotalSeekerIds(totalDomains)
            currSkrIdCount.current = totalDomains;

            setUiSeekerData(domains)

            const todayDate = new Date().toISOString().split('T')[0];
            setTodaySeekerIds(domainsByDate[todayDate] || 0)

            // regwinal
            if (domainsByTimeRange) {
                const asiaPacific = domainsByTimeRange["0-6"] || 0;
                const europe = domainsByTimeRange["6-12"] || 0;
                const americas = domainsByTimeRange["12-18"] || 0;
                const other = domainsByTimeRange["18-24"] || 0;

                setRegionDistribution({
                    Americas: americas,
                    Europe: europe,
                    "Asia-Pacific": asiaPacific,
                    Other: other,
                });

            }


        })

        setInterval(() => {
            if (currSkrIdCount.current > 0) return;
            console.log("Fetching latest domains...");
            backendWS.emit("getDomains", {
                sortBy: "newest",
            })
        }, 5 * 1000);

        backendWS.on("newDomain", (data) => {
            console.log("New domain received:", data);
            setTodaySeekerIds(prev => prev + 1)
            setTotalSeekerIds(prev => prev + 1)
            currSkrIdCount.current += 1;
            setUiSeekerData(prev => {
                const next = [...prev];
                if (!next.find(d => d.name_account === data.name_account)) {
                    const newData = {
                        ...data,
                        rank: data.rank ?? currSkrIdCount.current, // Assign rank if not present
                    };

                    next.unshift(newData);
                }
                return next;
            });

            const currentHour = new Date(data.created_at).getUTCHours();
            setRegionDistribution(prev => {
                const updated = { ...prev };
                if (currentHour >= 0 && currentHour < 6) {
                    updated["Asia-Pacific"] += 1;
                }
                else if (currentHour >= 6 && currentHour < 12) {
                    updated["Europe"] += 1;
                }
                else if (currentHour >= 12 && currentHour < 18) {
                    updated["Americas"] += 1;
                }
                else {
                    updated["Other"] += 1;
                }
                return updated;
            });
        })

    }, [backendWS]);

    const handleSort = (by: "newest" | "oldest" | "name" | "length") => {
        if (by === sortBy) return;
        setSortBy(by);
        if (!backendWS) return;
        backendWS.emit("getDomains", {
            page: currentPage,
            query: searchText,
            sortBy: by,
            limit: pageLimit
        });
    }

    const handlePageLimitChange = (newLimit: number) => {
        setPageLimit(newLimit);

        if (!backendWS) return;

        backendWS.emit("getDomains", {
            query: searchText,
            sortBy,
            limit: newLimit,
            page: currentPage, // optional: reset to first page when limit changes
        });
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
        fetch('/api/dappstore')
            .then(r => r.json())
            .then(data => {
                if (data.totalApps) {
                    setDAppCount(data.totalApps);
                } else {
                    // Fallback: count unique packages from explore data
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

        if (!backendWS) return;
        if (rankNumber && rankNumber <= 0) return;

        if (rankNumber === 0 || !rankNumber) {
            handleTextSearch(searchText);
            return;
        }

        backendWS.emit("getDomains", {
            rankQuery: rankNumber
        });

    }


    const handleTextSearch = (text: string) => {
        if (!backendWS) return;
        if (text.trim()) {
            analytics.domainSearch(text.trim());
        }
        backendWS.emit("getDomains", {
            query: text,
            limit: pageLimit,
            page: currentPage,
            sortBy
        })
    }


    return (
        <div className={style.main}>
            <PixelSnake />
            <div className={style.title}>
                <Image src="/logo.png" alt="" width={100} height={100} />
                <span>Seeker tracker</span>
            </div>

            <div className={style.pageTabs}>
                <div className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>{animatedTotal.toLocaleString()}</strong>
                        <span>Total Seeker Ids</span>
                    </div>
                </div>
                <div className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>{animatedToday.toLocaleString()}</strong>
                        <span>Today</span>
                    </div>
                </div>
<Link href={'/seeker-fund'} className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>{seekerData.lifeTimeSolFees}&nbsp;SOL</strong>
                        <span>💰 Seeker Fund</span>
                    </div>
                </Link>
                <div className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>15</strong>
                        <span>
                            <Image src="/icons/seeker.png" alt="" width={16} height={16} />
                            Seekers Earned
                        </span>
                    </div>
                </div>
                <Link href={"https://store.solanamobile.com/"} target='_blank' rel="noopener noreferrer" className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <Image src="/icons/sol.png" alt="" width={32} height={32} />
                        <span>💰 Order Seeker</span>
                    </div>
                </Link>
                <Link href={"https://solyd.store/?ref=tracker"} target='_blank' rel="noopener noreferrer" className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <Image src="/icons/seeker.png" alt="" width={32} height={32} />
                        <span>Order Case</span>
                    </div>
                </Link>
                <Link href={"/export"} className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>SKR List</strong>
                        <span>Seeker Holders</span>
                    </div>
                </Link>
                <Link href={"/apps"} className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>Apps</strong>
                        <span>{dAppCount !== null ? `${animatedDApps} Apps` : 'Our Favourites'}</span>
                    </div>
                </Link>
            </div>

            <div className={style.reginalCont}>
                <span>Seeker Activation Reginal Activity:</span>
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
                        <span>Showing {uiSeekerData.length} of {totalSeekerIds} most recent</span>
                    </div>
                    <div className={style.filterTabs}>
                        <span onClick={() => handleSort("newest")} className={`${style.filterTab} ${sortBy === "newest" ? style.active : ""}`} >Newest</span>
                        <span onClick={() => handleSort("oldest")} className={`${style.filterTab} ${sortBy === "oldest" ? style.active : ""}`} >Oldest</span>
                        <span onClick={() => handleSort("name")} className={`${style.filterTab} ${sortBy === "name" ? style.active : ""}`} >Name</span>
                        <span onClick={() => handleSort("length")} className={`${style.filterTab} ${sortBy === "length" ? style.active : ""}`} >Length</span>
                        <hr />
                        <div className={style.pageLimitCont}>
                            <span className={style.pageLimitLabel}>Show:</span>
                            <select
                                name="pageLimit"
                                className={style.pageLimit} value={pageLimit}
                                onChange={(e) => handlePageLimitChange(Number(e.target.value))}
                            >
                                <option value="10">10 results</option>
                                <option value="20">20 results</option>
                                <option value="50">50 results</option>
                                <option value="100">100 results</option>
                            </select>
                        </div>


                    </div>
                </div>
                {uiSeekerData.length > 0 && (
                    <>
                        <div className={style.seekerCardOuter}>
                            {uiSeekerData.map((domain) => (
                                <SeekerCard key={domain.name_account} domainInfo={domain} showRank={filterRank! > 0} />
                            ))}
                        </div>
                        <Link href="/explore" className={style.showAllLink}>
                            <button className={style.showAll}>View all <IoArrowDownOutline /></button>
                        </Link>
                    </>
                )}
                {uiSeekerData.length === 0 && (
                    <div className={style.noResult}>
                        <span className={style.maginifyingGlass}>🔍</span>
                        <Link href="https://store.solanamobile.com/" target='_blank' className={style.link}>Still available - order seeker to claim</Link>
                    </div>
                )}
            </div>

            <TelegramModal />
        </div>
    )
}

export default MainPage