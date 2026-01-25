import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable, Dimensions } from "react-native";
import { Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Star, ChevronLeft } from "lucide-react-native";
import * as tmdb from "../../services/tmdb";
import { Movie, TVShow } from "../../types";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import LongPressPreviewModal from "../../components/LongPressPreviewModal";

const { width } = Dimensions.get('window');
const POSTER_WIDTH = (width - 48) / 3; // 3 columns with 16px padding on sides and 8px gaps
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

export default function GenreDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string; name: string; type: 'movie' | 'tv' }>();

    const genreId = parseInt(params.id);
    const genreName = params.name;
    const mediaType = params.type;

    const [content, setContent] = useState<(Movie | TVShow)[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Long-Press Preview Modal State
    const [previewItem, setPreviewItem] = useState<{
        item: Movie | TVShow;
        mediaType: 'movie' | 'tv';
    } | null>(null);

    // Initial load
    useEffect(() => {
        loadContent(1, true);
    }, [genreId, mediaType]);

    const loadContent = async (pageNum: number, isInitial: boolean = false) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = mediaType === 'movie'
                ? await tmdb.discoverMoviesByGenre(genreId, pageNum)
                : await tmdb.discoverTVShowsByGenre(genreId, pageNum);

            if (isInitial) {
                setContent(response.results);
            } else {
                setContent(prev => [...prev, ...response.results]);
            }

            setHasMore(pageNum < response.total_pages && response.results.length > 0);
        } catch (error) {
            console.error('Error loading genre content:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadContent(nextPage, false);
        }
    }, [page, loadingMore, hasMore]);

    const renderItem = useCallback(({ item, index }: { item: Movie | TVShow; index: number }) => {
        if (!item.poster_path) return null;

        const itemTitle = 'title' in item ? item.title : item.name;
        const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : '';

        return (
            <Animated.View
                entering={FadeIn.delay(index * 10).springify().damping(15).stiffness(150)}
                className="mb-4"
            >
                <Pressable
                    onPress={() => {
                        const path = mediaType === 'tv' ? "/tv/[id]" : "/movie/[id]";
                        router.push({ pathname: path, params: { id: item.id } });
                    }}
                    onLongPress={() => {
                        // Try to trigger haptic feedback
                        try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        } catch (e) {
                            // Haptics not available, continue silently
                        }
                        setPreviewItem({ item, mediaType });
                    }}
                    delayLongPress={500}
                >
                    {({ pressed }) => (
                        <Animated.View
                            style={{
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                                opacity: pressed ? 0.9 : 1,
                            }}
                        >
                            {/* Poster */}
                            <View
                                className="rounded-lg overflow-hidden bg-gray-800 border border-white/5 shadow-lg"
                                style={{
                                    width: POSTER_WIDTH,
                                    height: POSTER_HEIGHT,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}
                            >
                                <Image
                                    source={{ uri: tmdb.getImageUrl(item.poster_path, 'w342') }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                                {/* Rating Badge */}
                                {item.vote_average > 0 && (
                                    <View className="absolute top-2 right-2 bg-black/80 px-1.5 py-0.5 rounded flex-row items-center gap-0.5 backdrop-blur">
                                        <Star size={8} fill="#EAB308" color="#EAB308" />
                                        <Text className="text-white text-[9px] font-bold">
                                            {item.vote_average.toFixed(1)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Title and Year */}
                            <View style={{ width: POSTER_WIDTH }} className="mt-2">
                                <Text className="text-white text-xs font-medium" numberOfLines={2}>
                                    {itemTitle}
                                </Text>
                                {year && (
                                    <Text className="text-gray-400 text-[10px] mt-0.5">
                                        {year}
                                    </Text>
                                )}
                            </View>
                        </Animated.View>
                    )}
                </Pressable>
            </Animated.View>
        );
    }, [mediaType, router]);

    const keyExtractor = useCallback((item: Movie | TVShow) => item.id.toString(), []);

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View className="py-4">
                <ActivityIndicator size="small" color="#E50914" />
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-netflix-black justify-center items-center">
                <ActivityIndicator size="large" color="#E50914" />
                <Text className="text-gray-400 mt-4">Loading {genreName}...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-netflix-black">
            <StatusBar style="light" />

            {/* Header */}
            <View className="pt-12 pb-4 px-4 border-b border-white/10">
                <View className="flex-row items-center">
                    <Pressable
                        onPress={() => router.back()}
                        className="mr-3 p-2 active:opacity-70"
                    >
                        <ChevronLeft color="white" size={24} />
                    </Pressable>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-xl">{genreName}</Text>
                        <Text className="text-gray-400 text-sm">
                            {mediaType === 'movie' ? 'Movies' : 'TV Shows'} • {content.length} items
                        </Text>
                    </View>
                </View>
            </View>

            {/* Content Grid */}
            <FlatList
                data={content}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                numColumns={3}
                contentContainerStyle={{ padding: 16 }}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={15}
                windowSize={5}
                initialNumToRender={15}
            />

            {/* Long-Press Preview Modal */}
            <LongPressPreviewModal
                visible={!!previewItem}
                item={previewItem?.item || null}
                mediaType={previewItem?.mediaType || 'movie'}
                onClose={() => setPreviewItem(null)}
                onPlay={() => {
                    if (previewItem) {
                        const path = previewItem.mediaType === 'tv' ? "/tv/[id]" : "/movie/[id]";
                        router.push({ pathname: path, params: { id: previewItem.item.id } });
                        setPreviewItem(null);
                    }
                }}
            />
        </View>
    );
}
