"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import Image from 'next/image'
import Backbutton from 'app/(components)/shared/Backbutton'
import {
    SOLANA_DAPP_STORE_OFFICIAL_APP_COUNT_FORMATTED,
    SOLANA_DAPP_STORE_OFFICIAL_CITATION,
} from 'app/(utils)/lib/dappStoreStats'

interface DApp {
    androidPackage: string
    status?: 'active' | 'removed' | string
    removedAt?: string | null
    firstSeenAt?: string | null
    rating?: {
        rating: number
        reviewsByRating?: number[]
    }
    lastRelease?: {
        displayName: string
        subtitle?: string
        description?: string
        updatedOn?: string
        newInVersion?: string
        privacyPolicyUrl?: string
        icon?: {
            uri: string
        }
        publisherDetails?: {
            name: string
            website?: string
            supportEmail?: string
            twitter?: string
            telegram?: string
            websiteOverride?: string
        }
        blurb?: string
        claimed?: boolean
        androidDetails?: {
            version: string
            versionCode?: number
            minSdk?: number
        }
    }
}

type CatalogApp = DApp & { categories: string[] }

interface CategoryWithApps {
    category: {
        id: string
        name: string
    }
    dApps: {
        edges: Array<{
            node: DApp
        }>
    }
}

type SortOption = 'updated-desc' | 'newest' | 'rating-desc' | 'name-asc'
type StatusFilter = 'active' | 'removed' | 'all'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'updated-desc', label: 'Recently updated' },
    { value: 'newest', label: 'Newest' },
    { value: 'rating-desc', label: 'Highest rated' },
    { value: 'name-asc', label: 'Name A–Z' },
]

const SEARCH_ATTRS = {
    autoCorrect: 'off' as const,
    autoCapitalize: 'none' as const,
    spellCheck: false as const,
    autoComplete: 'off' as const,
    enterKeyHint: 'search' as const,
}

function parseSort(value: string | null): SortOption {
    if (value === 'updated-desc' || value === 'newest' || value === 'rating-desc' || value === 'name-asc') {
        return value
    }
    return 'updated-desc'
}

function parseStatus(value: string | null): StatusFilter {
    if (value === 'removed' || value === 'all') return value
    return 'active'
}

function dateValue(value?: string | null): number {
    if (!value) return 0
    const t = new Date(value).getTime()
    return Number.isFinite(t) ? t : 0
}

function appDescription(app: DApp): string {
    const release = app.lastRelease
    if (!release) return ''
    const text = (release.subtitle || release.blurb || release.description || '').replace(/\s+/g, ' ').trim()
    return text
}

const AppsContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [categories, setCategories] = useState<CategoryWithApps[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'))
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')
    const [favorites, setFavorites] = useState<Set<string>>(new Set())
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(searchParams.get('view') === 'favorites')
    const [sortBy, setSortBy] = useState<SortOption>(parseSort(searchParams.get('sort')))
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(parseStatus(searchParams.get('status')))
    const [activeCount, setActiveCount] = useState<number | null>(null)
    const [removedCount, setRemovedCount] = useState<number | null>(null)

    const filtersRef = useRef({
        searchQuery,
        selectedCategory,
        sortBy,
        statusFilter,
        showFavoritesOnly,
    })
    filtersRef.current = {
        searchQuery,
        selectedCategory,
        sortBy,
        statusFilter,
        showFavoritesOnly,
    }

    const writeUrl = useCallback((overrides: {
        q?: string
        category?: string | null
        sort?: SortOption
        status?: StatusFilter
        favorites?: boolean
    } = {}) => {
        const cur = filtersRef.current
        const q = overrides.q !== undefined ? overrides.q : cur.searchQuery
        const category = overrides.category !== undefined ? overrides.category : cur.selectedCategory
        const sort = overrides.sort ?? cur.sortBy
        const status = overrides.status ?? cur.statusFilter
        const favoritesOnly = overrides.favorites !== undefined ? overrides.favorites : cur.showFavoritesOnly

        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (category) params.set('category', category)
        if (sort !== 'updated-desc') params.set('sort', sort)
        if (status !== 'active') params.set('status', status)
        if (favoritesOnly) params.set('view', 'favorites')

        const qs = params.toString()
        const next = qs ? `/dapps?${qs}` : '/dapps'
        const current = `${window.location.pathname}${window.location.search}`
        if (current !== next) {
            router.replace(next, { scroll: false })
        }
    }, [router])

    const applyCatalog = useCallback((data: any) => {
        const units = data.data?.explore?.units?.edges || []
        const categoryUnits = units
            .filter((edge: any) => edge.node.__typename === 'DAppsByCategoryUnit')
            .map((edge: any) => edge.node)

        if (categoryUnits.length === 0 || (data.totalApps ?? 0) === 0) {
            throw new Error('dApp catalog returned empty — try again in a moment')
        }

        setCategories(categoryUnits)
        setError(null)
        if (typeof data.activeCount === 'number') setActiveCount(data.activeCount)
        if (typeof data.removedCount === 'number') setRemovedCount(data.removedCount)
        try {
            // Only cache active catalog for instant paint
            if ((data.statusFilter || 'active') === 'active') {
                sessionStorage.setItem(
                    'dappstore-catalog-v3',
                    JSON.stringify({
                        ts: Date.now(),
                        totalApps: data.totalApps,
                        activeCount: data.activeCount,
                        removedCount: data.removedCount,
                        data: data.data,
                    })
                )
            }
        } catch {
            /* quota / private mode */
        }
    }, [])

    const fetchCatalog = useCallback(async (opts?: { soft?: boolean; status?: StatusFilter }) => {
        const st = opts?.status ?? statusFilter
        try {
            if (!opts?.soft) {
                setLoading(true)
                setError(null)
            }
            const qs = new URLSearchParams()
            if (st && st !== 'active') qs.set('status', st)
            const url = `/api/dappstore${qs.toString() ? `?${qs}` : ''}`
            const response = await fetch(url, {
                cache: opts?.soft ? 'no-cache' : 'default',
            })
            const data = await response.json()

            if (!response.ok || data.error) {
                throw new Error(data.detail || data.error || `Catalog failed (${response.status})`)
            }

            applyCatalog({ ...data, statusFilter: st })
        } catch (err) {
            if (!opts?.soft) {
                setError(err instanceof Error ? err.message : 'Failed to fetch apps')
            }
        } finally {
            setLoading(false)
        }
    }, [applyCatalog, statusFilter])

    // Instant paint from sessionStorage (active only), then revalidate
    useEffect(() => {
        if (statusFilter !== 'active') {
            void fetchCatalog({ status: statusFilter })
            return
        }
        try {
            const raw = sessionStorage.getItem('dappstore-catalog-v3')
                || sessionStorage.getItem('dappstore-catalog-v2')
            if (raw) {
                const parsed = JSON.parse(raw)
                if (parsed?.ts && Date.now() - parsed.ts < 6 * 60 * 60 * 1000 && parsed.data) {
                    applyCatalog({ ...parsed, statusFilter: 'active' })
                    setLoading(false)
                    void fetchCatalog({ soft: true, status: 'active' })
                    return
                }
            }
        } catch {
            /* ignore */
        }
        void fetchCatalog({ status: 'active' })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter])

    // Load favorites from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('dappstore-favorites')
        if (saved) {
            setFavorites(new Set(JSON.parse(saved)))
        }
    }, [])

    const onStatusChange = (next: StatusFilter) => {
        setStatusFilter(next)
        writeUrl({ status: next })
    }

    const selectCategory = (category: string | null) => {
        setSelectedCategory(category)
        setShowFavoritesOnly(false)
        writeUrl({ category, favorites: false })
    }

    const toggleFavoritesView = () => {
        const next = !showFavoritesOnly
        setShowFavoritesOnly(next)
        if (next) {
            setSelectedCategory(null)
            writeUrl({ favorites: true, category: null })
        } else {
            writeUrl({ favorites: false })
        }
    }

    const onSortChange = (next: SortOption) => {
        setSortBy(next)
        writeUrl({ sort: next })
    }

    const onSearchChange = (value: string) => {
        setSearchQuery(value)
        writeUrl({ q: value })
    }

    const hasActiveFilters =
        Boolean(searchQuery) ||
        Boolean(selectedCategory) ||
        showFavoritesOnly ||
        sortBy !== 'updated-desc' ||
        statusFilter !== 'active'

    const clearFilters = () => {
        setSearchQuery('')
        setSelectedCategory(null)
        setShowFavoritesOnly(false)
        setSortBy('updated-desc')
        const statusReset = statusFilter !== 'active'
        setStatusFilter('active')
        writeUrl({
            q: '',
            category: null,
            sort: 'updated-desc',
            status: 'active',
            favorites: false,
        })
        // Status change triggers a refetch via the effect; writeUrl already set status=active
        void statusReset
    }

    const toggleFavorite = (packageName: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setFavorites(prev => {
            const next = new Set(prev)
            if (next.has(packageName)) {
                next.delete(packageName)
            } else {
                next.add(packageName)
            }
            localStorage.setItem('dappstore-favorites', JSON.stringify([...next]))
            return next
        })
    }

    const uniqueListedApps = useMemo(() => {
        const seen = new Set<string>()
        categories.forEach(cat => {
            cat.dApps.edges.forEach(edge => {
                seen.add(edge.node.androidPackage)
            })
        })
        return seen.size
    }, [categories])

    // Prefer the Turso/API catalog total for the current status filter; fall
    // back to unique packages actually present in the loaded category payload.
    const trackedCount = useMemo(() => {
        if (statusFilter === 'removed' && typeof removedCount === 'number') return removedCount
        if (statusFilter === 'active' && typeof activeCount === 'number') return activeCount
        if (statusFilter === 'all' && typeof activeCount === 'number' && typeof removedCount === 'number') {
            return activeCount + removedCount
        }
        return uniqueListedApps
    }, [statusFilter, activeCount, removedCount, uniqueListedApps])

    const trackedLabel =
        statusFilter === 'removed'
            ? 'Removed apps tracked on Seeker Tracker'
            : statusFilter === 'all'
              ? 'Apps tracked on Seeker Tracker'
              : 'Active apps tracked on Seeker Tracker'

    const sortApps = useCallback((apps: CatalogApp[], sort: SortOption): CatalogApp[] => {
        return [...apps].sort((a, b) => {
            switch (sort) {
                case 'updated-desc': {
                    return dateValue(b.lastRelease?.updatedOn) - dateValue(a.lastRelease?.updatedOn)
                }
                case 'newest': {
                    const seen = dateValue(b.firstSeenAt) - dateValue(a.firstSeenAt)
                    if (seen !== 0) return seen
                    return dateValue(b.lastRelease?.updatedOn) - dateValue(a.lastRelease?.updatedOn)
                }
                case 'rating-desc': {
                    const ratingA = a.rating?.rating ?? 0
                    const ratingB = b.rating?.rating ?? 0
                    if (ratingB !== ratingA) return ratingB - ratingA
                    const nameA = a.lastRelease?.displayName?.toLowerCase() ?? ''
                    const nameB = b.lastRelease?.displayName?.toLowerCase() ?? ''
                    return nameA.localeCompare(nameB)
                }
                case 'name-asc': {
                    const nameA = a.lastRelease?.displayName?.toLowerCase() ?? ''
                    const nameB = b.lastRelease?.displayName?.toLowerCase() ?? ''
                    return nameA.localeCompare(nameB)
                }
                default:
                    return 0
            }
        })
    }, [])

    const allApps = useMemo(() => {
        const seen = new Map<string, CatalogApp>()
        categories.forEach(cat => {
            cat.dApps.edges.forEach(edge => {
                const existing = seen.get(edge.node.androidPackage)
                if (existing) {
                    if (!existing.categories.includes(cat.category.name)) {
                        existing.categories.push(cat.category.name)
                    }
                } else {
                    seen.set(edge.node.androidPackage, {
                        ...edge.node,
                        categories: [cat.category.name],
                    })
                }
            })
        })
        return Array.from(seen.values())
    }, [categories])

    const visibleApps = useMemo(() => {
        let apps = allApps
        if (showFavoritesOnly) {
            apps = apps.filter(app => favorites.has(app.androidPackage))
        }
        if (selectedCategory) {
            apps = apps.filter(app => app.categories.includes(selectedCategory))
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            apps = apps.filter(app => {
                const name = app.lastRelease?.displayName?.toLowerCase() || ''
                const publisher = app.lastRelease?.publisherDetails?.name?.toLowerCase() || ''
                const subtitle = app.lastRelease?.subtitle?.toLowerCase() || ''
                const description = app.lastRelease?.description?.toLowerCase() || ''
                const blurb = app.lastRelease?.blurb?.toLowerCase() || ''
                const packageName = app.androidPackage.toLowerCase()
                const cats = app.categories.join(' ').toLowerCase()
                return (
                    name.includes(query) ||
                    publisher.includes(query) ||
                    subtitle.includes(query) ||
                    description.includes(query) ||
                    blurb.includes(query) ||
                    packageName.includes(query) ||
                    cats.includes(query)
                )
            })
        }
        return sortApps(apps, sortBy)
    }, [allApps, showFavoritesOnly, favorites, selectedCategory, searchQuery, sortBy, sortApps])

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating)
        const hasHalf = rating - fullStars >= 0.5
        const stars = []

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={`full-${i}`} className={styles.star}>&#9733;</span>)
        }
        if (hasHalf) {
            stars.push(<span key="half" className={styles.starHalf}>&#9733;</span>)
        }
        for (let i = stars.length; i < 5; i++) {
            stars.push(<span key={`empty-${i}`} className={styles.starEmpty}>&#9733;</span>)
        }

        return stars
    }

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays}d ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
        return `${Math.floor(diffDays / 365)}y ago`
    }

    const AppCard = ({ app }: { app: CatalogApp }) => {
        const release = app.lastRelease
        if (!release) return null
        const isFavorite = favorites.has(app.androidPackage)
        const isRemoved = app.status === 'removed'
        const href = `/dapps/${encodeURIComponent(app.androidPackage)}`
        const categoryLabel = selectedCategory && app.categories.includes(selectedCategory)
            ? selectedCategory
            : app.categories[0]
        const description = appDescription(app)

        return (
            <Link
                href={href}
                className={`${styles.appCard} ${isRemoved ? styles.appCardRemoved : ''}`}
            >
                <button
                    type="button"
                    className={`${styles.favoriteBtn} ${isFavorite ? styles.favorited : ''}`}
                    onClick={(e) => toggleFavorite(app.androidPackage, e)}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    {isFavorite ? '\u2605' : '\u2606'}
                </button>
                <div className={styles.appIcon}>
                    {release.icon?.uri ? (
                        <Image
                            src={release.icon.uri}
                            alt={release.displayName}
                            width={64}
                            height={64}
                            unoptimized
                        />
                    ) : (
                        <div className={styles.placeholderIcon}>
                            {release.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className={styles.appInfo}>
                    <h3 className={styles.appName}>
                        {release.displayName}
                        {isRemoved && <span className={styles.removedBadge}>Removed</span>}
                    </h3>
                    {categoryLabel && (
                        <span className={styles.appCategory}>{categoryLabel}</span>
                    )}
                    {description && (
                        <span className={styles.subtitle}>{description}</span>
                    )}
                    <div className={styles.appMeta}>
                        {app.rating?.rating ? (
                            <div className={styles.rating}>
                                {renderStars(app.rating.rating)}
                                <span className={styles.ratingValue}>{app.rating.rating.toFixed(1)}</span>
                            </div>
                        ) : null}
                        {release.updatedOn && (
                            <span className={styles.updatedBadge}>{formatShortDate(release.updatedOn)}</span>
                        )}
                    </div>
                </div>
            </Link>
        )
    }

    const emptyTitle = showFavoritesOnly && !searchQuery
        ? 'No favorites yet'
        : searchQuery
            ? `No apps match “${searchQuery}”`
            : selectedCategory
                ? `No apps in ${selectedCategory}`
                : 'No apps to show'

    const emptyHint = showFavoritesOnly && !searchQuery
        ? 'Tap the star on any app to save it here.'
        : hasActiveFilters
            ? 'Try a different search, category, or clear the filters.'
            : 'The catalog may still be loading. Try again in a moment.'

    if (error && !categories.length) {
        return (
            <div className={styles.main}>
                <Backbutton />
                <div className={styles.error}>
                    <span className={styles.errorIcon}>!</span>
                    <span>{error}</span>
                    <button onClick={() => void fetchCatalog()} className={styles.retryBtn}>Retry</button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.main}>
            <Backbutton />

            <div className={styles.header}>
                <h1 className={styles.title}>Seeker dApp Store</h1>
                <p className={styles.description}>
                    The Solana dApp Store has {SOLANA_DAPP_STORE_OFFICIAL_APP_COUNT_FORMATTED} apps ({SOLANA_DAPP_STORE_OFFICIAL_CITATION}).
                    The figure on the right is Seeker Tracker&apos;s indexed catalog, a subset of the official store.
                </p>
                <div className={styles.headerActions}>
                    <a href="/dapps/manage" className={styles.maintainBtn}>
                        Maintain your listing
                    </a>
                    <span className={styles.maintainSub}>
                        Publishers: claim with your store support email
                    </span>
                </div>
                <div className={styles.countRow}>
                    <div className={styles.totalCount}>
                        <span className={styles.totalNumber}>
                            {SOLANA_DAPP_STORE_OFFICIAL_APP_COUNT_FORMATTED}
                        </span>
                        <span className={styles.totalLabel}>Apps on the Solana dApp Store</span>
                        <span className={styles.totalSource}>{SOLANA_DAPP_STORE_OFFICIAL_CITATION}</span>
                    </div>
                    <div className={styles.totalCount}>
                        <span className={styles.totalNumber}>
                            {loading && !trackedCount ? '—' : trackedCount.toLocaleString()}
                        </span>
                        <span className={styles.totalLabel}>{trackedLabel}</span>
                    </div>
                </div>
            </div>

            {loading && categories.length === 0 ? (
                <div className={styles.skeletonGrid} aria-busy="true" aria-label="Loading apps">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={styles.skeletonIcon} />
                            <div className={styles.skeletonLines}>
                                <div className={styles.skeletonLine} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
            <>
            <div className={styles.toolbar}>
                <div className={styles.searchAndSort}>
                    <form
                        className={styles.searchBar}
                        role="search"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <label htmlFor="dapp-search" className={styles.srOnly}>Search apps</label>
                        <input
                            id="dapp-search"
                            type="search"
                            placeholder="Search by name, publisher, or package"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={styles.searchInput}
                            aria-label="Search apps"
                            {...SEARCH_ATTRS}
                        />
                    </form>
                    <div className={styles.toolbarControls}>
                        <div className={styles.statusToggle} role="group" aria-label="App status">
                            {([
                                ['active', 'Active', activeCount],
                                ['removed', 'Removed', removedCount],
                                ['all', 'All', (activeCount != null && removedCount != null) ? activeCount + removedCount : null],
                            ] as const).map(([value, label, count]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`${styles.statusBtn} ${statusFilter === value ? styles.statusBtnActive : ''}`}
                                    onClick={() => onStatusChange(value)}
                                    aria-pressed={statusFilter === value}
                                >
                                    {label}
                                    {count != null ? ` (${count.toLocaleString()})` : ''}
                                </button>
                            ))}
                        </div>
                        <div className={styles.sortControl}>
                            <label className={styles.sortLabel} htmlFor="dapp-sort">Sort</label>
                            <select
                                id="dapp-sort"
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value as SortOption)}
                                className={styles.sortSelect}
                                aria-label="Sort apps"
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.categoryFilter} role="tablist" aria-label="Categories">
                    <button
                        type="button"
                        className={`${styles.categoryBtn} ${!selectedCategory && !showFavoritesOnly ? styles.active : ''}`}
                        onClick={() => selectCategory(null)}
                    >
                        All ({uniqueListedApps.toLocaleString()})
                    </button>
                    <button
                        type="button"
                        className={`${styles.categoryBtn} ${styles.favoritesBtn} ${showFavoritesOnly ? styles.active : ''}`}
                        onClick={toggleFavoritesView}
                    >
                        {'\u2605'} Favorites ({favorites.size})
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.category.id}
                            type="button"
                            className={`${styles.categoryBtn} ${selectedCategory === cat.category.name ? styles.active : ''}`}
                            onClick={() => selectCategory(cat.category.name)}
                        >
                            {cat.category.name} ({cat.dApps.edges.length})
                        </button>
                    ))}
                </div>

                <div className={styles.toolbarMeta}>
                    <p className={styles.resultCount} aria-live="polite">
                        Showing {visibleApps.length.toLocaleString()} of {trackedCount.toLocaleString()}
                        {selectedCategory ? ` in ${selectedCategory}` : ''}
                        {showFavoritesOnly ? ' favorites' : ''}
                        {searchQuery ? ` for “${searchQuery}”` : ''}
                    </p>
                    {hasActiveFilters && (
                        <button type="button" className={styles.clearFilters} onClick={clearFilters}>
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.searchResults}>
                {visibleApps.length > 0 ? (
                    <div className={styles.appGrid}>
                        {visibleApps.map(app => (
                            <AppCard key={app.androidPackage} app={app} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>{emptyTitle}</p>
                        <p className={styles.emptyHint}>{emptyHint}</p>
                        {hasActiveFilters && (
                            <button type="button" className={styles.clearFilters} onClick={clearFilters}>
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>
            </>
            )}

        </div>
    )
}

const Apps = () => {
    return (
        <Suspense fallback={
            <div className={styles.main}>
                <Backbutton />
                <div className={styles.header}>
                    <p className={styles.title}>Seeker dApp Store</p>
                    <p className={styles.description}>Apps for Solana Seeker</p>
                </div>
                <div className={styles.skeletonGrid} aria-busy="true">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={styles.skeletonIcon} />
                            <div className={styles.skeletonLines}>
                                <div className={styles.skeletonLine} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        }>
            <AppsContent />
        </Suspense>
    )
}

export default Apps
