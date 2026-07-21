"use client"

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import Image from 'next/image'
import Backbutton from 'app/(components)/shared/Backbutton'

interface DApp {
    androidPackage: string
    status?: 'active' | 'removed' | string
    removedAt?: string | null
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

const INITIAL_VISIBLE = 6

type SortOption = 'updated-desc' | 'updated-asc' | 'rating-desc' | 'name-asc' | 'category'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'updated-desc', label: 'Recently Updated' },
    { value: 'rating-desc', label: 'Highest Rated' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'updated-asc', label: 'Oldest Updated' },
    { value: 'category', label: 'By Category' },
]

const AppsContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [categories, setCategories] = useState<CategoryWithApps[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'))
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [favorites, setFavorites] = useState<Set<string>>(new Set())
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(searchParams.get('view') === 'favorites')
    const [sortBy, setSortBy] = useState<SortOption>('updated-desc')
    type StatusFilter = 'active' | 'removed' | 'all'
    const initialStatus = (searchParams.get('status') as StatusFilter) || 'active'
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(
        initialStatus === 'removed' || initialStatus === 'all' ? initialStatus : 'active'
    )
    const [activeCount, setActiveCount] = useState<number | null>(null)
    const [removedCount, setRemovedCount] = useState<number | null>(null)

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
                    'dappstore-catalog-v1',
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
            const raw = sessionStorage.getItem('dappstore-catalog-v1')
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

    const onStatusChange = (next: StatusFilter) => {
        setStatusFilter(next)
        setShowFavoritesOnly(false)
        setSelectedCategory(null)
        const params = new URLSearchParams()
        if (next !== 'active') params.set('status', next)
        router.push(params.toString() ? `/apps?${params}` : '/apps', { scroll: false })
    }

    // Load favorites from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('dappstore-favorites')
        if (saved) {
            setFavorites(new Set(JSON.parse(saved)))
        }
    }, [])

    const selectCategory = useCallback((category: string | null) => {
        setSelectedCategory(category)
        setShowFavoritesOnly(false)
        if (category) {
            router.push(`/apps?category=${encodeURIComponent(category)}`, { scroll: false })
        } else {
            router.push('/apps', { scroll: false })
        }
    }, [router])



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

    const totalApps = useMemo(() => {
        const seen = new Set<string>()
        categories.forEach(cat => {
            cat.dApps.edges.forEach(edge => {
                seen.add(edge.node.androidPackage)
            })
        })
        return seen.size
    }, [categories])

    // Get all unique apps for filtering
    const sortApps = useCallback((apps: DApp[], sort: SortOption): DApp[] => {
        if (sort === 'category') return apps

        return [...apps].sort((a, b) => {
            switch (sort) {
                case 'updated-desc': {
                    const dateA = a.lastRelease?.updatedOn ? new Date(a.lastRelease.updatedOn).getTime() : 0
                    const dateB = b.lastRelease?.updatedOn ? new Date(b.lastRelease.updatedOn).getTime() : 0
                    return dateB - dateA
                }
                case 'updated-asc': {
                    const dateA = a.lastRelease?.updatedOn ? new Date(a.lastRelease.updatedOn).getTime() : 0
                    const dateB = b.lastRelease?.updatedOn ? new Date(b.lastRelease.updatedOn).getTime() : 0
                    return dateA - dateB
                }
                case 'rating-desc': {
                    const ratingA = a.rating?.rating ?? 0
                    const ratingB = b.rating?.rating ?? 0
                    return ratingB - ratingA
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
        const seen = new Map<string, DApp>()
        categories.forEach(cat => {
            cat.dApps.edges.forEach(edge => {
                if (!seen.has(edge.node.androidPackage)) {
                    seen.set(edge.node.androidPackage, edge.node)
                }
            })
        })
        return Array.from(seen.values())
    }, [categories])

    const sortedAllApps = useMemo(() => {
        return sortApps(allApps, sortBy)
    }, [allApps, sortBy, sortApps])

    // Filter apps based on search query
    const filteredApps = useMemo(() => {
        if (!searchQuery.trim()) return []
        const query = searchQuery.toLowerCase()
        const filtered = sortedAllApps.filter(app => {
            const name = app.lastRelease?.displayName?.toLowerCase() || ''
            const publisher = app.lastRelease?.publisherDetails?.name?.toLowerCase() || ''
            const subtitle = app.lastRelease?.subtitle?.toLowerCase() || ''
            const packageName = app.androidPackage.toLowerCase()
            return name.includes(query) || publisher.includes(query) || subtitle.includes(query) || packageName.includes(query)
        })
        return filtered
    }, [sortedAllApps, searchQuery])

    const toggleExpanded = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(categoryId)) {
                next.delete(categoryId)
            } else {
                next.add(categoryId)
            }
            return next
        })
    }

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

    const AppCard = ({ app }: { app: DApp }) => {
        const release = app.lastRelease
        if (!release) return null
        const isFavorite = favorites.has(app.androidPackage)
        const isRemoved = app.status === 'removed'
        const href = `/apps/${encodeURIComponent(app.androidPackage)}`

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
                    {release.subtitle && (
                        <span className={styles.subtitle}>{release.subtitle}</span>
                    )}
                    <div className={styles.appMeta}>
                        {app.rating?.rating && (
                            <div className={styles.rating}>
                                {renderStars(app.rating.rating)}
                                <span className={styles.ratingValue}>{app.rating.rating.toFixed(1)}</span>
                            </div>
                        )}
                        {release.updatedOn && (
                            <span className={styles.updatedBadge}>{formatShortDate(release.updatedOn)}</span>
                        )}
                    </div>
                </div>
            </Link>
        )
    }

    // Get all favorite apps across categories
    const favoriteApps = useMemo(() => {
        if (!showFavoritesOnly) return []
        return sortedAllApps.filter(app => favorites.has(app.androidPackage))
    }, [sortedAllApps, favorites, showFavoritesOnly])

    const filteredCategories = selectedCategory
        ? categories.filter(cat => cat.category.name === selectedCategory)
        : categories

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
                    Apps for Solana Seeker — browse, favorite, and open each dApp page.
                </p>
                <div className={styles.headerActions}>
                    <a href="/apps/manage" className={styles.maintainBtn}>
                        Maintain your listing
                    </a>
                    <span className={styles.maintainSub}>
                        Publishers: claim with your store support email
                    </span>
                </div>
                <div className={styles.totalCount}>
                    <span className={styles.totalNumber}>
                        {loading && !totalApps ? '—' : totalApps}
                    </span>
                    <span className={styles.totalLabel}>
                        {statusFilter === 'removed'
                            ? 'Removed apps'
                            : statusFilter === 'all'
                              ? 'All apps'
                              : 'Active apps'}
                    </span>
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
            <div className={styles.searchAndSort}>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Filter apps..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.sortControl}>
                    <label className={styles.sortLabel}>Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
                        className={styles.sortSelect}
                        aria-label="App status filter"
                    >
                        <option value="active">
                            Active{activeCount != null ? ` (${activeCount})` : ''}
                        </option>
                        <option value="removed">
                            Removed{removedCount != null ? ` (${removedCount})` : ''}
                        </option>
                        <option value="all">All</option>
                    </select>
                </div>
                <div className={styles.sortControl}>
                    <label className={styles.sortLabel}>Sort:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className={styles.sortSelect}
                    >
                        {SORT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.categoryFilter}>
                <button
                    className={`${styles.categoryBtn} ${!selectedCategory && !showFavoritesOnly ? styles.active : ''}`}
                    onClick={() => selectCategory(null)}
                >
                    All
                </button>
                <button
                    className={`${styles.categoryBtn} ${styles.favoritesBtn} ${showFavoritesOnly ? styles.active : ''}`}
                    onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setSelectedCategory(null); router.push(!showFavoritesOnly ? '/apps?view=favorites' : '/apps', { scroll: false }); }}
                >
                    {'\u2605'} Favorites ({favorites.size})
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.category.id}
                        className={`${styles.categoryBtn} ${selectedCategory === cat.category.name ? styles.active : ''}`}
                        onClick={() => selectCategory(cat.category.name)}
                    >
                        {cat.category.name} ({cat.dApps.edges.length})
                    </button>
                ))}
            </div>

            {showFavoritesOnly ? (
                <div className={styles.searchResults}>
                    <h2 className={styles.sectionTitle}>
                        Your Favorites
                        <span className={styles.appCount}>({favoriteApps.length} apps)</span>
                    </h2>
                    {favoriteApps.length > 0 ? (
                        <div className={styles.appGrid}>
                            {favoriteApps.map(app => (
                                <AppCard key={app.androidPackage} app={app} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noResults}>No favorites yet. Click the star on any app to add it!</div>
                    )}
                </div>
            ) : searchQuery.trim() ? (
                <div className={styles.searchResults}>
                    <h2 className={styles.sectionTitle}>
                        Results for &quot;{searchQuery}&quot;
                        <span className={styles.appCount}>({filteredApps.length} apps)</span>
                    </h2>
                    {filteredApps.length > 0 ? (
                        <div className={styles.appGrid}>
                            {filteredApps.map(app => (
                                <AppCard key={app.androidPackage} app={app} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noResults}>No apps found</div>
                    )}
                </div>
            ) : sortBy !== 'category' ? (
                <div className={styles.searchResults}>
                    <h2 className={styles.sectionTitle}>
                        All Apps
                        <span className={styles.appCount}>
                            ({sortedAllApps.length} apps, sorted by {SORT_OPTIONS.find(o => o.value === sortBy)?.label})
                        </span>
                    </h2>
                    <div className={styles.appGrid}>
                        {sortedAllApps.map(app => (
                            <AppCard key={app.androidPackage} app={app} />
                        ))}
                    </div>
                </div>
            ) : (
            <div className={styles.catalog}>
                {filteredCategories.map(categoryUnit => {
                    const isExpanded = expandedCategories.has(categoryUnit.category.id)
                    const categoryApps = categoryUnit.dApps.edges
                    const visibleApps = isExpanded ? categoryApps : categoryApps.slice(0, INITIAL_VISIBLE)
                    const hasMore = categoryApps.length > INITIAL_VISIBLE

                    return (
                        <div key={categoryUnit.category.id} className={styles.categorySection}>
                            <h2 className={styles.sectionTitle}>
                                {categoryUnit.category.name}
                                <span className={styles.appCount}>
                                    ({categoryApps.length} apps)
                                </span>
                            </h2>
                            <div className={styles.appGrid}>
                                {visibleApps.map(edge => (
                                    <AppCard key={edge.node.androidPackage} app={edge.node} />
                                ))}
                            </div>
                            {hasMore && (
                                <button
                                    className={styles.showMoreBtn}
                                    onClick={() => toggleExpanded(categoryUnit.category.id)}
                                >
                                    {isExpanded
                                        ? 'Show Less'
                                        : `Show ${categoryApps.length - INITIAL_VISIBLE} More`
                                    }
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
            )}
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
                    <h1 className={styles.title}>Seeker dApp Store</h1>
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
