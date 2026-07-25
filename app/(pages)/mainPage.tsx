"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import style from "./mainPage.module.css";
import Image from "next/image";
import { useDataContext } from "app/(utils)/context/dataProvider";
import { DomainInfo } from "app/(utils)/constantTypes";
import SeekerCard from "app/(components)/seekerCard";
import Link from "next/link";
import TelegramModal from "app/(components)/TelegramModal";
import PixelSnake from "app/(components)/PixelSnake";
import { analytics } from "app/(utils)/lib/analytics";
import { fetchDomains } from "app/(utils)/lib/fetchDomains";
import { IoArrowForward, IoSearchOutline } from "react-icons/io5";

const DAS_PUBLIC = "https://seeker-das-scanner.gm-4e8.workers.dev/public/das";

/** Counts up from ~95% of target to target over ~1.2s */
function useCountUp(target: number, duration = 1200): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const prevTarget = useRef(target);

  const animate = useCallback(
    (from: number, to: number, startTime: number) => {
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(from + (to - from) * eased));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [duration]
  );

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }
    const prev = prevTarget.current;
    prevTarget.current = target;
    const from =
      prev > 0 && Math.abs(prev - target) < target * 0.2
        ? prev
        : Math.floor(target * 0.95);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    animate(from, target, performance.now());
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, animate]);

  return display;
}

