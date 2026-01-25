import { View, Text, TextInput, FlatList, Pressable, Dimensions, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, Star, Calendar } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import * as tmdb from "../../services/tmdb";
import { Content } from "../../types";
import { Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { GridSkeleton, RowSkeleton } from "../../components/SkeletonLoader";

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 4;
const ITEM_WIDTH = (width - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Content[]>([]);
    const [loading, setLoading] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

    // Initial "Top Searches" state
    const [topSearches, setTopSearches] = useState<Content[]>([]);
    const [loadingTopSearches, setLoadingTopSearches] = useState(true);

    // Popular categories for quick access
    const [trendingMovies, setTrendingMovies] = useState<Content[]>([]);
    const [trendingTV, setTrendingTV] = useState<Content[]>([]);

    useEffect(() => {
        loadInitialContent();
    }, []);

    const loadInitialContent = async () => {
        setLoadingTopSearches(true);
        try {
            // Load trending movies and TV shows in parallel
            const [moviesRes, tvRes] = await Promise.all([
                tmdb.getTrendingMovies(1),
                tmdb.getTrendingTVShows(1)
            ]);

            const movies = moviesRes.results.slice(0, 10).map(m => ({ ...m, media_type: 'movie' as const }));
            const tvShows = tvRes.results.slice(0, 10).map(t => ({ ...t, media_type: 'tv' as const }));

            setTrendingMovies(movies);
            setTrendingTV(tvShows);

            // Combine for "Top Searches" - alternating movies and TV
            const combined: Content[] = [];
            for (let i = 0; i < Math.max(movies.length, tvShows.length); i++) {
                if (movies[i]) combined.push(movies[i]);
                if (tvShows[i]) combined.push(tvShows[i]);
            }
            setTopSearches(combined.slice(0, 15));
        } catch (error) {
            console.error('Error loading initial content:', error);
        } finally {
            setLoadingTopSearches(false);
        }
    };

    const handleSearch = useCallback((text: string) => {
        setQuery(text);

        if (typingTimeout) clearTimeout(typingTimeout);

        if (text.trim().length === 0) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timeout = setTimeout(async () => {
            try {
                const res = await tmdb.searchMulti(text);
                const filtered = res.results.filter(i => i.media_type === 'movie' || i.media_type === 'tv');
                setResults(filtered);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 400); // 400ms debounce for snappy response

        setTypingTimeout(timeout);
    }, [typingTimeout]);

    const clearSearch = useCallback(() => {
        setQuery("");
        setResults([]);
        setLoading(false);
        if (typingTimeout) clearTimeout(typingTimeout);
    }, [typingTimeout]);

    const navigateToDetail = useCallback((item: Content) => {
        const mediaType = item.media_type || 'movie';
        const path = mediaType === 'tv' ? "/tv/[id]" : "/movie/[id]";
        router.push({ pathname: path, params: { id: item.id } });
    }, [router]);

    const getTitle = (item: Content) => {
        return 'title' in item ? item.title : item.name || 'Untitled';
    };

    const getReleaseYear = (item: Content) => {
        const date = 'release_date' in item ? item.release_date : item.first_air_date;
        return date ? new Date(date).getFullYear() : '';
    };

    const renderSearchResultItem = ({ item, index }: { item: Content; index: number }) => (
        <Animated.View entering={FadeIn.delay(index * 30)}>
            <Pressable
                className="mb-1"
                style={{ width: ITEM_WIDTH, marginRight: SPACING }}
                onPress={() => navigateToDetail(item)}
            >
                <View className="relative rounded-lg overflow-hidden bg-gray-800" style={{ height: ITEM_HEIGHT }}>
                    <Image
                        source={{ uri: tmdb.getImageUrl(item.poster_path, 'w342') }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                    {/* Rating Badge */}
                    {item.vote_average > 0 && (
                        <View className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                            <Star size={10} fill="#EAB308" color="#EAB308" />
                            <Text className="text-white text-[10px] font-bold">{item.vote_average.toFixed(1)}</Text>
                        </View>
                    )}
                    {/* Media Type Badge */}
                    <View className="absolute bottom-2 left-2 bg-netflix-red px-2 py-0.5 rounded">
                        <Text className="text-white text-[10px] font-bold uppercase">{item.media_type || 'movie'}</Text>
                    </View>
                </View>

                {/* Title & Year */}
                <Text className="text-white text-xs font-semibold mt-1.5 leading-4" numberOfLines={2}>
                    {getTitle(item)}
                </Text>
                <Text className="text-gray-500 text-[10px] mt-0.5">
                    {getReleaseYear(item)}
                </Text>
            </Pressable>
        </Animated.View>
    );

    const renderTopSearchItem = ({ item, index }: { item: Content; index: number }) => (
        <Animated.View entering={FadeIn.delay(index * 50)}>
            <Pressable
                className="flex-row items-center mb-3 bg-gray-900/50 rounded-xl overflow-hidden border border-white/5"
                onPress={() => navigateToDetail(item)}
            >
                <View className="w-28 h-16 bg-gray-800">
                    <Image
                        source={{ uri: tmdb.getImageUrl(item.backdrop_path || item.poster_path, 'w500') }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                </View>

                <View className="flex-1 px-3">
                    <Text className="text-white font-bold text-sm mb-0.5" numberOfLines={1}>
                        {getTitle(item)}
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <Text className="text-gray-400 text-xs">{getReleaseYear(item)}</Text>
                        {item.vote_average > 0 && (
                            <>
                                <Text className="text-gray-600">•</Text>
                                <View className="flex-row items-center gap-1">
                                    <Star size={10} fill="#EAB308" color="#EAB308" />
                                    <Text className="text-gray-300 text-xs font-semibold">{item.vote_average.toFixed(1)}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Media type indicator */}
                <View className={`px-3 py-1 mr-3 rounded ${item.media_type === 'tv' ? 'bg-blue-500/20' : 'bg-netflix-red/20'}`}>
                    <Text className={`text-xs font-bold uppercase ${item.media_type === 'tv' ? 'text-blue-400' : 'text-netflix-red'}`}>
                        {item.media_type || 'movie'}
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    );

    const renderCategoryItem = ({ item }: { item: Content }) => (
        <Pressable
            className="mr-3"
            onPress={() => navigateToDetail(item)}
        >
            <View className="w-28 h-40 rounded-lg overflow-hidden bg-gray-800 border border-white/5">
                <Image
                    source={{ uri: tmdb.getImageUrl(item.poster_path, 'w342') }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
                {item.vote_average > 0 && (
                    <View className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                        <Star size={8} fill="#EAB308" color="#EAB308" />
                        <Text className="text-white text-[9px] font-bold">{item.vote_average.toFixed(1)}</Text>
                    </View>
                )}
            </View>
            <Text className="text-white text-xs font-medium mt-1.5 w-28" numberOfLines={1}>
                {getTitle(item)}
            </Text>
        </Pressable>
    );

    return (
        <SafeAreaView className="flex-1 bg-netflix-black" edges={['top']}>
            <StatusBar style="light" />

            {/* Search Input */}
            <View className="bg-gray-900/50 mx-4 p-3 rounded-xl flex-row items-center mb-4 mt-2 border border-white/5">
                <Search color="#9CA3AF" size={20} />
                <TextInput
                    placeholder="Search movies, TV shows..."
                    placeholderTextColor="#6B7280"
                    className="flex-1 text-white ml-3 text-base"
                    value={query}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <Pressable
                        onPress={clearSearch}
                        className="w-6 h-6 rounded-full bg-gray-700 items-center justify-center"
                    >
                        <X color="#9CA3AF" size={14} />
                    </Pressable>
                )}
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 pt-4">
                    <GridSkeleton count={12} />
                </View>
            ) : query.length > 0 ? (
                // Search Results View
                <View className="flex-1">
                    {results.length > 0 ? (
                        <>
                            <Text className="text-gray-400 px-4 mb-3 text-sm">
                                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                            </Text>
                            <FlatList
                                data={results}
                                renderItem={renderSearchResultItem}
                                keyExtractor={item => `${item.id}-${item.media_type}`}
                                numColumns={COLUMN_COUNT}
                                contentContainerStyle={{ paddingHorizontal: SPACING, paddingBottom: 20 }}
                                showsVerticalScrollIndicator={false}
                            />
                        </>
                    ) : (
                        <View className="flex-1 justify-center items-center px-6">
                            <Search color="#4B5563" size={64} />
                            <Text className="text-gray-300 text-lg font-bold mt-4 text-center">No results found</Text>
                            <Text className="text-gray-500 text-sm mt-2 text-center">
                                We couldn't find anything for "{query}"
                            </Text>
                            <Text className="text-gray-600 text-xs mt-4 text-center">
                                Try different keywords or check the spelling
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                // Default View - Top Searches and Categories
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {loadingTopSearches ? (
                        <View className="py-4">
                            <RowSkeleton />
                            <RowSkeleton />
                        </View>
                    ) : (
                        <>
                            {/* Top Searches */}
                            <View className="mb-6">
                                <View className="flex-row items-center justify-between px-4 mb-3">
                                    <View>
                                        <Text className="text-white font-bold text-xl">Top Searches</Text>
                                        <Text className="text-gray-500 text-xs mt-0.5">Trending now</Text>
                                    </View>
                                </View>

                                <View className="px-4">
                                    {topSearches.map((item, index) => (
                                        <View key={`${item.id}-${item.media_type}`}>
                                            {renderTopSearchItem({ item, index })}
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Trending Movies */}
                            {trendingMovies.length > 0 && (
                                <View className="mb-6">
                                    <View className="px-4 mb-3">
                                        <Text className="text-white font-bold text-lg">Trending Movies</Text>
                                        <Text className="text-gray-500 text-xs mt-0.5">Popular movies today</Text>
                                    </View>

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingHorizontal: 16 }}
                                    >
                                        {trendingMovies.map(item => (
                                            <View key={item.id}>
                                                {renderCategoryItem({ item })}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Trending TV Shows */}
                            {trendingTV.length > 0 && (
                                <View className="mb-6">
                                    <View className="px-4 mb-3">
                                        <Text className="text-white font-bold text-lg">Trending TV Shows</Text>
                                        <Text className="text-gray-500 text-xs mt-0.5">Popular series today</Text>
                                    </View>

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingHorizontal: 16 }}
                                    >
                                        {trendingTV.map(item => (
                                            <View key={item.id}>
                                                {renderCategoryItem({ item })}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
