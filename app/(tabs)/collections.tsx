import React, { useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    RefreshControl,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, X, RefreshCw } from 'lucide-react-native';
import { CollectionDetails } from '../../types';
import { useCollections } from '../../services/hooks/useCollections';
import CollectionsHero from '../../components/Collections/CollectionsHero';
import FranchiseCard from '../../components/Collections/FranchiseCard';
import FilterChips from '../../components/Collections/FilterChips';
import CollectionsSkeleton from '../../components/Collections/CollectionsSkeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2; // 2-column grid with gap

export default function CollectionsScreen() {
    const router = useRouter();
    const {
        collections,
        featuredCollection,
        isLoading,
        isLoadingMore,
        isRefreshing,
        error,
        searchQuery,
        selectedFilter,
        hasMore,
        totalFound,
        filterOptions,
        fetchCollections,
        loadMore,
        handleSearch,
        setSelectedFilter,
        stopHeroRotation,
    } = useCollections();

    const handleCollectionPress = useCallback((collection: CollectionDetails) => {
        stopHeroRotation();
        router.push(`/collection/${collection.id}`);
    }, [router, stopHeroRotation]);

    const handleStartFirstMovie = useCallback((collection: CollectionDetails) => {
        if (collection.parts?.length) {
            const sorted = [...collection.parts].sort(
                (a, b) => new Date(a.release_date || '').getTime() - new Date(b.release_date || '').getTime()
            );
            router.push(`/movie/${sorted[0].id}`);
        }
    }, [router]);

    // FlatList header (hero + search + filters)
    const ListHeader = useCallback(() => (
        <View>
            {/* Hero */}
            {featuredCollection && !searchQuery && (
                <CollectionsHero
                    collection={featuredCollection}
                    onStartMarathon={() => handleStartFirstMovie(featuredCollection)}
                    onViewCollection={() => handleCollectionPress(featuredCollection)}
                />
            )}

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={18} color={searchQuery ? '#E50914' : '#6B7280'} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search collections..."
                        placeholderTextColor="#6B7280"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <X size={18} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter chips */}
            <FilterChips
                categories={filterOptions}
                selected={selectedFilter}
                onSelect={setSelectedFilter}
            />

            {/* Results count */}
            <View style={styles.resultsBar}>
                <Text style={styles.resultsText}>
                    {searchQuery
                        ? `${totalFound} result${totalFound !== 1 ? 's' : ''} for "${searchQuery}"`
                        : `${totalFound} collections`}
                </Text>
                {hasMore && !searchQuery && (
                    <Text style={styles.scrollHint}>Scroll for more ↓</Text>
                )}
            </View>
        </View>
    ), [featuredCollection, searchQuery, selectedFilter, totalFound, hasMore, filterOptions, handleCollectionPress, handleSearch, setSelectedFilter]);

    // Render a single grid card (2-column)
    const renderItem = useCallback(({ item }: { item: CollectionDetails }) => (
        <View style={styles.gridItem}>
            <FranchiseCard collection={item} onPress={handleCollectionPress} />
        </View>
    ), [handleCollectionPress]);

    // Footer with loading indicator or end message
    const ListFooter = useCallback(() => {
        if (isLoadingMore) {
            return (
                <View style={styles.footer}>
                    <ActivityIndicator size="small" color="#E50914" />
                    <Text style={styles.footerText}>Loading more collections...</Text>
                </View>
            );
        }
        if (!hasMore && collections.length > 0) {
            return (
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        🎬 You've explored {totalFound} collections!
                    </Text>
                </View>
            );
        }
        return <View style={{ height: 40 }} />;
    }, [isLoadingMore, hasMore, totalFound, collections.length]);

    // Empty state
    const ListEmpty = useCallback(() => {
        if (isLoading) return null;
        if (error) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>⚠️</Text>
                    <Text style={styles.emptyTitle}>Something went wrong</Text>
                    <Text style={styles.emptySubtitle}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchCollections(true)}>
                        <RefreshCw size={16} color="#fff" />
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎬</Text>
                <Text style={styles.emptyTitle}>No collections found</Text>
                <Text style={styles.emptySubtitle}>
                    {searchQuery
                        ? `No results for "${searchQuery}". Try a different search.`
                        : 'Try a different filter or pull to refresh.'}
                </Text>
                {searchQuery ? (
                    <TouchableOpacity style={styles.retryButton} onPress={() => handleSearch('')}>
                        <Text style={styles.retryButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    }, [isLoading, error, searchQuery, fetchCollections, handleSearch]);

    if (isLoading && collections.length === 0) {
        return (
            <View style={styles.screen}>
                <StatusBar barStyle="light-content" />
                <CollectionsSkeleton />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" />
            <FlatList
                data={collections}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.row}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                ListEmptyComponent={ListEmpty}
                onEndReached={() => {
                    if (hasMore && !isLoadingMore && !searchQuery) {
                        loadMore();
                    }
                }}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchCollections(true)}
                        tintColor="#E50914"
                        colors={['#E50914']}
                    />
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0A0A1F',
    },
    listContent: {
        paddingBottom: 20,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
    },
    resultsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    resultsText: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '500',
    },
    scrollHint: {
        color: '#6B7280',
        fontSize: 12,
    },
    row: {
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 14,
    },
    gridItem: {
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    footerText: {
        color: '#6B7280',
        fontSize: 13,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        color: '#D1D5DB',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    emptySubtitle: {
        color: '#6B7280',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E50914',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
