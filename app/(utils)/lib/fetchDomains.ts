import { DomainInfo } from "../constantTypes";

export type DomainsResponse = {
  success: boolean;
  /** Global activation total (max of row count and max rank) — hero stats */
  totalDomains: number;
  /** Rows actually in the index (for pagination / pageable data) */
  indexedCount?: number;
  /** Highest Seeker rank in the index */
  maxRank?: number;
  /** Matches for the current filter (alias of pagination.total) */
  matchCount?: number;
  domainsByDate: Record<string, number>;
  domainsByTimeRange: Record<string, number>;
  data: DomainInfo[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  source?: string;
};

export type DomainsQuery = {
  page?: number;
  pageSize?: number;
  limit?: number;
  sortBy?: "newest" | "oldest" | "name" | "name-reverse" | "length";
  query?: string;
  rank?: number;
};

export async function fetchDomains(
  params: DomainsQuery = {}
): Promise<DomainsResponse> {
  const res = await fetch("/api/domains", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? params.limit ?? 50,
      sortBy: params.sortBy ?? "newest",
      query: params.query ?? "",
      rank: params.rank,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`domains ${res.status}`);
  }
  return res.json();
}
