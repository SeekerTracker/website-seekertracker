"use client"

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './page.module.css'
import Image from 'next/image'
import Backbutton from 'app/(components)/shared/Backbutton'

interface DApp {
    androidPackage: string
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
        }
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
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedApp, setSelectedApp] = useState<DApp | null>(null)
    const [favorites, setFavorites] = useState<Set<string>>(new Set())
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
    const [sortBy, setSortBy] = useState<SortOption>('updated-desc')

    const fetchCatalog = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/dappstore')

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            const units = data.data?.explore?.units?.edges || []
            const categoryUnits = units
                .filter((edge: any) => edge.node.__typename === 'DAppsByCategoryUnit')
                .map((edge: any) => edge.node)

            setCategories(categoryUnits)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch apps')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCatalog()
    }, [fetchCatalog])

    // Load favorites from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('dappstore-favorites')
        if (saved) {
            setFavorites(new Set(JSON.parse(saved)))
        }
    }, [])

    // Handle app selection with URL update
    const selectApp = useCallback((app: DApp | null) => {
        setSelectedApp(app)
        if (app) {
            router.push(`/apps?app=${encodeURIComponent(app.androidPackage)}`, { scroll: false })
        } else {
            router.push('/apps', { scroll: false })
        }
    }, [router])

    // Open app from URL param after data loads
    useEffect(() => {
        const appParam = searchParams.get('app')
        if (appParam && categories.length > 0 && !selectedApp) {
            // Find the app in categories
            for (const cat of categories) {
                const found = cat.dApps.edges.find(edge => edge.node.androidPackage === appParam)
                if (found) {
                    setSelectedApp(found.node)
                    break
                }
            }
        }
    }, [searchParams, categories, selectedApp])

    const toggleFavorite = (packageName: string, e: React.MouseEvent) => {
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

        return (
            <div className={styles.appCard} onClick={() => selectApp(app)}>
                <button
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
                    <h3 className={styles.appName}>{release.displayName}</h3>
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
            </div>
        )
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const getTotalReviews = (reviewsByRating?: number[]) => {
        if (!reviewsByRating) return 0
        return reviewsByRating.reduce((sum, count) => sum + count, 0)
    }

    const AppModal = ({ app, onClose }: { app: DApp; onClose: () => void }) => {
        const release = app.lastRelease
        if (!release) return null

        const totalReviews = getTotalReviews(app.rating?.reviewsByRating)

        return (
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modal} onClick={e => e.stopPropagation()}>
                    <button className={styles.modalClose} onClick={onClose}>&times;</button>
                    <div className={styles.modalHeader}>
                        <div className={styles.modalIcon}>
                            {release.icon?.uri ? (
                                <Image
                                    src={release.icon.uri}
                                    alt={release.displayName}
                                    width={80}
                                    height={80}
                                    unoptimized
                                />
                            ) : (
                                <div className={styles.placeholderIcon}>
                                    {release.displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className={styles.modalTitleArea}>
                            <h2 className={styles.modalTitle}>{release.displayName}</h2>
                            {release.publisherDetails?.name && (
                                <span className={styles.modalPublisher}>{release.publisherDetails.name}</span>
                            )}
                            {app.rating?.rating && (
                                <div className={styles.modalRating}>
                                    {renderStars(app.rating.rating)}
                                    <span className={styles.ratingValue}>
                                        {app.rating.rating.toFixed(1)}
                                        {totalReviews > 0 && ` (${totalReviews.toLocaleString()} reviews)`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    {release.subtitle && (
                        <p className={styles.modalSubtitle}>{release.subtitle}</p>
                    )}

                    {release.description && (
                        <div className={styles.modalDescription}>
                            <h3 className={styles.modalSectionTitle}>About</h3>
                            <p className={styles.descriptionText}>{release.description}</p>
                        </div>
                    )}

                    {release.newInVersion && (
                        <div className={styles.modalWhatsNew}>
                            <h3 className={styles.modalSectionTitle}>What&apos;s New</h3>
                            <p className={styles.whatsNewText}>{release.newInVersion}</p>
                        </div>
                    )}

                    <div className={styles.modalDetails}>
                        <h3 className={styles.modalSectionTitle}>App Info</h3>

                        {release.updatedOn && (
                            <div className={styles.modalDetail}>
                                <span className={styles.detailLabel}>Last Updated</span>
                                <span className={styles.detailValue}>{formatDate(release.updatedOn)}</span>
                            </div>
                        )}

                        {release.androidDetails?.version && (
                            <div className={styles.modalDetail}>
                                <span className={styles.detailLabel}>Version</span>
                                <span className={styles.detailValue}>
                                    {release.androidDetails.version}
                                    {release.androidDetails.versionCode && ` (${release.androidDetails.versionCode})`}
                                </span>
                            </div>
                        )}

                        {release.androidDetails?.minSdk && (
                            <div className={styles.modalDetail}>
                                <span className={styles.detailLabel}>Min Android SDK</span>
                                <span className={styles.detailValue}>{release.androidDetails.minSdk}</span>
                            </div>
                        )}

                        <div className={styles.modalDetail}>
                            <span className={styles.detailLabel}>Package</span>
                            <span className={styles.detailValue}>{app.androidPackage}</span>
                        </div>
                    </div>

                    <div className={styles.shareSection}>
                        <h3 className={styles.modalSectionTitle}>Share</h3>
                        <div className={styles.shareButtons}>
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${release.displayName} on Solana Seeker dApp Store!`)}&url=${encodeURIComponent(`https://seekertracker.com/apps/${encodeURIComponent(app.androidPackage)}`)}&via=SeekerTracker`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.shareBtn}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Share on X
                            </a>
                            <a
                                href={`https://t.me/share/url?url=${encodeURIComponent(`https://seekertracker.com/apps/${encodeURIComponent(app.androidPackage)}`)}&text=${encodeURIComponent(`Check out ${release.displayName} on Solana Seeker dApp Store!`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.shareBtn}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                                </svg>
                                Share on Telegram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
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

    if (loading) {
        return (
            <div className={styles.main}>
                <Backbutton />
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Loading dApp Store...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.main}>
                <Backbutton />
                <div className={styles.error}>
                    <span className={styles.errorIcon}>!</span>
                    <span>{error}</span>
                    <button onClick={fetchCatalog} className={styles.retryBtn}>Retry</button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.main}>
            <Backbutton />

            <div className={styles.header}>
                <h1 className={styles.title}>Seeker dApp Store</h1>
                <p className={styles.description}>Discover apps optimized for Solana Seeker</p>
                <div className={styles.totalCount}>
                    <span className={styles.totalNumber}>{totalApps}</span>
                    <span className={styles.totalLabel}>Total Apps</span>
                </div>
            </div>

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
                    onClick={() => { setSelectedCategory(null); setShowFavoritesOnly(false); }}
                >
                    All
                </button>
                <button
                    className={`${styles.categoryBtn} ${styles.favoritesBtn} ${showFavoritesOnly ? styles.active : ''}`}
                    onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setSelectedCategory(null); }}
                >
                    {'\u2605'} Favorites ({favorites.size})
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.category.id}
                        className={`${styles.categoryBtn} ${selectedCategory === cat.category.name ? styles.active : ''}`}
                        onClick={() => setSelectedCategory(cat.category.name)}
                    >
                        {cat.category.name}
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

            {selectedApp && (
                <AppModal app={selectedApp} onClose={() => selectApp(null)} />
            )}
        </div>
    )
}

const Apps = () => {
    return (
        <Suspense fallback={
            <div className={styles.main}>
                <Backbutton />
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Loading dApp Store...</span>
                </div>
            </div>
        }>
            <AppsContent />
        </Suspense>
    )
}

export default Apps
