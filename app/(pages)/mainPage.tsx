"use client";
import React, { Activity, useEffect, useRef, useState } from 'react'
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


const MainPage = () => {
    const { seekerData, backendWS } = useDataContext()

    const [totalSeekerIds, setTotalSeekerIds] = useState(0)
    const [animatedTotal, setAnimatedTotal] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const currSkrIdCount = useRef(0);
    const [uiSeekerData, setUiSeekerData] = useState<DomainInfo[]>([])
    const [todaySeekerIds, setTodaySeekerIds] = useState(0)
    const [animatedToday, setAnimatedToday] = useState(0)
    const [isTodayAnimating, setIsTodayAnimating] = useState(false)

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

    const [animatedRegions, setAnimatedRegions] = useState<{
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

    const [animatingRegions, setAnimatingRegions] = useState<{
        Americas: boolean;
        Europe: boolean;
        "Asia-Pacific": boolean;
        Other: boolean;
    }>({
        Americas: false,
        Europe: false,
        "Asia-Pacific": false,
        Other: false,
    });

    // sortby
    const [searchText, setSearchText] = useState<string>("");
    const [filterRank, setFilterRank] = useState<number | undefined>();
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "name-reverse">("newest")
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

    // Animate counter when total changes
    useEffect(() => {
        if (totalSeekerIds === animatedTotal) return;

        setIsAnimating(true);
        const start = animatedTotal;
        const end = totalSeekerIds;
        const duration = 600; // milliseconds
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            setAnimatedTotal(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
            }
        };

        animate();
    }, [totalSeekerIds, animatedTotal]);

    // Animate today counter
    useEffect(() => {
        if (todaySeekerIds === animatedToday) return;

        setIsTodayAnimating(true);
        const start = animatedToday;
        const end = todaySeekerIds;
        const duration = 600;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            setAnimatedToday(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsTodayAnimating(false);
            }
        };

        animate();
    }, [todaySeekerIds, animatedToday]);

    // Animate region counters
    useEffect(() => {
        const regionKeys: Array<"Americas" | "Europe" | "Asia-Pacific" | "Other"> = ["Americas", "Europe", "Asia-Pacific", "Other"];
        const animatingState = { ...animatingRegions };
        let hasChanges = false;

        regionKeys.forEach((region) => {
            if (regionDistribution[region] !== animatedRegions[region]) {
                hasChanges = true;
                animatingState[region] = true;
            }
        });

        if (!hasChanges) return;

        setAnimatingRegions(animatingState);
        const duration = 600;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const newAnimated = { ...animatedRegions };
            regionKeys.forEach((region) => {
                const start = animatedRegions[region];
                const end = regionDistribution[region];
                const current = Math.floor(start + (end - start) * progress);
                newAnimated[region] = current;
            });

            setAnimatedRegions(newAnimated);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatingRegions({
                    Americas: false,
                    Europe: false,
                    "Asia-Pacific": false,
                    Other: false,
                });
            }
        };

        animate();
    }, [regionDistribution, animatedRegions, animatingRegions]);

    const handleSort = (by: "newest" | "oldest" | "name") => {
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
                        <strong className={isAnimating ? style.animating : ''}>{animatedTotal.toLocaleString()}</strong>
                        <span>Total Seeker Ids</span>
                    </div>
                </div>
                <div className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong className={isTodayAnimating ? style.animating : ''}>{animatedToday}</strong>
                        <span>Today</span>
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
                        <span>Our Favourites</span>
                    </div>
                </Link>
                <Link href={"/lookup"} className={style.tabWrapper}>
                    <div className={style.eachTab}>
                        <strong>Lookup</strong>
                        <span>Search SeekerID Details</span>
                    </div>
                </Link>
            </div>

            <div className={style.regionalCont}>
                <span>Seeker Activation Regional Activity:</span>
                <div className={style.regionalData}>
                    <div className={style.eachRegion}>
                        <strong>Americas:&nbsp;</strong>
                        <span className={animatingRegions.Americas ? style.animating : ''}>{animatedRegions.Americas}</span>
                    </div>
                    <hr />
                    <div className={style.eachRegion}>
                        <strong>Europe:&nbsp;</strong>
                        <span className={animatingRegions.Europe ? style.animating : ''}>{animatedRegions.Europe}</span>
                    </div>
                    <hr />
                    <div className={style.eachRegion}>
                        <strong>Other:&nbsp;</strong>
                        <span className={animatingRegions.Other ? style.animating : ''}>{animatedRegions.Other}</span>
                    </div>
                    <hr />
                    <div className={style.eachRegion}>
                        <strong>Asia-Pacific:&nbsp;</strong>
                        <span className={animatingRegions["Asia-Pacific"] ? style.animating : ''}>{animatedRegions["Asia-Pacific"]}</span>
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