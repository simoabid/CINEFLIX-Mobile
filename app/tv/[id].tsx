import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { View, Text, ScrollView, Dimensions, Pressable, ActivityIndicator, Image, Linking, Share, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import * as tmdb from "../../services/tmdb";
import YoutubePlayer from "react-native-youtube-iframe";
import { TVShow, MovieCredits, Video, CastMember, CrewMember, Season, Episode, WatchProvidersResponse, ExternalIds } from "../../types";
import { ChevronLeft, Play, Plus, Share2, Star, Clock, Calendar, X, Info, Instagram, Twitter, ExternalLink, Globe, Film, Languages, User, Maximize, Minimize, PlayCircle } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import { myListService } from '../../services/myListService';

const { width, height } = Dimensions.get('window');

export default function TVDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // --- State ---
    const contentId = parseInt(id as string);

    const [content, setContent] = useState<TVShow | null>(null);
    const [credits, setCredits] = useState<MovieCredits | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [similar, setSimilar] = useState<TVShow[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [activeTab, setActiveTab] = useState<'cast' | 'crew'>('cast');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [trailerModalVisible, setTrailerModalVisible] = useState(false);
    const [playingVideoKey, setPlayingVideoKey] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Data State
    const [watchProviders, setWatchProviders] = useState<WatchProvidersResponse | null>(null);
    const [externalIds, setExternalIds] = useState<ExternalIds | null>(null);

    // TV Specific State
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);
    const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

    // --- Effects ---

    useEffect(() => {
        if (!contentId) return;
        loadContent();
    }, [contentId]);

    // Load Episodes when Season changes
    useEffect(() => {
        if (selectedSeasonNumber !== null) {
            loadEpisodes(selectedSeasonNumber);
        }
    }, [selectedSeasonNumber]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const [details, creds, vids, sims, providers, extIds] = await Promise.all([
                tmdb.getTVShowDetails(contentId),
                tmdb.getTVShowCredits(contentId),
                tmdb.getTVShowVideos(contentId),
                tmdb.getEnhancedSimilarTVShows({ id: contentId } as TVShow),
                tmdb.getWatchProviders(contentId, 'tv'),
                tmdb.getTVShowExternalIds(contentId)
            ]);

            setContent(details);
            setCredits(creds);
            setVideos(vids.filter(v => v.site === "YouTube"));
            setSimilar(sims); // getEnhancedSimilarTVShows returns array directly
            setWatchProviders(providers);
            setExternalIds(extIds);
            setLogoUrl(details.logo_path ? tmdb.getImageUrl(details.logo_path, 'w500') : null);

            // Handle Seasons
            if (details.seasons && details.seasons.length > 0) {
                setSeasons(details.seasons);
                // Select first regular season (season 1 or higher), or first season if no regular seasons
                const firstSeason = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
                setSelectedSeasonNumber(firstSeason.season_number);
            }
        } catch (e) {
            console.error("Failed to load TV show details", e);
        } finally {
            setLoading(false);
        }
    };

    const loadEpisodes = async (seasonNum: number) => {
        setLoadingEpisodes(true);
        try {
            const data = await tmdb.getTVShowSeasonDetails(contentId, seasonNum);
            setEpisodes(data.episodes || []);
        } catch (e) {
            console.error("Failed to load episodes", e);
        } finally {
            setLoadingEpisodes(false);
        }
    };

    // --- Actions ---

    const handleAddToList = async () => {
        if (!content) return;
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await myListService.addToList(content, 'tv');
            console.log('Added to list:', content.id);
        } catch (error) {
            console.error('Failed to add to list', error);
        }
    };

    const openTrailer = (videoKey?: string) => {
        const key = videoKey || (videos.length > 0 ? videos[0].key : null);
        if (key) {
            setPlayingVideoKey(key);
            setTrailerModalVisible(true);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${content?.name} on CineFlix!`,
                url: `https://www.themoviedb.org/tv/${contentId}`
            });
        } catch (error) {
            // ignore
        }
    };

    // --- Render Helpers ---

    if (loading) {
        return (
            <View className="flex-1 bg-netflix-black justify-center items-center">
                <ActivityIndicator color="#E50914" size="large" />
            </View>
        );
    }

    if (!content) return null;

    const title = content.name;
    const year = content.first_air_date ? new Date(content.first_air_date).getFullYear() : '';
    const numberOfSeasons = content.number_of_seasons;
    const metaText = `${numberOfSeasons} Season${numberOfSeasons !== 1 ? 's' : ''}`;
    const episodeRuntime = content.episode_run_time?.[0];

    const displayedCast = activeTab === 'cast' ? credits?.cast : credits?.crew.filter(c => ['Creator', 'Executive Producer', 'Director'].includes(c.job));

    return (
        <View className="flex-1 bg-netflix-black">
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Section with Centered Poster */}
                <View className="relative w-full bg-black" style={{ minHeight: height * 0.75 }}>
                    {/* Blurred Backdrop */}
                    <Image
                        source={{ uri: tmdb.getImageUrl(content.backdrop_path || content.poster_path, 'original') }}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                        blurRadius={20}
                        resizeMode="cover"
                    />

                    {/* Dark Overlay */}
                    <View className="absolute inset-0 bg-black/70" />

                    {/* Top Gradient for Status Bar */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.8)', 'transparent']}
                        className="absolute top-0 w-full h-32"
                    />

                    {/* Nav Bar */}
                    <SafeAreaView className="absolute top-0 w-full flex-row justify-between items-center px-4 z-50">
                        <Pressable
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md border border-white/10"
                        >
                            <ChevronLeft color="white" size={24} />
                        </Pressable>
                        <Pressable
                            onPress={handleShare}
                            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md border border-white/10"
                        >
                            <Share2 color="white" size={20} />
                        </Pressable>
                    </SafeAreaView>

                    {/* Content Container - Flex Column */}
                    <View className="flex-1 items-center justify-start pt-20 pb-8 px-4">
                        {/* Centered Poster Card */}
                        <Animated.View
                            entering={FadeIn.duration(600)}
                            className="rounded-2xl overflow-hidden border border-white/10 mb-6"
                            style={{
                                width: Math.min(width * 0.65, 280),
                                height: Math.min(width * 0.65, 280) * 1.5,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 12 },
                                shadowOpacity: 0.6,
                                shadowRadius: 20,
                                elevation: 20,
                            }}
                        >
                            <Image
                                source={{ uri: tmdb.getImageUrl(content.poster_path, 'w500') }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />

                            {/* Rating Badge - Top Right */}
                            <View className="absolute top-3 right-3 bg-black/90 px-2.5 py-1.5 rounded-lg border border-white/10">
                                <View className="flex-row items-center gap-1">
                                    <Star size={12} fill="#EAB308" color="#EAB308" />
                                    <Text className="text-white font-bold text-sm">
                                        {content.vote_average.toFixed(1)}
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Content Below Poster */}
                        <View className="w-full items-center">
                            {/* Logo or Title */}
                            {logoUrl ? (
                                <Animated.View entering={FadeInDown.duration(600).delay(200)} className="h-16 w-48 mb-4">
                                    <Image source={{ uri: logoUrl }} className="w-full h-full" resizeMode="contain" />
                                </Animated.View>
                            ) : (
                                <Animated.Text
                                    entering={FadeInDown.duration(600).delay(200)}
                                    className="text-white font-bold text-2xl mb-3 text-center"
                                >
                                    {title}
                                </Animated.Text>
                            )}

                            {/* Metadata Row */}
                            <Animated.View
                                entering={FadeInDown.duration(600).delay(300)}
                                className="flex-row justify-center items-center flex-wrap gap-x-3 gap-y-1 mb-5"
                            >
                                {/* Year */}
                                {year && <Text className="text-gray-300 text-sm font-semibold uppercase">{year}</Text>}

                                {/* Separator */}
                                {year && metaText && <Text className="text-gray-500">•</Text>}

                                {/* Seasons */}
                                <Text className="text-gray-300 text-sm font-semibold uppercase">{metaText}</Text>

                                {/* Runtime per episode */}
                                {episodeRuntime && (
                                    <>
                                        <Text className="text-gray-500">•</Text>
                                        <Text className="text-gray-300 text-sm">{episodeRuntime}min/ep</Text>
                                    </>
                                )}

                                {/* Genres */}
                                {content.genres && content.genres.length > 0 && (
                                    <>
                                        <Text className="text-gray-500">•</Text>
                                        <Text className="text-gray-400 text-sm" numberOfLines={1}>
                                            {content.genres.slice(0, 2).map(g => g.name).join(' • ')}
                                        </Text>
                                    </>
                                )}
                            </Animated.View>

                            {/* Buttons */}
                            <Animated.View
                                entering={FadeInDown.duration(600).delay(400)}
                                className="flex-row gap-3 w-full max-w-sm"
                            >
                                <Pressable
                                    className="flex-1 bg-white rounded-xl flex-row items-center justify-center h-12 active:scale-95"
                                    onPress={() => openTrailer()}
                                >
                                    <Play fill="black" size={20} color="black" />
                                    <Text className="text-black font-black text-base ml-2">Play</Text>
                                </Pressable>

                                <Pressable
                                    onPress={handleAddToList}
                                    className="flex-1 bg-gray-800/90 rounded-xl flex-row items-center justify-center h-12 active:scale-95 border border-white/20">
                                    <Plus size={20} color="white" />
                                    <Text className="text-white font-bold text-base ml-2">My List</Text>
                                </Pressable>
                            </Animated.View>
                        </View>
                    </View>

                    {/* Gradient blend to background */}
                    <LinearGradient
                        colors={['transparent', '#141414']}
                        locations={[0, 1]}
                        className="absolute bottom-0 w-full h-24"
                        pointerEvents="none"
                    />
                </View>

                {/* Body Content */}
                <View className="px-4 -mt-2 pb-12">
                    {/* Overview */}
                    <Text className="text-gray-300 text-base leading-6 font-normal mb-6">
                        {content.overview}
                    </Text>

                    {/* Genres */}
                    <View className="flex-row flex-wrap gap-2 mb-8">
                        {content.genres?.map(g => (
                            <View key={g.id} className="px-3 py-1.5 bg-gray-800 rounded-full border border-white/5">
                                <Text className="text-gray-300 text-xs">{g.name}</Text>
                            </View>
                        ))}
                    </View>

                    {/* TV SEASONS & EPISODES SECTION */}
                    {seasons.length > 0 && (
                        <View className="mb-8">
                            {/* Season Selector Header */}
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-white font-bold text-lg">Episodes</Text>
                                <Text className="text-gray-500 text-xs">{episodes.length} Episodes</Text>
                            </View>

                            {/* Season Tabs */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                {seasons.map((season) => (
                                    <Pressable
                                        key={season.id}
                                        onPress={() => setSelectedSeasonNumber(season.season_number)}
                                        className={`mr-3 px-4 py-2 rounded-lg border ${selectedSeasonNumber === season.season_number
                                            ? 'bg-netflix-red border-netflix-red'
                                            : 'bg-gray-800 border-gray-700'
                                            }`}
                                    >
                                        <Text className={`font-semibold ${selectedSeasonNumber === season.season_number ? 'text-white' : 'text-gray-400'}`}>
                                            {season.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* Episodes List */}
                            {loadingEpisodes ? (
                                <ActivityIndicator color="#E50914" className="py-8" />
                            ) : (
                                <View className="space-y-4">
                                    {episodes.map((ep) => (
                                        <Pressable
                                            key={ep.id}
                                            className="flex-row gap-4 mb-4"
                                            onPress={() => setExpandedEpisode(expandedEpisode === ep.episode_number ? null : ep.episode_number)}
                                        >
                                            {/* Episode Thumbnail */}
                                            <View className="w-32 h-20 bg-gray-800 rounded overflow-hidden relative justify-center items-center">
                                                {ep.still_path ? (
                                                    <Image source={{ uri: tmdb.getImageUrl(ep.still_path, 'w300') }} className="w-full h-full" resizeMode="cover" />
                                                ) : (
                                                    <PlayCircle size={24} color="gray" />
                                                )}
                                                <View className="absolute bg-black/50 p-1 rounded-full"><Play size={12} fill="white" color="white" /></View>
                                            </View>

                                            {/* Episode Info */}
                                            <View className="flex-1 justify-center">
                                                <Text className="text-white font-bold text-sm mb-1">{ep.episode_number}. {ep.name}</Text>
                                                <Text className="text-gray-400 text-xs mb-1" numberOfLines={expandedEpisode === ep.episode_number ? undefined : 2}>
                                                    {ep.overview}
                                                </Text>
                                                <Text className="text-gray-500 text-[10px]">{ep.vote_average ? `${ep.vote_average.toFixed(1)} ★` : ''} • {ep.runtime}m</Text>
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* CAST / CREW SECTION */}
                    <View className="mb-8">
                        <View className="flex-row items-center gap-6 mb-4 border-b border-gray-800 pb-2">
                            <Pressable onPress={() => setActiveTab('cast')}>
                                <Text className={`text-lg font-bold pb-2 ${activeTab === 'cast' ? 'text-white border-b-2 border-netflix-red' : 'text-gray-500'}`}>
                                    Cast
                                </Text>
                            </Pressable>
                            <Pressable onPress={() => setActiveTab('crew')}>
                                <Text className={`text-lg font-bold pb-2 ${activeTab === 'crew' ? 'text-white border-b-2 border-netflix-red' : 'text-gray-500'}`}>
                                    Crew
                                </Text>
                            </Pressable>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {displayedCast?.slice(0, 20).map((person) => (
                                <Pressable
                                    key={person.id}
                                    className="mr-4 w-24 items-center"
                                    onPress={() => router.push({ pathname: "/person/[id]", params: { id: person.id } })}
                                >
                                    <View className="w-20 h-20 rounded-full bg-gray-800 mb-2 overflow-hidden border border-white/10">
                                        <Image source={{ uri: tmdb.getImageUrl(person.profile_path, 'w185') }} className="w-full h-full" resizeMode="cover" />
                                    </View>
                                    <Text className="text-gray-200 text-xs font-semibold text-center leading-4 mb-0.5" numberOfLines={1}>{person.name}</Text>
                                    <Text className="text-gray-500 text-[10px] text-center leading-3" numberOfLines={2}>
                                        {'character' in person ? (person as CastMember).character : (person as CrewMember).job}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    {/* TRAILERS */}
                    {videos.length > 0 && (
                        <View className="mb-8">
                            <Text className="text-white font-bold text-lg mb-4">Trailers & Info</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {videos.map(v => (
                                    <Pressable key={v.key} className="mr-4 w-64 relative" onPress={() => openTrailer(v.key)}>
                                        <View className="w-64 h-36 bg-gray-800 rounded-lg overflow-hidden border border-white/10 mb-2">
                                            <Image source={{ uri: `https://img.youtube.com/vi/${v.key}/maxresdefault.jpg` }} className="w-full h-full opacity-90" resizeMode="cover" />
                                            <View className="absolute inset-0 items-center justify-center bg-black/20">
                                                <View className="w-12 h-12 rounded-full bg-black/60 items-center justify-center border-2 border-white"><Play fill="white" size={20} color="white" /></View>
                                            </View>
                                        </View>
                                        <Text className="text-gray-300 text-sm font-medium" numberOfLines={1}>{v.name}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* SIMILAR TV SHOWS */}
                    {similar.length > 0 && (
                        <View className="mb-20">
                            <Text className="text-white font-bold text-lg mb-4">More Like This</Text>
                            <View className="flex-row flex-wrap justify-between">
                                {similar.slice(0, 9).map((item) => {
                                    const itemYear = item.first_air_date ? new Date(item.first_air_date).getFullYear() : '';
                                    return (
                                        <Pressable
                                            key={item.id}
                                            className="w-[32%] mb-4"
                                            onPress={() => router.push({ pathname: "/tv/[id]", params: { id: item.id } })}
                                        >
                                            <View className="w-full aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden border border-white/5 mb-1.5">
                                                <Image source={{ uri: tmdb.getImageUrl(item.poster_path, 'w342') }} className="w-full h-full" resizeMode="cover" />
                                            </View>

                                            <View className="flex-row items-center justify-between px-1">
                                                <Text className="text-gray-400 text-[10px] font-medium">{itemYear}</Text>
                                                {item.vote_average > 0 && (
                                                    <View className="flex-row items-center gap-0.5">
                                                        <Star size={10} color="#fbbf24" fill="#fbbf24" />
                                                        <Text className="text-gray-300 text-[10px] font-bold">{item.vote_average.toFixed(1)}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* --- EXTENDED SECTIONS --- */}

                    {/* Where to Watch */}
                    {watchProviders?.results?.US && watchProviders.results.US.flatrate && watchProviders.results.US.flatrate.length > 0 && (
                        <View className="mb-8 p-4 bg-gray-900/50 rounded-2xl border border-white/5 mx-[-4]">
                            <View className="flex-row items-center gap-2 mb-4">
                                <View className="w-1 h-4 bg-netflix-red rounded-full" />
                                <Text className="text-white font-bold text-lg">Where to Watch</Text>
                            </View>

                            <View className="gap-3">
                                {watchProviders.results.US.flatrate.map((provider) => (
                                    <View key={provider.provider_id} className="flex-row items-center justify-between bg-gray-800/80 p-3 rounded-xl border border-white/5">
                                        <View className="flex-row items-center gap-3">
                                            <Image source={{ uri: tmdb.getImageUrl(provider.logo_path, 'w92') }} className="w-10 h-10 rounded-lg" resizeMode="contain" />
                                            <View>
                                                <Text className="text-white font-bold text-sm">{provider.provider_name}</Text>
                                                <Text className="text-green-400 text-[10px] font-bold">Subscription</Text>
                                            </View>
                                        </View>
                                        <View className="bg-gray-700 px-2 py-1 rounded">
                                            <Text className="text-gray-300 text-[10px] font-bold uppercase">Stream</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* TV Show Stats */}
                    <View className="mb-8">
                        <View className="flex-row items-center gap-2 mb-4">
                            <View className="w-1 h-4 bg-netflix-red rounded-full" />
                            <Text className="text-white font-bold text-lg">Stats</Text>
                        </View>

                        <View className="bg-gray-900/50 rounded-2xl p-4 border border-white/5 space-y-4">
                            {/* Rating */}
                            <View className="flex-row items-center gap-3 pb-3 border-b border-white/5">
                                <View className="w-10 h-10 rounded-full bg-yellow-500/20 items-center justify-center">
                                    <Star size={20} color="#EAB308" fill="#EAB308" />
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider">Rating</Text>
                                    <Text className="text-white font-bold text-lg">{content.vote_average.toFixed(1)}<Text className="text-gray-500 text-sm">/10</Text></Text>
                                    <Text className="text-gray-500 text-[10px] font-medium">{content.vote_count.toLocaleString()} votes</Text>
                                </View>
                            </View>

                            {/* Seasons */}
                            <View className="flex-row items-center gap-3 pb-3 border-b border-white/5">
                                <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
                                    <Film size={20} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider">Seasons</Text>
                                    <Text className="text-white font-bold text-lg">{numberOfSeasons} Season{numberOfSeasons !== 1 ? 's' : ''}</Text>
                                    <Text className="text-gray-500 text-[10px] font-medium">{content.number_of_episodes} episodes total</Text>
                                </View>
                            </View>


                        </View>
                    </View>

                    {/* Information Cards */}
                    <View className="mb-8">
                        <View className="flex-row items-center gap-2 mb-4">
                            <View className="w-1 h-4 bg-netflix-red rounded-full" />
                            <Text className="text-white font-bold text-lg">Information</Text>
                        </View>

                        <View className="gap-3">
                            {/* Status */}
                            <View className="bg-gray-900/50 p-4 rounded-xl border border-white/5 flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center"><Info size={16} color="#A855F7" /></View>
                                    <View>
                                        <Text className="text-gray-400 text-xs uppercase font-bold">Status</Text>
                                        <Text className="text-white font-semibold">{content.status || 'Ended'}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* First Air Date */}
                            {content.first_air_date && (
                                <View className="bg-gray-900/50 p-4 rounded-xl border border-white/5 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center"><Calendar size={16} color="#3B82F6" /></View>
                                        <View>
                                            <Text className="text-gray-400 text-xs uppercase font-bold">First Air Date</Text>
                                            <Text className="text-white font-semibold">{new Date(content.first_air_date).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {content.first_air_date && (
                                <View className="bg-gray-900/50 p-4 rounded-xl border border-white/5 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-8 h-8 rounded-full bg-orange-500/20 items-center justify-center"><Calendar size={16} color="#F97316" /></View>
                                        <View>
                                            <Text className="text-gray-400 text-xs uppercase font-bold">Last Air Date</Text>
                                            <Text className="text-white font-semibold">{new Date(content.first_air_date).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Language */}
                            <View className="bg-gray-900/50 p-4 rounded-xl border border-white/5 flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center"><Languages size={16} color="#3B82F6" /></View>
                                    <View>
                                        <Text className="text-gray-400 text-xs uppercase font-bold">Language</Text>
                                        <Text className="text-white font-semibold">{content.spoken_languages && content.spoken_languages.length > 0 ? content.spoken_languages[0].english_name : 'English'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Production Companies */}
                    {content.production_companies && content.production_companies.length > 0 && (
                        <View className="mb-8">
                            <View className="flex-row items-center gap-2 mb-4">
                                <View className="w-1 h-4 bg-netflix-red rounded-full" />
                                <Text className="text-white font-bold text-lg">Production</Text>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
                                {content.production_companies.slice(0, 5).map(company => (
                                    <View key={company.id} className="w-32 h-20 bg-white/5 rounded-xl border border-white/10 p-3 items-center justify-center">
                                        {company.logo_path ? (
                                            <Image source={{ uri: tmdb.getImageUrl(company.logo_path, 'w300') }} className="w-full h-full" resizeMode="contain" style={{ tintColor: 'white' }} />
                                        ) : (
                                            <Text className="text-gray-400 text-xs font-bold text-center">{company.name}</Text>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Social Links */}
                    <View className="mb-12">
                        <View className="flex-row items-center gap-2 mb-4">
                            <View className="w-1 h-4 bg-netflix-red rounded-full" />
                            <Text className="text-white font-bold text-lg">Links</Text>
                        </View>

                        <View className="gap-3">
                            {externalIds?.instagram_id && (
                                <Pressable
                                    onPress={() => Linking.openURL(`https://instagram.com/${externalIds.instagram_id}`)}
                                    className="flex-row items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-white/5"
                                >
                                    <View className="w-10 h-10 rounded-full bg-pink-500/20 items-center justify-center"><Instagram size={20} color="#EC4899" /></View>
                                    <View>
                                        <Text className="text-white font-bold text-sm">Instagram</Text>
                                        <Text className="text-gray-500 text-xs">Follow for updates</Text>
                                    </View>
                                    <ExternalLink size={16} color="#6B7280" className="ml-auto" />
                                </Pressable>
                            )}

                            {externalIds?.twitter_id && (
                                <Pressable
                                    onPress={() => Linking.openURL(`https://twitter.com/${externalIds.twitter_id}`)}
                                    className="flex-row items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-white/5"
                                >
                                    <View className="w-10 h-10 rounded-full bg-blue-400/20 items-center justify-center"><Twitter size={20} color="#60A5FA" /></View>
                                    <View>
                                        <Text className="text-white font-bold text-sm">Twitter</Text>
                                        <Text className="text-gray-500 text-xs">Follow the conversation</Text>
                                    </View>
                                    <ExternalLink size={16} color="#6B7280" className="ml-auto" />
                                </Pressable>
                            )}

                            {externalIds?.imdb_id && (
                                <Pressable
                                    onPress={() => Linking.openURL(`https://www.imdb.com/title/${externalIds.imdb_id}`)}
                                    className="flex-row items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-white/5"
                                >
                                    <View className="w-10 h-10 rounded-full bg-yellow-400/20 items-center justify-center"><Text className="text-yellow-400 font-bold text-xs">IMDb</Text></View>
                                    <View>
                                        <Text className="text-white font-bold text-sm">IMDb</Text>
                                        <Text className="text-gray-500 text-xs">Full cast & crew</Text>
                                    </View>
                                    <ExternalLink size={16} color="#6B7280" className="ml-auto" />
                                </Pressable>
                            )}

                            {content.homepage && (
                                <Pressable
                                    onPress={() => Linking.openURL(content.homepage!)}
                                    className="flex-row items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-white/5"
                                >
                                    <View className="w-10 h-10 rounded-full bg-gray-500/20 items-center justify-center"><Globe size={20} color="#9CA3AF" /></View>
                                    <View>
                                        <Text className="text-white font-bold text-sm">Website</Text>
                                        <Text className="text-gray-500 text-xs">Visit homepage</Text>
                                    </View>
                                    <ExternalLink size={16} color="#6B7280" className="ml-auto" />
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Trailer Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={trailerModalVisible}
                onRequestClose={() => {
                    setTrailerModalVisible(false);
                    setPlayingVideoKey(null);
                }}
            >
                <View className={`flex-1 justify-center items-center relative ${isFullScreen ? 'bg-black px-0' : 'bg-black/80 px-4'}`}>
                    <Pressable
                        onPress={() => {
                            setTrailerModalVisible(false);
                            setPlayingVideoKey(null);
                            setIsFullScreen(false);
                        }}
                        className={`absolute right-6 p-3 bg-white/10 rounded-full z-50 border border-white/20 active:bg-white/20 ${isFullScreen ? 'top-10' : 'top-16'}`}
                    >
                        <X color="white" size={24} />
                    </Pressable>

                    <Pressable
                        onPress={() => setIsFullScreen(!isFullScreen)}
                        className={`absolute left-6 p-3 bg-white/10 rounded-full z-50 border border-white/20 active:bg-white/20 ${isFullScreen ? 'top-10' : 'top-16'}`}
                    >
                        {isFullScreen ? <Minimize color="white" size={24} /> : <Maximize color="white" size={24} />}
                    </Pressable>

                    <View className={`w-full bg-black overflow-hidden shadow-2xl border border-white/10 ${isFullScreen ? 'h-full justify-center border-0' : 'rounded-2xl'}`}>
                        <YoutubePlayer
                            height={isFullScreen ? height : 230}
                            play={true}
                            videoId={playingVideoKey || ""}
                            onChangeState={(event: string) => {
                                if (event === "ended") {
                                    setTrailerModalVisible(false);
                                    setIsFullScreen(false);
                                }
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
