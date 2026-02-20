import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    RefreshControl,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, RefreshCw } from 'lucide-react-native';
import { CollectionDetails } from '../../types';
import { useCollections } from '../../services/hooks/useCollections';
import CollectionsHero from '../../components/Collections/CollectionsHero';
import CategoryRow from '../../components/Collections/CategoryRow';
import FilterChips from '../../components/Collections/FilterChips';
import CollectionsSkeleton from '../../components/Collections/CollectionsSkeleton';

export default function CollectionsScreen() {
    const router = useRouter();
    const {
        collections,
        categories,
        featuredCollection,
        isLoading,
        isRefreshing,
        error,
        searchQuery,
        selectedCategory,
        stats,
        discoveryProgress,
        fetchCollections,
        handleSearch,
        setSelectedCategory,
        stopHeroRotation,
    } = useCollections();

    const handleCollectionPress = (collection: CollectionDetails) => {
        stopHeroRotation();
        router.push(`/collection/${collection.id}`);
    };

    // Filter collections by category if one is selected
    const displayedCategories = selectedCategory === 'all'
        ? categories
        : categories.filter(cat => cat.id === selectedCategory);

    if (isLoading && !error) {
        return (
            <View style={styles.screen}>
                <StatusBar barStyle="light-content" />
                <CollectionsSkeleton progress={discoveryProgress} />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchCollections(true)}
                        tintColor="#E50914"
                        colors={['#E50914']}
                    />
                }
            >
                {/* Hero */}
                {featuredCollection && (
                    <CollectionsHero
                        collection={featuredCollection}
                        onStartMarathon={() => handleCollectionPress(featuredCollection)}
                        onViewCollection={() => handleCollectionPress(featuredCollection)}
                    />
                )}

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <Search size={18} color={searchQuery ? '#E50914' : '#6B7280'} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search collections, movies, genres..."
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

                {/* Stats bar */}
                {stats && (
                    <View style={styles.statsBar}>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#4ADE80' }]}>{collections.length}</Text>
                            <Text style={styles.statLabel}>Collections</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#60A5FA' }]}>{stats.totalFilms?.toLocaleString() || '0'}</Text>
                            <Text style={styles.statLabel}>Films</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#C084FC' }]}>{stats.averageFilmsPerCollection || '0'}</Text>
                            <Text style={styles.statLabel}>Avg/Collection</Text>
                        </View>
                    </View>
                )}

                {/* Filter chips */}
                <FilterChips
                    categories={categories.map(c => ({ id: c.id, name: c.name }))}
                    selected={selectedCategory}
                    onSelect={setSelectedCategory}
                />

                {/* Category rows */}
                {displayedCategories.length > 0 ? (
                    displayedCategories.map(category => (
                        <CategoryRow
                            key={category.id}
                            category={category}
                            onCollectionPress={handleCollectionPress}
                            onViewAll={() => setSelectedCategory(category.id)}
                        />
                    ))
                ) : searchQuery ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🎬</Text>
                        <Text style={styles.emptyTitle}>No collections found</Text>
                        <Text style={styles.emptySubtitle}>
                            No results match "{searchQuery}". Try a different search.
                        </Text>
                        <TouchableOpacity style={styles.clearButton} onPress={() => handleSearch('')}>
                            <Text style={styles.clearButtonText}>Clear Search</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Error */}
                {error && (
                    <View style={styles.errorState}>
                        <Text style={styles.errorEmoji}>⚠️</Text>
                        <Text style={styles.errorTitle}>Something went wrong</Text>
                        <Text style={styles.errorSubtitle}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => fetchCollections(true)}>
                            <RefreshCw size={16} color="#fff" />
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bottom spacing */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0A0A1F',
    },
    scrollView: {
        flex: 1,
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
    statsBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 14,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    statLabel: {
        color: '#6B7280',
        fontSize: 11,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
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
    clearButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    errorState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    errorEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    errorTitle: {
        color: '#D1D5DB',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    errorSubtitle: {
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
