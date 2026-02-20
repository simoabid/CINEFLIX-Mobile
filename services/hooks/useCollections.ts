import { useState, useCallback, useEffect, useRef } from 'react';
import {
    CollectionDetails,
    CollectionCategory,
} from '../../types';
import {
    discoverAllCollections,
    getCollectionsByCategory,
    getCollectionStats,
    getCachedCollections,
    clearCollectionsCache,
} from '../tmdb';
import CollectionsService from '../collectionsService';

interface CollectionsState {
    collections: CollectionDetails[];
    allCollections: CollectionDetails[];
    categories: CollectionCategory[];
    featuredCollection: CollectionDetails | null;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    searchQuery: string;
    selectedCategory: string;
    stats: any | null;
    discoveryProgress: { scanned: number; found: number; step: string };
}

const CATEGORY_DEFINITIONS = [
    { id: 'popular', name: 'Popular Franchises', key: 'popular', icon: 'crown' },
    { id: 'complete', name: 'Complete Series', key: 'complete', icon: 'check' },
    { id: 'trilogies', name: 'Trilogies', key: 'trilogies', icon: 'three' },
    { id: 'extended', name: 'Extended Universes', key: 'extended', icon: 'infinity' },
    { id: 'superhero', name: 'Superhero Universes', key: 'superhero', icon: 'zap' },
    { id: 'action', name: 'Action Franchises', key: 'action', icon: 'bomb' },
];

const POPULAR_KEYWORDS = [
    'Marvel', 'Star Wars', 'Harry Potter', 'Lord of the Rings', 'Avengers',
    'Spider-Man', 'Fast', 'Transformers', 'Pirates', 'Jurassic',
    'Mission', 'John Wick', 'Batman', 'X-Men', 'Terminator', 'Alien', 'Indiana Jones',
];

function getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
        popular: 'Most-watched series on the platform',
        complete: 'Full franchises ready to binge',
        trilogies: 'Perfect three-film series',
        extended: 'Epic multi-film sagas',
        superhero: 'Marvel, DC and more hero franchises',
        action: 'High-octane movie series',
    };
    return descriptions[categoryId] || 'Great movie collections';
}

