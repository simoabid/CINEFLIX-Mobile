import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { View, Text, ScrollView, Dimensions, Pressable, ActivityIndicator, Image, Linking, Share, Modal, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import * as tmdb from "../../services/tmdb";
import { PersonDetails, PersonMovieCredits, Movie, TVShow } from "../../types";
import { ChevronLeft, Share2, Globe, Calendar, MapPin, ChevronDown, ChevronUp, X, ChevronRight, Star } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

export default function PersonDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const personId = parseInt(id as string);

    const [details, setDetails] = useState<PersonDetails | null>(null);
    const [credits, setCredits] = useState<PersonMovieCredits | null>(null);
    const [loading, setLoading] = useState(true);
    const [bioExpanded, setBioExpanded] = useState(false);
    const [showAllCredits, setShowAllCredits] = useState(false);

    useEffect(() => {
        loadData();
    }, [personId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [d, c] = await Promise.all([
                tmdb.getPersonDetails(personId),
                tmdb.getPersonMovieCredits(personId)
            ]);
            setDetails(d);
            setCredits(c);
        } catch (e) {
            console.error("Failed to load person details", e);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!details) return;
        try {
            await Share.share({
                message: `Check out ${details.name} on CineFlix!`,
                url: `https://www.themoviedb.org/person/${personId}`
            });
        } catch (error) {
            // ignore
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-netflix-black justify-center items-center">
                <ActivityIndicator color="#E50914" size="large" />
            </View>
        );
    }

    if (!details) return null;

    // Sort credits by popularity
    const allCredits = credits?.cast.sort((a, b) => b.popularity - a.popularity) || [];
    const topCredits = allCredits.slice(0, 20);

    return (
        <View className="flex-1 bg-netflix-black">
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Image */}
                <View className="relative h-[500px] w-full">
                    {details.profile_path ? (
                        <Image
                            source={{ uri: tmdb.getImageUrl(details.profile_path, 'h632') }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-gray-800 justify-center items-center">
                            <Text className="text-gray-500 text-lg">No Image Available</Text>
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', '#141414']}
                        locations={[0.6, 1]}
                        className="absolute bottom-0 w-full h-full"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent']}
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

                    {/* Name Overlay */}
                    <View className="absolute bottom-0 w-full px-5 pb-8">
                        <Animated.Text entering={FadeInDown.duration(600)} className="text-white font-black text-4xl mb-2 shadow-sm">
                            {details.name}
                        </Animated.Text>
                        <View className="flex-row items-center gap-2 mb-2">
                            <Text className="text-gray-300 font-medium text-sm bg-white/10 px-2 py-0.5 rounded">
                                {details.known_for_department}
                            </Text>
                            {details.birthday && (
                                <Text className="text-gray-400 text-sm">
                                    • {new Date(details.birthday).getFullYear()}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Details Section */}
                <View className="px-5 -mt-4 pb-10">
                    {/* Stats/Info Row */}
                    <View className="flex-row gap-4 mb-6">
                        {details.place_of_birth && (
                            <View className="flex-row items-center gap-1.5 flex-1">
                                <MapPin size={14} color="#9CA3AF" />
                                <Text className="text-gray-400 text-xs flex-1" numberOfLines={1}>
                                    {details.place_of_birth}
                                </Text>
                            </View>
                        )}
                        {details.birthday && (
                            <View className="flex-row items-center gap-1.5">
                                <Calendar size={14} color="#9CA3AF" />
                                <Text className="text-gray-400 text-xs">
                                    {new Date(details.birthday).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Biography */}
                    {details.biography ? (
                        <Pressable onPress={() => setBioExpanded(!bioExpanded)} className="mb-8">
                            <Text className="text-white font-bold text-lg mb-2">Biography</Text>
                            <Text className="text-gray-300 text-sm leading-6" numberOfLines={bioExpanded ? undefined : 4}>
                                {details.biography}
                            </Text>
                            <View className="flex-row items-center justify-center mt-2 opacity-60">
                                {bioExpanded ? <ChevronUp color="white" size={16} /> : <ChevronDown color="white" size={16} />}
                            </View>
                        </Pressable>
                    ) : null}

                    {/* Filmography */}
                    {topCredits.length > 0 && (
                        <View className="mb-8">
                            <View className="flex-row justify-between items-center mb-4 pl-1 border-l-4 border-netflix-red ml-1 pr-1">
                                <Text className="text-white font-bold text-lg">Known For</Text>
                                <Pressable onPress={() => setShowAllCredits(true)} className="flex-row items-center">
                                    <Text className="text-netflix-red font-semibold text-sm">See All</Text>
                                    <ChevronRight size={16} color="#E50914" />
                                </Pressable>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                                {topCredits.map((item) => (
                                    <Pressable
                                        key={item.id}
                                        className="mr-3 w-32"
                                        onPress={() => router.push({ pathname: "/movie/[id]", params: { id: item.id, type: 'movie' } })}
                                    >
                                        <View className="w-32 h-48 bg-gray-800 rounded-lg overflow-hidden border border-white/10 mb-2">
                                            {item.poster_path ? (
                                                <Image
                                                    source={{ uri: tmdb.getImageUrl(item.poster_path, 'w342') }}
                                                    className="w-full h-full"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View className="w-full h-full items-center justify-center p-2">
                                                    <Text className="text-gray-500 text-xs text-center">{item.title}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text className="text-gray-200 text-xs font-bold leading-4" numberOfLines={2}>{item.title}</Text>
                                        {item.character ? (
                                            <Text className="text-gray-500 text-[10px] leading-3 mt-0.5" numberOfLines={1}>as {item.character}</Text>
                                        ) : null}
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* All Credits Modal */}
            <Modal
                visible={showAllCredits}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAllCredits(false)}
            >
                <View className="flex-1 bg-netflix-black pt-4">
                    <View className="flex-row justify-between items-center px-4 pb-4 border-b border-white/10">
                        <Text className="text-white font-bold text-xl">Filmography</Text>
                        <Pressable onPress={() => setShowAllCredits(false)} className="p-2 bg-gray-800 rounded-full">
                            <X color="white" size={20} />
                        </Pressable>
                    </View>

                    <FlatList
                        data={allCredits}
                        numColumns={3}
                        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        renderItem={({ item }) => (
                            <Pressable
                                className="w-[32%] mb-4"
                                onPress={() => {
                                    setShowAllCredits(false);
                                    router.push({ pathname: "/movie/[id]", params: { id: item.id, type: 'movie' } }); // Assuming most are movies for now
                                }}
                            >
                                <View className="w-full aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden border border-white/10 mb-2">
                                    {item.poster_path ? (
                                        <Image
                                            source={{ uri: tmdb.getImageUrl(item.poster_path, 'w342') }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center p-2">
                                            <Text className="text-gray-500 text-xs text-center">{item.title}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text className="text-gray-200 text-xs font-semibold leading-3" numberOfLines={2}>{item.title}</Text>
                                <View className="flex-row items-center justify-between mt-0.5">
                                    {item.release_date ? (
                                        <Text className="text-gray-500 text-[10px]">{new Date(item.release_date).getFullYear()}</Text>
                                    ) : <View />}

                                    {item.vote_average > 0 && (
                                        <View className="flex-row items-center gap-1">
                                            <Star size={10} color="#fbbf24" fill="#fbbf24" />
                                            <Text className="text-gray-400 text-[10px]">{item.vote_average.toFixed(1)}</Text>
                                        </View>
                                    )}
                                </View>
                            </Pressable>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
}
