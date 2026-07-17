"use client";
import { useState, useEffect, useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import styles from "./page.module.css";
import Backbutton from "app/(components)/shared/Backbutton";
import { DomainInfo } from "app/(utils)/constantTypes";
import { getPaginationItems } from "app/(utils)/functions";
import { fetchDomains } from "app/(utils)/lib/fetchDomains";
import Link from "next/link";
import SeekerCard from "app/(components)/seekerCard";
import { IoArrowDownOutline } from "react-icons/io5";
import { RiResetLeftFill } from "react-icons/ri";


type Categories = "100" | "1K" | "10K";
type SortOptions = "newest" | "oldest" | "name" | "name-desc" | "length" | "length-desc";
type pageLimits = 10 | 20 | 50 | 100;

function mapSort(sortBy: SortOptions): "newest" | "oldest" | "name" | "name-reverse" | "length" {
  if (sortBy === "name-desc") return "name-reverse";
  if (sortBy === "length-desc") return "length";
  if (sortBy === "name" || sortBy === "oldest" || sortBy === "newest" || sortBy === "length") {
    return sortBy;
  }
  return "newest";
}

export default function Page() {
  // --- State ---
  const [totalDomains, setTotalDomains] = useState(0);
  const [uiSeekerData, setUiSeekerData] = useState<DomainInfo[]>([]);

  // Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState<pageLimits>(10);
  const [sortBy, setSortBy] = useState<SortOptions>("newest");
  const [category, setCategory] = useState<Categories | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rankQuery, setRankQuery] = useState<string>("");

  const [exactMatch, setExactMatch] = useState<boolean>(false);


  // Load from Turso-backed API whenever filters change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rank = rankQuery ? Number(rankQuery) : undefined;
        const data = await fetchDomains({
          sortBy: mapSort(sortBy),
          limit: category ? 10000 : pageLimit,
          page: currentPage,
          query: searchQuery,
          rank: rank && rank > 0 ? rank : undefined,
        });
        if (cancelled) return;
        setTotalDomains(data.totalDomains);
        // Client-side category band filter (ranks 1–100 / 1–1k / 1–10k)
        let domains = data.data;
        if (category === "100") domains = domains.filter((d) => (d.rank ?? 0) <= 100);
        if (category === "1K") domains = domains.filter((d) => (d.rank ?? 0) <= 1000);
        if (category === "10K") domains = domains.filter((d) => (d.rank ?? 0) <= 10000);
        if (exactMatch && searchQuery) {
          const q = searchQuery.toLowerCase();
          domains = domains.filter((d) => d.subdomain.toLowerCase() === q);
        }
        setUiSeekerData(domains);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [sortBy, pageLimit, currentPage, category, searchQuery, rankQuery, exactMatch]);

  // --- Derived State ---
  const maxPage = Math.ceil(totalDomains / pageLimit) || 1;


  const handlePageChange = (newPage: number) => {
    if (category) setCategory(undefined);
    if (newPage >= 1 && newPage <= maxPage) {
      setCurrentPage(newPage);
    }
  };
  const handlePageLimitChange = (newLimit: pageLimits) => {
    if (category) setCategory(undefined);

    setPageLimit(newLimit);
    const newPage = Math.ceil(((currentPage - 1) * pageLimit + 1) / newLimit);
    setCurrentPage(newPage);
  };

  const handleSortByChange = (newSortBy: SortOptions) => {
    console.log("Sort by changed to:", newSortBy);
    if (category) setCategory(undefined);
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const handleCategoryChange = (newCategory: Categories | undefined) => {

    setCategory(newCategory);
    setCurrentPage(1);
  };

  // pagination handlers
  const paginationItems = getPaginationItems(currentPage, maxPage, 1);


  return (
    <div className={styles.main}>
      <Backbutton />

      <div className={styles.topBar}>
        <div className={styles.selectionCont}>
          <span className={styles.selectionLabel}>Sort By:</span>
          <select
            name="sortBy"
            className={styles.selection} value={sortBy}

            onChange={(e) => handleSortByChange(e.target.value as SortOptions)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="length">Length (Shortest)</option>
            <option value="length-desc">Length (Longest)</option>
          </select>
        </div>

        <div className={styles.selectionCont}>
          <span className={styles.selectionLabel}>Show:</span>
          <select
            name="pageLimit"
            className={styles.selection} value={pageLimit}
            onChange={(e) => handlePageLimitChange(Number(e.target.value) as pageLimits)}
          >
            <option value={10}>10 Results</option>
            <option value={20}>20 Results</option>
            <option value={50}>50 Results</option>
            <option value={100}>100 Results</option>
          </select>
        </div>

      </div>

      <div className={styles.categoryWise}>
        <span onClick={() => handleCategoryChange("100")}>Club 100</span>
        <span onClick={() => handleCategoryChange("1K")}>Club 1K</span>
        <span onClick={() => handleCategoryChange("10K")}>Club 10K</span>
      </div>

      {category && (
        <div className={styles.CategoryCont}>
          <span>Category: Top {category} IDs</span>
          <Category_Map allDomains={uiSeekerData} category={category} />
        </div>
      )}

      {!category && (
        <div className={styles.seekerShowcase}>
          <span className={styles.totalDomains}>Total IDs: {totalDomains}</span>

          {uiSeekerData.length > 0 && (
            <div className={styles.seekerCardOuter}>
              {uiSeekerData.map((domain) => (
                <SeekerCard key={domain.name_account} domainInfo={domain} showRank={false} />
              ))}
            </div>
          )}
          {uiSeekerData.length === 0 && (
            <div className={styles.noResult}>
              <span className={styles.maginifyingGlass}>🔍</span>
              <Link href="https://store.solanamobile.com/" target='_blank' className={styles.link}>Still available - order seeker to claim</Link>
            </div>
          )}
          {/* pagination bottom */}
          <div className={styles.pagination}>
            {/* First Page (<<) */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className={styles.pageBtn}
              title="First Page"
            >
              &laquo;
            </button>

            {/* Previous (<) */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className={styles.pageBtn}
              title="Previous"
            >
              &#8249;
            </button>

            {/* Page Numbers */}
            {paginationItems.map((item, index) => (
              <button
                key={index}
                disabled={item === "..."}
                onClick={() => typeof item === "number" && handlePageChange(item)}
                className={`${styles.pageBtn} ${item === currentPage ? styles.active : ""
                  } ${item === "..." ? styles.dots : ""}`}
              >
                {item}
              </button>
            ))}

            {/* Next (>) */}
            <button
              disabled={currentPage === maxPage}
              onClick={() => setCurrentPage(currentPage + 1)}
              className={styles.pageBtn}
              title="Next"
            >
              &#8250;
            </button>

            {/* Last Page (>>) */}
            <button
              disabled={currentPage === maxPage}
              onClick={() => setCurrentPage(maxPage)}
              className={styles.pageBtn}
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const CATEGORY_CONFIG: Record<Categories, { total: number; columns: number }> = {
  "100": { total: 100, columns: 10 },        // 10x10 Grid
  "1K": { total: 1000, columns: 40 },        // 40x25 Grid
  "10K": { total: 10000, columns: 100 },     // 100x100 Grid
};
const Category_Map = ({ allDomains, category }: { allDomains: DomainInfo[], category: Categories }) => {
  const [takenNumbers, setTakenNumbers] = useState<Set<number>>(new Set());
  const { total, columns } = CATEGORY_CONFIG[category];
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const newTakenSet = new Set<number>();
    allDomains.forEach((info) => {
      if (/^\d+$/.test(info.subdomain)) {
        const num = parseInt(info.subdomain, 10);
        if (num >= 0 && num < total) {
          newTakenSet.add(num);
        }
      }
    });
    setTakenNumbers(newTakenSet);
  }, [allDomains, total]);

  return (
    <div className={styles.mapContainer} >
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className={styles.zoomControls}>
              <button onClick={() => zoomIn()}>+</button>
              <button onClick={() => zoomOut()}>-</button>
              <button onClick={() => resetTransform()}><RiResetLeftFill /></button>
            </div>

            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              {/* --- 3. The Grid --- */}
              <div
                className={styles.allGrids}
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                }
                }
              >
                {/* Generate cells 0 to total-1 */}
                {Array.from({ length: total }).map((_, i) => {
                  const isTaken = takenNumbers.has(i);

                  return (
                    <div
                      key={i}
                      title={isTaken ? `Taken: #${i}` : `Available: #${i}`}
                      style={{
                        aspectRatio: '1', // Keeps cells square
                        backgroundColor: isTaken ? '#22c55e' : '#1f2937', // Green vs Gray
                        border: isTaken ? '1px solid #16a34a' : '1px solid #374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: isTaken ? 'black' : '#6b7280',
                        fontWeight: 'bold',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      {i}
                    </div>
                  );
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};