export function useCollections() {
    const [state, setState] = useState<CollectionsState>({
        collections: [],
        allCollections: [],
        categories: [],
        featuredCollection: null,
        isLoading: true,
        isRefreshing: false,
        error: null,
        searchQuery: '',
        selectedCategory: 'all',
        stats: null,
        discoveryProgress: { scanned: 0, found: 0, step: 'Initializing...' },
    });

    const heroRotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Select random featured collection (bias toward popular)
    const selectFeatured = useCallback((collections: CollectionDetails[], currentId?: number) => {
        if (collections.length === 0) return null;
        const popular = collections.filter(c =>
            POPULAR_KEYWORDS.some(kw => c.name.toLowerCase().includes(kw.toLowerCase()))
        );
        const candidates = popular.length >= 5 ? popular : collections;
        const filtered = currentId ? candidates.filter(c => c.id !== currentId) : candidates;
        const pool = filtered.length > 0 ? filtered : candidates;
        return pool[Math.floor(Math.random() * pool.length)];
    }, []);

    // Start hero rotation
    const startHeroRotation = useCallback((collections: CollectionDetails[]) => {
        if (heroRotationRef.current) clearInterval(heroRotationRef.current);
        heroRotationRef.current = setInterval(() => {
            setState(prev => ({
                ...prev,
                featuredCollection: selectFeatured(collections, prev.featuredCollection?.id),
            }));
        }, 5000);
    }, [selectFeatured]);

    // Stop hero rotation
    const stopHeroRotation = useCallback(() => {
        if (heroRotationRef.current) {
            clearInterval(heroRotationRef.current);
            heroRotationRef.current = null;
        }
    }, []);

    // Organize categories from collections
    const organizeCategories = useCallback(async (collections: CollectionDetails[]) => {
        const continueWatching = await CollectionsService.getContinueWatching(collections);
        const recommended = await CollectionsService.getRecommendedCollections(collections);

        const categoryPromises = CATEGORY_DEFINITIONS.map(async (cat) => {
            try {
                const categoryCollections = await getCollectionsByCategory(cat.key);
                return {
                    id: cat.id,
                    name: cat.name,
                    description: getCategoryDescription(cat.id),
                    collections: categoryCollections,
                    icon: cat.icon,
                };
            } catch {
                return { id: cat.id, name: cat.name, description: getCategoryDescription(cat.id), collections: [] as CollectionDetails[], icon: cat.icon };
            }
        });

        const dynamicCategories = await Promise.all(categoryPromises);

        const specialCategories: CollectionCategory[] = [
            {
                id: 'continue',
                name: 'Continue Watching',
                description: 'Pick up where you left off',
                collections: continueWatching,
                icon: 'play',
            },
            {
                id: 'recommended',
                name: 'Recommended for You',
                description: 'Based on your viewing history',
                collections: recommended,
                icon: 'star',
            },
            {
                id: 'recent',
                name: 'Recently Updated',
                description: 'Franchises with new releases',
                collections: collections.filter(c => {
                    const latestYear = Math.max(...c.parts.map(film =>
                        new Date(film.release_date || '').getFullYear()
                    ));
                    return latestYear >= new Date().getFullYear() - 2;
                }).slice(0, 10),
                icon: 'clock',
            },
            {
                id: 'scifi',
                name: 'Sci-Fi Universes',
                description: 'Space operas and futuristic franchises',
                collections: collections.filter(c =>
                    c.genre_categories.includes('Science Fiction') ||
                    ['Star Wars', 'Star Trek', 'Matrix', 'Alien', 'Terminator'].some(kw => c.name.includes(kw))
                ).slice(0, 8),
                icon: 'rocket',
            },
            {
                id: 'fantasy',
                name: 'Fantasy Epics',
                description: 'Magical worlds and adventures',
                collections: collections.filter(c =>
                    c.genre_categories.includes('Fantasy') ||
                    ['Lord of the Rings', 'Harry Potter', 'Chronicles', 'Hobbit'].some(kw => c.name.includes(kw))
                ).slice(0, 8),
                icon: 'wand',
            },
        ];

        return [...specialCategories, ...dynamicCategories].filter(cat => cat.collections.length > 0);
    }, []);

    // Fetch collections
    const fetchCollections = useCallback(async (forceRefresh = false) => {
        setState(prev => ({
            ...prev,
            isLoading: !forceRefresh,
            isRefreshing: forceRefresh,
            error: null,
            discoveryProgress: { scanned: 0, found: 0, step: forceRefresh ? 'Starting fresh discovery...' : 'Loading collections...' },
        }));

        if (forceRefresh) clearCollectionsCache();

        try {
            const progressCallback = (progress: { scanned: number; found: number; step: string }) => {
                setState(prev => ({ ...prev, discoveryProgress: progress }));
            };

            const discovered = await discoverAllCollections(200, forceRefresh, progressCallback);
            if (discovered.length === 0) throw new Error('No collections found. Check your connection.');

            const enhanced = await CollectionsService.enhanceCollectionsWithProgress(discovered);
            const categories = await organizeCategories(enhanced);
            const featured = selectFeatured(enhanced);

            // Fetch stats (non-blocking)
            let stats = null;
            try { stats = await getCollectionStats(); } catch { /* ignore */ }

            setState(prev => ({
                ...prev,
                collections: enhanced,
                allCollections: enhanced,
                categories,
                featuredCollection: featured,
                stats,
                isLoading: false,
                isRefreshing: false,
                discoveryProgress: { scanned: enhanced.length, found: enhanced.length, step: `✅ Found ${enhanced.length} collections` },
            }));

            startHeroRotation(enhanced);
        } catch (err: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                isRefreshing: false,
                error: err?.message || 'Failed to load collections.',
                discoveryProgress: { scanned: 0, found: 0, step: `❌ Error: ${err?.message}` },
            }));
        }
    }, [organizeCategories, selectFeatured, startHeroRotation]);

    // Search
    const performSearch = useCallback((query: string) => {
        setState(prev => {
            if (!query.trim()) return { ...prev, searchQuery: query, collections: prev.allCollections };

            const results = prev.allCollections.filter(c => {
                const text = [c.name, c.overview, ...c.genre_categories, c.type, c.status, ...c.parts.map(m => m.title)].join(' ').toLowerCase();
                const terms = query.toLowerCase().split(' ').filter(t => t.length > 1);
                return terms.some(term => text.includes(term));
            }).sort((a, b) => {
                const lq = query.toLowerCase();
                const scoreA = a.name.toLowerCase() === lq ? 100 : a.name.toLowerCase().startsWith(lq) ? 50 : a.name.toLowerCase().includes(lq) ? 25 : 0;
                const scoreB = b.name.toLowerCase() === lq ? 100 : b.name.toLowerCase().startsWith(lq) ? 50 : b.name.toLowerCase().includes(lq) ? 25 : 0;
                return scoreB - scoreA;
            });

            return { ...prev, searchQuery: query, collections: results };
        });
    }, []);

    const handleSearch = useCallback((query: string) => {
        setState(prev => ({ ...prev, searchQuery: query }));
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => performSearch(query), 300);
    }, [performSearch]);

    const setSelectedCategory = useCallback((categoryId: string) => {
        setState(prev => ({ ...prev, selectedCategory: categoryId }));
    }, []);

    const rotateFeatured = useCallback(() => {
        setState(prev => ({
            ...prev,
            featuredCollection: selectFeatured(prev.allCollections, prev.featuredCollection?.id),
        }));
    }, [selectFeatured]);

    // Init
    useEffect(() => {
        fetchCollections();
        return () => {
            stopHeroRotation();
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    return {
        ...state,
        fetchCollections,
        handleSearch,
        setSelectedCategory,
        stopHeroRotation,
        rotateFeatured,
    };
}
