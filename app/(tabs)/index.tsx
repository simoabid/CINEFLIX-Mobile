import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, Dimensions, Pressable, FlatList, Image, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as tmdb from "../../services/tmdb";
import { Movie, TVShow } from "../../types";
import Animated, { FadeIn, FadeInDown, SlideInRight } from "react-native-reanimated";
import { Play, Info, Plus, Star, ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import LongPressPreviewModal from "../../components/LongPressPreviewModal";
import HomeScreenSkeleton from "../../components/HomeScreenSkeleton";

const { width, height } = Dimensions.get('window');

// Constants for optimized performance
const POSTER_WIDTH = 110;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;
const HERO_HEIGHT = height * 0.69; // 60% of screen height

// Memoized Content Row Component
const ContentRow = React.memo(({ title, data, mediaType, genreId, genreName, onLongPress }: {
    title: string;
    data: (Movie | TVShow)[];
    mediaType: 'movie' | 'tv';
    genreId?: number;
    genreName?: string;
    onLongPress?: (item: Movie | TVShow, mediaType: 'movie' | 'tv') => void;
}) => {
    const router = useRouter();

    const renderItem = useCallback(({ item, index }: { item: Movie | TVShow; index: number }) => {
        // Skip items without poster
        if (!item.poster_path) return null;

        // Extract title and year
        const itemTitle = 'title' in item ? item.title : item.name;
        const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : '';

        return (
            <Animated.View
                entering={FadeIn.delay(index * 30).springify().damping(15).stiffness(150)}
            >
                <Pressable
                    className="mr-3"
                    onPress={() => {
                        const path = mediaType === 'tv' ? "/tv/[id]" : "/movie/[id]";
                        router.push({ pathname: path, params: { id: item.id } });
                    }}
                    onLongPress={() => {
                        if (onLongPress) {
                            // Try to trigger haptic feedback, but don't fail if not available
                            try {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            } catch (e) {
                                // Haptics not available, continue silently
                            }
                            onLongPress(item, mediaType);
                        }
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
                            {/* Poster Card */}
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
                                        <Text className="text-white text-[9px] font-bold">{item.vote_average.toFixed(1)}</Text>
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

    const handleViewAll = useCallback(() => {
        if (genreId && genreName) {
            router.push({
                pathname: "/genre/[id]",
                params: { id: genreId, name: genreName, type: mediaType }
            });
        }
    }, [genreId, genreName, mediaType, router]);

    return (
        <View className="mb-6">
            {/* Header with Title and View All Button */}
            <View className="flex-row items-center justify-between px-4 mb-3">
                <Text className="text-white font-bold text-lg">{title}</Text>
                {genreId && (
                    <Pressable
                        onPress={handleViewAll}
                        className="flex-row items-center gap-1"
                    >
                        {({ pressed }) => (
                            <Animated.View
                                style={{
                                    transform: [{ scale: pressed ? 0.95 : 1 }],
                                    opacity: pressed ? 0.7 : 1,
                                }}
                                className="flex-row items-center gap-1"
                            >
                                <Text className="text-gray-300 text-sm font-medium">View All</Text>
                                <ChevronRight color="#D1D5DB" size={16} />
                            </Animated.View>
                        )}
                    </Pressable>
                )}
            </View>

            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
            />
        </View>
    );
});

export default function HomeScreen() {
    const router = useRouter();

    // State
    const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
    const [trendingTV, setTrendingTV] = useState<TVShow[]>([]);
    const [popularTV, setPopularTV] = useState<TVShow[]>([]);
    const [loading, setLoading] = useState(true);

    // Genre Collections State - Dynamic (like web version)
    const [genreSections, setGenreSections] = useState<Array<{
        id: number;
        name: string;
        type: 'movie' | 'tv';
        items: (Movie | TVShow)[];
    }>>([]);

    // Long-Press Preview Modal State
    const [previewItem, setPreviewItem] = useState<{
        item: Movie | TVShow;
        mediaType: 'movie' | 'tv';
    } | null>(null);

    // Hero logos state
    const [heroLogos, setHeroLogos] = useState<Record<number, string | null>>({});

    // ScrollView ref for hero carousel
    const heroScrollRef = useRef<ScrollView>(null);

    // Auto-rotation timer
    const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);

    // Load all content
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Step 1: Fetch all genres first
                const [movieGenres, tvGenres] = await Promise.all([
                    tmdb.getMovieGenres(),
                    tmdb.getTVGenres()
                ]);

                // Step 2: Determine which genres to display (top 8 of each like web)
                const topMovieGenres = movieGenres.slice(0, 8);
                const topTVGenres = tvGenres.slice(0, 8);

                const genresToDisplay = [
                    ...topMovieGenres.map(g => ({ ...g, type: 'movie' as const })),
                    ...topTVGenres.map(g => ({ ...g, type: 'tv' as const }))
                ];

                // Step 3: Create genre fetch promises
                const genrePromises = genresToDisplay.map(async (genre) => {
                    try {
                        const response = genre.type === 'movie'
                            ? await tmdb.discoverMoviesByGenre(genre.id, 1)
                            : await tmdb.discoverTVShowsByGenre(genre.id, 1);

                        return {
                            id: genre.id,
                            name: genre.name,
                            type: genre.type,
                            items: response.results.slice(0, 20)
                        };
                    } catch (error) {
                        console.error(`Error fetching ${genre.type} for genre ${genre.id}:`, error);
                        return {
                            id: genre.id,
                            name: genre.name,
                            type: genre.type,
                            items: []
                        };
                    }
                });

                // Step 4: Parallel API calls for main content + all genres
                const [
                    trendMoviesRes,
                    popMoviesRes,
                    topRatedRes,
                    trendTVRes,
                    popTVRes,
                    ...genreSectionsData
                ] = await Promise.all([
                    tmdb.getTrendingMovies(1),
                    tmdb.getPopularMovies(),
                    tmdb.getTopRatedMovies(),
                    tmdb.getTrendingTVShows(1),
                    tmdb.getPopularTVShows(),
                    ...genrePromises
                ]);

                // Set hero movies (top 10 trending)
                const heroData = trendMoviesRes.results.slice(0, 10);
                setHeroMovies(heroData);

                // Fetch logos for hero movies
                heroData.forEach(async (movie) => {
                    try {
                        const details = await tmdb.getMovieDetails(movie.id);
                        if (details.logo_path) {
                            setHeroLogos(prev => ({
                                ...prev,
                                [movie.id]: tmdb.getImageUrl(details.logo_path!, 'w500')
                            }));
                        }
                    } catch (error) {
                        console.error(`Failed to fetch logo for movie ${movie.id}:`, error);
                    }
                });

                // Set content rows
                setTrendingMovies(trendMoviesRes.results.slice(10, 30));
                setPopularMovies(popMoviesRes.results.slice(0, 20));
                setTopRatedMovies(topRatedRes.results.slice(0, 20));
                setTrendingTV(trendTVRes.results.slice(0, 20));
                setPopularTV(popTVRes.results.slice(0, 20));

                // Set genre collections (filter out empty ones)
                setGenreSections(genreSectionsData.filter(section => section.items.length > 0));

            } catch (e) {
                console.error('Error loading home data:', e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Auto-rotate hero every 4 seconds
    useEffect(() => {
        if (heroMovies.length > 1) {
            autoRotateTimer.current = setInterval(() => {
                setCurrentHeroIndex(prev => {
                    const nextIndex = (prev + 1) % heroMovies.length;
                    // Scroll to next item
                    heroScrollRef.current?.scrollTo({
                        x: nextIndex * width,
                        animated: true
                    });
                    return nextIndex;
                });
            }, 4000); // 4 seconds

            return () => {
                if (autoRotateTimer.current) clearInterval(autoRotateTimer.current);
            };
        }
    }, [heroMovies.length, width]);

    const navigateToHero = useCallback((index: number) => {
        setCurrentHeroIndex(index);
        // Scroll to selected item
        heroScrollRef.current?.scrollTo({
            x: index * width,
            animated: true
        });
        // Reset auto-rotate timer
        if (autoRotateTimer.current) {
            clearInterval(autoRotateTimer.current);
            autoRotateTimer.current = setInterval(() => {
                setCurrentHeroIndex(prev => {
                    const nextIndex = (prev + 1) % heroMovies.length;
                    heroScrollRef.current?.scrollTo({
                        x: nextIndex * width,
                        animated: true
                    });
                    return nextIndex;
                });
            }, 4000);
        }
    }, [heroMovies.length, width]);

    const nextHero = useCallback(() => {
        navigateToHero((currentHeroIndex + 1) % heroMovies.length);
    }, [currentHeroIndex, heroMovies.length, navigateToHero]);

    const prevHero = useCallback(() => {
        navigateToHero((currentHeroIndex - 1 + heroMovies.length) % heroMovies.length);
    }, [currentHeroIndex, heroMovies.length, navigateToHero]);

    if (loading) {
        return <HomeScreenSkeleton />;
    }

    const heroItem = heroMovies[currentHeroIndex];

    return (
        <View className="flex-1 bg-netflix-black">
            <StatusBar style="light" />

            {/* App Logo Overlay */}
            <SafeAreaView className="absolute top-0 left-5 z-50 pointer-events-none">
                <Image
                    source={require('../../assets/images/logo.png')}
                    style={{
                        width: 140,
                        height: 90,
                        marginLeft: -8,
                        marginTop: -18
                    }}
                    resizeMode="contain"
                />
            </SafeAreaView>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Hero Carousel Section */}
                <ScrollView
                    ref={heroScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                        const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                        if (newIndex !== currentHeroIndex) {
                            setCurrentHeroIndex(newIndex);
                        }
                    }}
                    decelerationRate="fast"
                    snapToInterval={width}
                    snapToAlignment="center"
                    scrollEventThrottle={16}
                >
                    {heroMovies.map((movie, index) => (
                        <View key={movie.id} className="relative" style={{ width: width, height: HERO_HEIGHT }}>
                            {/* Hero Image */}
                            {movie.poster_path && (
                                <Image
                                    source={{ uri: tmdb.getImageUrl(movie.poster_path, 'original') }}
                                    style={{ width: width, height: HERO_HEIGHT }}
                                    resizeMode="cover"
                                />
                            )}

                            {/* Gradients */}
                            <LinearGradient
                                colors={['transparent', 'rgba(10,10,31,0.5)', 'rgba(10,10,31,0.95)', '#0A0A1F']}
                                locations={[0, 0.3, 0.7, 1]}
                                className="absolute bottom-0 w-full h-full"
                            />
                            <LinearGradient
                                colors={['rgba(0,0,0,0.6)', 'transparent']}
                                className="absolute top-0 w-full h-32"
                            />

                            {/* Hero Content */}
                            <View className="absolute bottom-0 w-full px-4 pb-6 items-center z-10">
                                {/* Logo or Title */}
                                {heroLogos[movie.id] ? (
                                    <Animated.View
                                        entering={FadeInDown.delay(200)}
                                        className="h-20 w-56 mb-3"
                                    >
                                        <Image
                                            source={{ uri: heroLogos[movie.id]! }}
                                            className="w-full h-full"
                                            resizeMode="contain"
                                        />
                                    </Animated.View>
                                ) : (
                                    <Animated.Text
                                        entering={FadeInDown.delay(200)}
                                        className="text-white font-black text-3xl text-center mb-1 tracking-tight"
                                        numberOfLines={2}
                                    >
                                        {movie.title}
                                    </Animated.Text>
                                )}

                                {/* Metadata */}
                                <Animated.View
                                    entering={FadeInDown.delay(300)}
                                    className="flex-row items-center gap-2 mb-4"
                                >
                                    <View className="flex-row items-center gap-1">
                                        <Star size={12} fill="#EAB308" color="#EAB308" />
                                        <Text className="text-white text-xs font-semibold">{movie.vote_average.toFixed(1)}</Text>
                                    </View>
                                    <Text className="text-gray-400 text-xs">•</Text>
                                    <Text className="text-gray-300 text-xs font-medium">
                                        {movie.release_date ? new Date(movie.release_date).getFullYear() : ''}
                                    </Text>
                                    <Text className="text-gray-400 text-xs">•</Text>
                                    <Text className="text-gray-300 text-xs font-medium">Movie</Text>
                                </Animated.View>

                                {/* Action Buttons */}
                                <Animated.View
                                    entering={FadeInDown.delay(400)}
                                    className="flex-row items-center gap-3 mb-4"
                                >
                                    {/* My List Button */}
                                    <Pressable
                                        className="items-center active:scale-95"
                                        onPress={() => router.push({ pathname: "/movie/[id]", params: { id: movie.id } })}
                                    >
                                        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/30">
                                            <Plus color="white" size={20} />
                                        </View>
                                        <Text className="text-white text-xs mt-1 font-medium">My List</Text>
                                    </Pressable>

                                    {/* Like Button */}
                                    <Pressable
                                        className="items-center active:scale-95"
                                        onPress={() => {
                                            try {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            } catch (e) {
                                                // Haptics not available
                                            }
                                        }}
                                    >
                                        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/30">
                                            <Heart color="white" size={20} />
                                        </View>
                                        <Text className="text-white text-xs mt-1 font-medium">Like</Text>
                                    </Pressable>

                                    {/* Play Button */}
                                    <Pressable
                                        className="bg-white px-6 py-3 rounded-lg flex-row items-center gap-2 active:scale-95"
                                        onPress={() => router.push({ pathname: "/movie/[id]", params: { id: movie.id } })}
                                    >
                                        <Play color="black" size={20} fill="black" />
                                        <Text className="text-black font-black text-base">Play</Text>
                                    </Pressable>

                                    {/* Info Button */}
                                    <Pressable
                                        className="items-center active:scale-95"
                                        onPress={() => router.push({ pathname: "/movie/[id]", params: { id: movie.id } })}
                                    >
                                        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/30">
                                            <Info color="white" size={20} />
                                        </View>
                                        <Text className="text-white text-xs mt-1 font-medium">Info</Text>
                                    </Pressable>

                                    {/* Share Button */}
                                    <Pressable
                                        className="items-center active:scale-95"
                                        onPress={async () => {
                                            try {
                                                await Share.share({
                                                    message: `Check out ${movie.title} on CineFlix!`,
                                                });
                                            } catch (error) {
                                                // ignore
                                            }
                                        }}
                                    >
                                        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/30">
                                            <Share2 color="white" size={20} />
                                        </View>
                                        <Text className="text-white text-xs mt-1 font-medium">Share</Text>
                                    </Pressable>
                                </Animated.View>

                                {/* Hero Navigation Dots */}
                                {heroMovies.length > 1 && (
                                    <Animated.View
                                        entering={FadeInDown.delay(500)}
                                        className="flex-row items-center gap-2 mt-3"
                                    >
                                        {heroMovies.map((_, index) => (
                                            <Pressable
                                                key={index}
                                                onPress={() => navigateToHero(index)}
                                                className={`rounded-full transition-all ${index === currentHeroIndex
                                                    ? 'w-6 h-2 bg-netflix-red'
                                                    : 'w-2 h-2 bg-white/40'
                                                    }`}
                                            />
                                        ))}
                                    </Animated.View>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Content Rows */}
                <View className="pt-4 pb-20">
                    {/* Trending Movies */}
                    {
                        trendingMovies.length > 0 && (
                            <Animated.View entering={SlideInRight.delay(100)}>
                                <ContentRow
                                    title="🔥 Trending Now"
                                    data={trendingMovies}
                                    mediaType="movie"
                                    onLongPress={(item, type) => setPreviewItem({ item, mediaType: type })}
                                />
                            </Animated.View>
                        )
                    }

                    {/* Popular Movies */}
                    {
                        popularMovies.length > 0 && (
                            <Animated.View entering={SlideInRight.delay(200)}>
                                <ContentRow
                                    title="⭐ Popular Movies"
                                    data={popularMovies}
                                    mediaType="movie"
                                    onLongPress={(item, type) => setPreviewItem({ item, mediaType: type })}
                                />
                            </Animated.View>
                        )
                    }

                    {/* Trending TV Shows */}
                    {
                        trendingTV.length > 0 && (
                            <Animated.View entering={SlideInRight.delay(300)}>
                                <ContentRow
                                    title="📺 Trending TV Shows"
                                    data={trendingTV}
                                    mediaType="tv"
                                    onLongPress={(item, type) => setPreviewItem({ item, mediaType: type })}
                                />
                            </Animated.View>
                        )
                    }

                    {/* Top Rated Movies */}
                    {
                        topRatedMovies.length > 0 && (
                            <Animated.View entering={SlideInRight.delay(400)}>
                                <ContentRow
                                    title="🏆 Top Rated"
                                    data={topRatedMovies}
                                    mediaType="movie"
                                    onLongPress={(item, type) => setPreviewItem({ item, mediaType: type })}
                                />
                            </Animated.View>
                        )
                    }

                    {/* Popular TV Shows */}
                    {
                        popularTV.length > 0 && (
                            <Animated.View entering={SlideInRight.delay(500)}>
                                <ContentRow
                                    title="🌟 Popular TV Shows"
                                    data={popularTV}
                                    mediaType="tv"
                                    onLongPress={(item, type) => setPreviewItem({ item, mediaType: type })}
                                />
                            </Animated.View>
                        )
                    }

                    {/* Genre Collections - Dynamic (All Movie & TV Genres) */}
                    {
                        genreSections.map((section, index) => {
                            // Genre emoji mapping (similar to web's GENRE_ICONS)
                            const genreEmojis: { [key: number]: string } = {
                                28: '💥', // Action
                                12: '🗺️', // Adventure
                                16: '🎨', // Animation
                                35: '😂', // Comedy
                                80: '🔍', // Crime
                                99: '📺', // Documentary
                                18: '🎭', // Drama
                                10751: '👨‍👩‍👧‍👦', // Family
                                14: '✨', // Fantasy
                                36: '📜', // History
                                27: '👻', // Horror
                                10402: '🎵', // Music
                                9648: '🕵️', // Mystery
                                10749: '💕', // Romance
                                878: '🚀', // Sci-Fi
                                10770: '📺', // TV Movie
                                53: '😰', // Thriller
                                10752: '⚔️', // War
                                37: '🤠', // Western
                                10759: '⚡', // Action & Adventure (TV)
                                10762: '👶', // Kids (TV)
                                10763: '📰', // News (TV)
                                10764: '🎯', // Reality (TV)
                                10765: '🔮', // Sci-Fi & Fantasy (TV)
                                10766: '🧼', // Soap (TV)
                                10767: '💬', // Talk (TV)
                                10768: '🎖️', // War & Politics (TV)
                            };

                            const emoji = genreEmojis[section.id] || '🎬';
                            const label = section.type === 'movie' ? 'Movies' : 'TV Shows';

                            return (
                                <Animated.View
                                    key={`${section.type}-${section.id}`}
                                    entering={SlideInRight.delay(600 + (index * 50))}
                                >
                                    <ContentRow
                                        title={`${emoji} ${section.name} ${label}`}
                                        data={section.items}
                                        mediaType={section.type}
                                        genreId={section.id}
                                        genreName={section.name}
                                        onLongPress={(item, type) => setPreviewItem({ item, mediaType: type })}
                                    />
                                </Animated.View>
                            );
                        })
                    }
                </View>
            </ScrollView>

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