function formatSol(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

const MainPage = () => {
  const { seekerData } = useDataContext();

  const [totalSeekerIds, setTotalSeekerIds] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [dAppCount, setDAppCount] = useState<number | null>(null);
  const [das, setDas] = useState<number | null>(null);
  const currSkrIdCount = useRef(0);
  const [uiSeekerData, setUiSeekerData] = useState<DomainInfo[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [todaySeekerIds, setTodaySeekerIds] = useState(0);
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

  const [searchMode, setSearchMode] = useState<"name" | "rank">("name");
  const [searchText, setSearchText] = useState<string>("");
  const [filterRank, setFilterRank] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "name" | "name-reverse" | "length"
  >("newest");
  const [pageLimit, setPageLimit] = useState<number>(10);
  const [currentPage] = useState<number>(1);

  const animatedTotal = useCountUp(totalSeekerIds);
  const animatedToday = useCountUp(todaySeekerIds);
  const animatedDApps = useCountUp(dAppCount ?? 0);
  const animatedDas = useCountUp(das ?? 0);
  const isFiltered = Boolean(
    searchText.trim() || (filterRank && filterRank > 0)
  );

  const regionMax = useMemo(() => {
    const vals = Object.values(regionDistribution);
    return Math.max(1, ...vals);
  }, [regionDistribution]);

  const applyDomainsPayload = useCallback(
    (data: {
      totalDomains: number;
      matchCount?: number;
      pagination?: { total: number };
      domainsByDate: Record<string, number>;
      domainsByTimeRange: Record<string, number>;
      data: DomainInfo[];
    }) => {
      const {
        totalDomains,
        data: domains,
        domainsByDate,
        domainsByTimeRange,
      } = data;
      if (totalDomains > 0) {
        setTotalSeekerIds(totalDomains);
        currSkrIdCount.current = totalDomains;
      }
      const matches =
        data.matchCount ?? data.pagination?.total ?? domains.length;
      setMatchCount(matches);
      setUiSeekerData(domains);

      const todayDate = new Date().toISOString().split("T")[0];
      setTodaySeekerIds(domainsByDate[todayDate] || 0);

      if (domainsByTimeRange) {
        setRegionDistribution({
          Americas: domainsByTimeRange["12-18"] || 0,
          Europe: domainsByTimeRange["6-12"] || 0,
          "Asia-Pacific": domainsByTimeRange["0-6"] || 0,
          Other: domainsByTimeRange["18-24"] || 0,
        });
      }
    },
    []
  );

  const loadDomains = useCallback(
    async (opts?: {
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
    },
    [sortBy, searchText, filterRank, pageLimit, currentPage, applyDomainsPayload]
  );

  useEffect(() => {
    loadDomains();
    const id = setInterval(() => {
      if (!searchText && !filterRank) {
        loadDomains({
          sortBy: "newest",
          query: "",
          rank: undefined,
          soft: true,
        });
      }
    }, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = (by: "newest" | "oldest" | "name" | "length") => {
    if (by === sortBy) return;
    setSortBy(by);
    loadDomains({ sortBy: by });
  };

  const handlePageLimitChange = (newLimit: number) => {
    setPageLimit(newLimit);
    loadDomains({ limit: newLimit });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchMode !== "name") return;
      handleTextSearch(searchText.replace(".skr", "").trim());
    }, 300);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, searchMode]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchMode !== "rank") return;
      handleRankSearch(filterRank);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRank, searchMode]);

  useEffect(() => {
    fetch("/api/das")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.das === "number") setDas(data.das);
      })
      .catch(() => {
        // Fallback to scanner worker if proxy fails
        fetch(DAS_PUBLIC)
          .then((r) => r.json())
          .then((data) => {
            if (typeof data?.das === "number") setDas(data.das);
          })
          .catch(() => {});
      });
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("dappstore-catalog-v1");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.activeCount === "number") setDAppCount(p.activeCount);
        else if (typeof p.totalApps === "number") setDAppCount(p.totalApps);
      }
    } catch {
      /* ignore */
    }

    fetch("/api/dappstore")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.activeCount === "number") {
          setDAppCount(data.activeCount);
        } else if (data.totalApps) {
          setDAppCount(data.totalApps);
        } else {
          const units = data.data?.explore?.units?.edges || [];
          const seen = new Set<string>();
          units.forEach((u: { node?: { dApps?: { edges?: Array<{ node: { androidPackage: string } }> } } }) => {
            u.node?.dApps?.edges?.forEach((e) =>
              seen.add(e.node.androidPackage)
            );
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
  };

  const handleTextSearch = (text: string) => {
    if (text.trim()) {
      analytics.domainSearch(text.trim());
    }
    loadDomains({ query: text, rank: undefined });
  };

  const onPrimarySearch = () => {
    if (searchMode === "rank") handleRankSearch(filterRank);
    else handleTextSearch(searchText.replace(".skr", "").trim());
  };

  const fundSol = formatSol(seekerData?.lifeTimeSolFees);

  const regionRows: Array<{ key: keyof typeof regionDistribution; label: string }> = [
    { key: "Americas", label: "Americas" },
    { key: "Europe", label: "Europe" },
    { key: "Asia-Pacific", label: "APAC" },
    { key: "Other", label: "Other" },
  ];

  return (
    <div className={style.main}>
      <PixelSnake />

      {/* ── Hero ─────────────────────────────────────────── */}
      <header className={style.hero}>
        <div className={style.heroTop}>
          <div className={style.brandBlock}>
            <div className={style.brandMark}>
              <Image
                src="/logo.png"
                alt=""
                width={72}
                height={72}
                priority
                className={style.brandLogo}
              />
              <div className={style.brandCopy}>
                <p className={style.eyebrow}>Solana Mobile · unofficial</p>
                <h1 className={style.brandTitle}>Seeker Tracker</h1>
                <p className={style.slogan}>
                  Explore .skr SeekerIDs, dApps, DAS, and on-chain stats.
                </p>
              </div>
            </div>
          </div>

          <div className={style.heroAside}>
            <div className={style.livePill} title="Polling every 30s">
              <span className={style.liveDot} aria-hidden />
              Live feed
            </div>
            <div className={style.heroActions}>
              <Link href="/dapps" className={style.heroCtaPrimary}>
                Browse apps
                {dAppCount != null ? ` · ${animatedDApps.toLocaleString()}` : ""}
              </Link>
              <Link href="/explore" className={style.heroCtaSecondary}>
                Explore all
              </Link>
              <Link href="/dapps/manage" className={style.heroCtaGhost}>
                Maintain listing
              </Link>
            </div>
          </div>
        </div>

        {/* Search console */}
        <div className={style.searchConsole}>
          <div className={style.searchModes} role="tablist" aria-label="Search mode">
            <button
              type="button"
              role="tab"
              aria-selected={searchMode === "name"}
              className={`${style.modeTab} ${searchMode === "name" ? style.modeActive : ""}`}
              onClick={() => {
                setSearchMode("name");
                setFilterRank(undefined);
              }}
            >
              Name
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={searchMode === "rank"}
              className={`${style.modeTab} ${searchMode === "rank" ? style.modeActive : ""}`}
              onClick={() => {
                setSearchMode("rank");
                setSearchText("");
              }}
            >
              Rank
            </button>
          </div>

          <div className={style.searchField}>
            <IoSearchOutline className={style.searchIcon} aria-hidden />
            {searchMode === "name" ? (
              <input
                type="text"
                placeholder="Search .skr SeekerIDs — e.g. web3dev"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onPrimarySearch();
                }}
                aria-label="Search SeekerIDs by name"
              />
            ) : (
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Find by rank — e.g. 1 = oldest"
                value={filterRank || ""}
                onChange={(e) =>
                  setFilterRank(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") onPrimarySearch();
                }}
                aria-label="Search SeekerIDs by rank"
              />
            )}
            <button type="button" className={style.searchBtn} onClick={onPrimarySearch}>
              Search
            </button>
          </div>
        </div>
      </header>

      {/* ── Metrics ──────────────────────────────────────── */}
      <section className={style.metrics} aria-label="Ecosystem stats">
        <div className={style.metric}>
          <span className={style.metricLabel}>SeekerIDs</span>
          <strong className={style.metricValue}>
            {animatedTotal.toLocaleString()}
          </strong>
        </div>
        <div className={style.metric}>
          <span className={style.metricLabel}>Today</span>
          <strong className={style.metricValue}>
            {animatedToday.toLocaleString()}
          </strong>
        </div>
        <Link href="/dapps" className={style.metric}>
          <span className={style.metricLabel}>Apps</span>
          <strong className={style.metricValue}>
            {dAppCount !== null ? animatedDApps.toLocaleString() : "—"}
          </strong>
        </Link>
        <Link href="/das" className={style.metric}>
          <span className={style.metricLabel}>DAS · 24h</span>
          <strong className={style.metricValue}>
            {das !== null ? animatedDas.toLocaleString() : "—"}
          </strong>
        </Link>
        <Link href="/seeker-fund" className={style.metric}>
          <span className={style.metricLabel}>Seeker Fund</span>
          <strong className={style.metricValue}>
            {fundSol}
            <em> SOL</em>
          </strong>
        </Link>
      </section>

      {/* ── Region + shortcuts ───────────────────────────── */}
      <div className={style.midGrid}>
        <section className={style.regionPanel} aria-label="Regional activation">
          <header className={style.panelHead}>
            <span className={style.panelEyebrow}>Activation windows · UTC</span>
            <h2 className={style.panelTitle}>Regional pulse</h2>
          </header>
          <ul className={style.regionList}>
            {regionRows.map(({ key, label }) => {
              const v = regionDistribution[key];
              const pct = Math.round((v / regionMax) * 100);
              return (
                <li key={key} className={style.regionRow}>
                  <span className={style.regionName}>{label}</span>
                  <div className={style.regionTrack} aria-hidden>
                    <div
                      className={style.regionFill}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={style.regionVal}>{v.toLocaleString()}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={style.shortcuts} aria-label="Quick links">
          <header className={style.panelHead}>
            <span className={style.panelEyebrow}>Jump</span>
            <h2 className={style.panelTitle}>Shortcuts</h2>
          </header>
          <div className={style.chipGrid}>
            <Link href="/skr" className={style.chip}>
              SKR stats
            </Link>
            <Link href="/export" className={style.chip}>
              SKR holders
            </Link>
            <Link href="/activations" className={style.chip}>
              Activations
            </Link>
            <Link href="/developers" className={style.chip}>
              Public API
            </Link>
            <Link href="/sweep" className={style.chip}>
              Sweep
            </Link>
            <Link href="/snake" className={style.chip}>
              Snake
            </Link>
            <a
              href="https://store.solanamobile.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={style.chip}
            >
              <Image src="/icons/sol.png" alt="" width={14} height={14} />
              Order Seeker
            </a>
            <a
              href="https://solyd.store/?ref=tracker"
              target="_blank"
              rel="noopener noreferrer"
              className={style.chip}
            >
              <Image src="/icons/seeker.png" alt="" width={14} height={14} />
              Case
            </a>
          </div>
          <p className={style.earnedNote}>
            <strong>15</strong> Seekers earned via the tracker community
          </p>
        </section>
      </div>

      {/* ── Results ──────────────────────────────────────── */}
      <section className={style.results} aria-label="SeekerID results">
        <div className={style.showTop}>
          <div className={style.resultInfo}>
            <h2 className={style.panelTitle}>SeekerIDs</h2>
            <span>
              {isFiltered
                ? `Showing ${uiSeekerData.length.toLocaleString()} of ${matchCount.toLocaleString()} matches · ${totalSeekerIds.toLocaleString()} total`
                : `Showing ${uiSeekerData.length.toLocaleString()} most recent · ${totalSeekerIds.toLocaleString()} total`}
            </span>
          </div>
          <div
            className={style.filterTabs}
            role="group"
            aria-label="Sort SeekerIDs"
          >
            {(
              [
                ["newest", "Newest"],
                ["oldest", "Oldest"],
                ["name", "Name"],
                ["length", "Length"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSort(id)}
                className={`${style.filterTab} ${sortBy === id ? style.active : ""}`}
              >
                {label}
              </button>
            ))}
            <div className={style.pageLimitCont}>
              <label className={style.pageLimitLabel} htmlFor="pageLimit">
                Show
              </label>
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
          <div
            className={style.listSkeleton}
            aria-busy="true"
            aria-label="Loading SeekerIDs"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={style.listSkeletonCard} />
            ))}
          </div>
        ) : null}

        {uiSeekerData.length > 0 && (
          <>
            <div
              className={`${style.seekerCardOuter} ${listLoading ? style.listRefreshing : ""}`}
            >
              {uiSeekerData.map((domain) => (
                <SeekerCard
                  key={domain.name_account}
                  domainInfo={domain}
                  showRank={filterRank! > 0}
                />
              ))}
            </div>
            <Link href="/explore" className={style.showAllLink}>
              <span>View all SeekerIDs</span>
              <IoArrowForward aria-hidden />
            </Link>
          </>
        )}

        {!listLoading && uiSeekerData.length === 0 && (
          <div className={style.noResult}>
            <span className={style.noResultLabel}>No SeekerIDs match</span>
            <Link
              href="https://store.solanamobile.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={style.link}
            >
              Order a Seeker to claim a .skr ID
            </Link>
          </div>
        )}
      </section>

      <TelegramModal />
    </div>
  );
};

export default MainPage;
