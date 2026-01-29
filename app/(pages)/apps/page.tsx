"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
        icon?: {
            uri: string
        }
        publisherDetails?: {
            name: string
            website?: string
        }
        androidDetails?: {
            version: string
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

const Apps = () => {
    const [categories, setCategories] = useState<CategoryWithApps[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedApp, setSelectedApp] = useState<DApp | null>(null)
    const [favorites, setFavorites] = useState<Set<string>>(new Set())
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

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

    // Filter apps based on search query
    const filteredApps = useMemo(() => {
        if (!searchQuery.trim()) return []
        const query = searchQuery.toLowerCase()
        return allApps.filter(app => {
            const name = app.lastRelease?.displayName?.toLowerCase() || ''
            const publisher = app.lastRelease?.publisherDetails?.name?.toLowerCase() || ''
            const subtitle = app.lastRelease?.subtitle?.toLowerCase() || ''
            const packageName = app.androidPackage.toLowerCase()
            return name.includes(query) || publisher.includes(query) || subtitle.includes(query) || packageName.includes(query)
        })
    }, [allApps, searchQuery])

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

    const AppCard = ({ app }: { app: DApp }) => {
        const release = app.lastRelease
        if (!release) return null
        const isFavorite = favorites.has(app.androidPackage)

        return (
            <div className={styles.appCard} onClick={() => setSelectedApp(app)}>
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
                    {release.publisherDetails?.name && (
                        <span className={styles.publisher}>{release.publisherDetails.name}</span>
                    )}
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
                    </div>
                </div>
            </div>
        )
    }

    const AppModal = ({ app, onClose }: { app: DApp; onClose: () => void }) => {
        const release = app.lastRelease
        if (!release) return null

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
                                    <span className={styles.ratingValue}>{app.rating.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {release.subtitle && (
                        <p className={styles.modalSubtitle}>{release.subtitle}</p>
                    )}
                    <div className={styles.modalDetails}>
                        <div className={styles.modalDetail}>
                            <span className={styles.detailLabel}>Package</span>
                            <span className={styles.detailValue}>{app.androidPackage}</span>
                        </div>
                        {release.androidDetails?.version && (
                            <div className={styles.modalDetail}>
                                <span className={styles.detailLabel}>Version</span>
                                <span className={styles.detailValue}>{release.androidDetails.version}</span>
                            </div>
                        )}
                        {release.publisherDetails?.website && (
                            <div className={styles.modalDetail}>
                                <span className={styles.detailLabel}>Website</span>
                                <a
                                    href={release.publisherDetails.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.detailLink}
                                >
                                    {release.publisherDetails.website}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Get all favorite apps across categories
    const favoriteApps = useMemo(() => {
        if (!showFavoritesOnly) return []
        return allApps.filter(app => favorites.has(app.androidPackage))
    }, [allApps, favorites, showFavoritesOnly])

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

            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Filter apps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
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
            ) : (
            <div className={styles.catalog}>
                {filteredCategories.map(categoryUnit => {
                    const isExpanded = expandedCategories.has(categoryUnit.category.id)
                    const allApps = categoryUnit.dApps.edges
                    const visibleApps = isExpanded ? allApps : allApps.slice(0, INITIAL_VISIBLE)
                    const hasMore = allApps.length > INITIAL_VISIBLE

                    return (
                        <div key={categoryUnit.category.id} className={styles.categorySection}>
                            <h2 className={styles.sectionTitle}>
                                {categoryUnit.category.name}
                                <span className={styles.appCount}>
                                    ({allApps.length} apps)
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
                                        : `Show ${allApps.length - INITIAL_VISIBLE} More`
                                    }
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
            )}

            {selectedApp && (
                <AppModal app={selectedApp} onClose={() => setSelectedApp(null)} />
            )}
        </div>
    )
}

export default Apps
