import { useState, useCallback, useEffect, useRef } from 'react';
import {
    CollectionDetails,
    CollectionCategory,
} from '../../types';
import {
    discoverAllCollections,
    discoverCollectionsPage,
    searchCollections,
    getCollectionDetailsLight,
    clearCollectionsCache,
    resetSeenCollections,
    COLLECTION_GENRE_MAP,
    COLLECTION_FILTER_OPTIONS,
} from '../tmdb';
import CollectionsService from '../collectionsService';

interface CollectionsState {
    collections: CollectionDetails[];
    featuredCollection: CollectionDetails | null;
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    error: string | null;
    searchQuery: string;
    selectedFilter: string;
    hasMore: boolean;
    currentPage: number;
    totalFound: number;
}

const POPULAR_KEYWORDS = [
    'Marvel', 'Star Wars', 'Harry Potter', 'Lord of the Rings', 'Avengers',
    'Spider-Man', 'Fast', 'Transformers', 'Pirates', 'Jurassic',
    'Mission', 'John Wick', 'Batman', 'X-Men', 'Terminator',
];

export function useCollections() {
    const [state, setState] = useState<CollectionsState>({
        collections: [],
        featuredCollection: null,
        isLoading: true,
        isLoadingMore: false,
        isRefreshing: false,
        error: null,
        searchQuery: '',
        selectedFilter: 'all',
        hasMore: true,
        currentPage: 5, // We already fetched pages 1-5 in initial load
        totalFound: 0,
    });

    const heroRotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFetchingRef = useRef(false);

    // Pick a featured collection (prefer popular ones)
    const selectFeatured = useCallback((collections: CollectionDetails[], excludeId?: number) => {
        if (collections.length === 0) return null;
        const popular = collections.filter(c =>
            POPULAR_KEYWORDS.some(kw => c.name.toLowerCase().includes(kw.toLowerCase()))
        );
        const pool = popular.length >= 3 ? popular : collections;
        const filtered = excludeId ? pool.filter(c => c.id !== excludeId) : pool;
        const candidates = filtered.length > 0 ? filtered : pool;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }, []);

    // Hero rotation
    const startHeroRotation = useCallback((collections: CollectionDetails[]) => {
        if (heroRotationRef.current) clearInterval(heroRotationRef.current);
        heroRotationRef.current = setInterval(() => {
            setState(prev => ({
                ...prev,
                featuredCollection: selectFeatured(collections, prev.featuredCollection?.id),
            }));
        }, 6000);
    }, [selectFeatured]);

    const stopHeroRotation = useCallback(() => {
        if (heroRotationRef.current) {
            clearInterval(heroRotationRef.current);
            heroRotationRef.current = null;
        }
    }, []);

    // Initial load — fetches first 5 pages of popular movies
    const fetchInitial = useCallback(async (forceRefresh = false) => {
        setState(prev => ({
            ...prev,
            isLoading: !forceRefresh,
            isRefreshing: forceRefresh,
            error: null,
        }));

        if (forceRefresh) {
            clearCollectionsCache();
            resetSeenCollections();
        }

        try {
            const discovered = await discoverAllCollections(200, forceRefresh);
            if (discovered.length === 0) throw new Error('No collections found. Check your connection.');

            const enhanced = await CollectionsService.enhanceCollectionsWithProgress(discovered);
            const featured = selectFeatured(enhanced);

            setState(prev => ({
                ...prev,
                collections: enhanced,
                featuredCollection: featured,
                isLoading: false,
                isRefreshing: false,
                hasMore: true,
                currentPage: 5,
                totalFound: enhanced.length,
            }));

            startHeroRotation(enhanced);
        } catch (err: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                isRefreshing: false,
                error: err?.message || 'Failed to load collections.',
            }));
        }
    }, [selectFeatured, startHeroRotation]);

    // Load more — infinite scroll, fetches next page of movies
    const loadMore = useCallback(async () => {
        if (isFetchingRef.current) return;

        setState(prev => {
            if (!prev.hasMore || prev.isLoadingMore || prev.searchQuery.length > 0) return prev;
            return { ...prev, isLoadingMore: true };
        });

        isFetchingRef.current = true;

        try {
            const currentState = state;
            if (!currentState.hasMore || currentState.searchQuery.length > 0) {
                isFetchingRef.current = false;
                return;
            }

            const nextPage = currentState.currentPage + 1;
            const genreId = currentState.selectedFilter !== 'all'
                ? COLLECTION_GENRE_MAP[currentState.selectedFilter]
                : undefined;

            const result = await discoverCollectionsPage(nextPage, genreId);
            const enhanced = await CollectionsService.enhanceCollectionsWithProgress(result.collections);

            setState(prev => {
                // Deduplicate against existing
                const existingIds = new Set(prev.collections.map(c => c.id));
                const newCollections = enhanced.filter(c => !existingIds.has(c.id));

                return {
                    ...prev,
                    collections: [...prev.collections, ...newCollections],
                    isLoadingMore: false,
                    hasMore: result.hasMore,
                    currentPage: nextPage,
                    totalFound: prev.totalFound + newCollections.length,
                };
            });
        } catch (err) {
            setState(prev => ({ ...prev, isLoadingMore: false }));
        } finally {
            isFetchingRef.current = false;
        }
    }, [state.currentPage, state.hasMore, state.selectedFilter, state.searchQuery]);

    // Genre filter change — resets and fetches genre-specific collections
    const setSelectedFilter = useCallback(async (filterId: string) => {
        setState(prev => ({
            ...prev,
            selectedFilter: filterId,
            isLoading: true,
            collections: [],
            hasMore: true,
            currentPage: 0,
            totalFound: 0,
        }));

        resetSeenCollections();

        try {
            const genreId = filterId !== 'all' ? COLLECTION_GENRE_MAP[filterId] : undefined;

            // Fetch first 5 pages for the selected genre in parallel
            const pages = [1, 2, 3, 4, 5];
            const pageResults = await Promise.all(
                pages.map(p => discoverCollectionsPage(p, genreId))
            );

            const allCollections: CollectionDetails[] = [];
            const idSet = new Set<number>();
            for (const result of pageResults) {
                for (const col of result.collections) {
                    if (!idSet.has(col.id)) {
                        idSet.add(col.id);
                        allCollections.push(col);
                    }
                }
            }

            const enhanced = await CollectionsService.enhanceCollectionsWithProgress(allCollections);
            const featured = selectFeatured(enhanced);

            setState(prev => ({
                ...prev,
                collections: enhanced,
                featuredCollection: featured || prev.featuredCollection,
                isLoading: false,
                hasMore: pageResults.some(r => r.hasMore),
                currentPage: 5,
                totalFound: enhanced.length,
            }));
        } catch (err: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err?.message || 'Failed to load collections.',
            }));
        }
    }, [selectFeatured]);

    // Search — uses TMDB /search/collection endpoint
    const handleSearch = useCallback((query: string) => {
        setState(prev => ({ ...prev, searchQuery: query }));

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!query.trim()) {
            // Reset to current filter view
            searchTimeoutRef.current = setTimeout(() => {
                setSelectedFilter(state.selectedFilter);
            }, 200);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setState(prev => ({ ...prev, isLoading: true }));
            try {
                // Search across multiple pages for more results
                const [page1, page2, page3] = await Promise.all([
                    searchCollections(query, 1),
                    searchCollections(query, 2),
                    searchCollections(query, 3),
                ]);

                const allResults = [
                    ...(page1?.results || []),
                    ...(page2?.results || []),
                    ...(page3?.results || []),
                ];

                // Deduplicate
                const uniqueIds = new Set<number>();
                const unique = allResults.filter(c => {
                    if (uniqueIds.has(c.id)) return false;
                    uniqueIds.add(c.id);
                    return true;
                });

                // Fetch lightweight details for each collection (parallel, batched)
                const BATCH = 10;
                const detailed: CollectionDetails[] = [];
                for (let i = 0; i < unique.length; i += BATCH) {
                    const batch = unique.slice(i, i + BATCH);
                    const results = await Promise.all(
                        batch.map(c => getCollectionDetailsLight(c.id))
                    );
                    for (const col of results) {
                        if (col && col.film_count >= 2) detailed.push(col);
                    }
                }

                setState(prev => ({
                    ...prev,
                    collections: detailed,
                    isLoading: false,
                    hasMore: false,
                    totalFound: detailed.length,
                }));
            } catch {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        }, 400);
    }, [state.selectedFilter, setSelectedFilter]);

    const rotateFeatured = useCallback(() => {
        setState(prev => ({
            ...prev,
            featuredCollection: selectFeatured(prev.collections, prev.featuredCollection?.id),
        }));
    }, [selectFeatured]);

    // Init
    useEffect(() => {
        fetchInitial();
        return () => {
            stopHeroRotation();
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    return {
        ...state,
        filterOptions: COLLECTION_FILTER_OPTIONS,
        fetchCollections: fetchInitial,
        loadMore,
        handleSearch,
        setSelectedFilter,
        stopHeroRotation,
        rotateFeatured,
    };
}
