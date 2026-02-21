import React from "react";
import { Modal, View, Text, Pressable, Dimensions, ScrollView } from "react-native";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Play, Plus, Heart, Star } from "lucide-react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Movie, TVShow } from "../types";
import * as tmdb from "../services/tmdb";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);
const BACKDROP_HEIGHT = 160;
const POSTER_WIDTH = 80;
const POSTER_HEIGHT = 120;

interface LongPressPreviewModalProps {
    visible: boolean;
    item: Movie | TVShow | null;
    mediaType: 'movie' | 'tv';
    onClose: () => void;
    onPlay: () => void;
}

const LongPressPreviewModal: React.FC<LongPressPreviewModalProps> = ({
    visible,
    item,
    mediaType,
    onClose,
    onPlay,
}) => {
    if (!item) return null;

    const title = 'title' in item ? item.title : item.name;
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const rating = item.vote_average || 0;
    const overview = item.overview || 'No description available.';

    const handleAddToList = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Dynamic import of the service to avoid circular dependencies if any
            const { myListService } = await import('../services/myListService');
            // Assuming the function toggleInList is available on the service directly or via hook
            await myListService.addToList(item, mediaType);
            console.log('Added to list:', item.id);
        } catch (error) {
            console.error('Failed to add to list', error);
        }
    };

    const handleLike = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const { myListService } = await import('../services/myListService');
            await myListService.likeContent(item, mediaType);
            console.log('Liked:', item.id);
        } catch (error) {
            console.error('Failed to like', error);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Backdrop */}
            <Pressable
                className="flex-1 bg-black/85 justify-center items-center"
                onPress={onClose}
            >
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    className="absolute inset-0 bg-black/85"
                />

                {/* Modal Content */}
                <Pressable
                    onPress={(e) => e.stopPropagation()}
                >
                    <Animated.View
                        entering={SlideInDown.springify().damping(20).stiffness(200)}
                        exiting={SlideOutDown.duration(200)}
                        className="bg-[#1A1A2E] rounded-2xl overflow-hidden border border-white/10"
                        style={{
                            width: MODAL_WIDTH,
                            maxHeight: SCREEN_HEIGHT * 0.8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.5,
                            shadowRadius: 20,
                            elevation: 20,
                        }}
                    >
                        {/* Backdrop Image */}
                        <View style={{ height: BACKDROP_HEIGHT }} className="relative">
                            <Image
                                source={{ uri: tmdb.getImageUrl(item.backdrop_path || item.poster_path, 'w780') }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(26,26,26,0.6)', 'rgba(26,26,26,0.95)']}
                                locations={[0, 0.5, 1]}
                                className="absolute bottom-0 w-full h-full"
                            />

                            {/* Rating Badge */}
                            {rating > 0 && (
                                <View className="absolute top-3 right-3 bg-black/80 backdrop-blur px-2 py-1 rounded-md flex-row items-center gap-1">
                                    <Star size={12} fill="#EAB308" color="#EAB308" />
                                    <Text className="text-white text-xs font-medium">
                                        {rating.toFixed(1)}
                                    </Text>
                                </View>
                            )}

                            {/* Close Button */}
                            <Pressable
                                onPress={onClose}
                                className="absolute top-3 left-3 bg-black/80 backdrop-blur p-2 rounded-full active:scale-95"
                            >
                                <X color="white" size={20} />
                            </Pressable>
                        </View>

                        {/* Content Section */}
                        <ScrollView
                            className="px-5 py-4"
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="flex-row gap-3">
                                {/* Poster Thumbnail */}
                                <View
                                    className="rounded-lg overflow-hidden bg-gray-800 border border-white/10"
                                    style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT }}
                                >
                                    <Image
                                        source={{ uri: tmdb.getImageUrl(item.poster_path, 'w342') }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                </View>

                                {/* Info */}
                                <View className="flex-1">
                                    <View className="flex-row items-start justify-between gap-2">
                                        <Text className="text-white text-lg font-bold flex-1" numberOfLines={2}>
                                            {title}
                                        </Text>
                                        <View className="bg-black/70 px-2 py-1 rounded">
                                            <Text className="text-white text-[10px] font-bold tracking-wide">
                                                {mediaType === 'movie' ? 'MOVIE' : 'TV'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center gap-2 mt-1">
                                        {year && (
                                            <Text className="text-gray-400 text-xs">{year}</Text>
                                        )}
                                        {year && rating > 0 && (
                                            <Text className="text-gray-400 text-xs">•</Text>
                                        )}
                                        {rating > 0 && (
                                            <Text className="text-gray-400 text-xs">{rating.toFixed(1)} ★</Text>
                                        )}
                                    </View>

                                    <Text className="text-gray-300 text-sm mt-2 leading-5" numberOfLines={3}>
                                        {overview}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="mt-4 gap-3">
                                {/* Play Button */}
                                <Pressable
                                    onPress={onPlay}
                                    className="bg-white rounded-full py-3 flex-row items-center justify-center gap-2 active:scale-95"
                                >
                                    <Play size={18} color="#000" fill="#000" />
                                    <Text className="text-black font-bold text-base">Play</Text>
                                </Pressable>

                                {/* Secondary Actions */}
                                <View className="flex-row gap-3">
                                    <Pressable
                                        onPress={handleAddToList}
                                        className="flex-1 bg-white/10 border border-white/20 rounded-full py-3 flex-row items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Plus size={16} color="#fff" />
                                        <Text className="text-white font-medium text-sm">My List</Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={handleLike}
                                        className="flex-1 bg-white/10 border border-white/20 rounded-full py-3 flex-row items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Heart size={16} color="#fff" />
                                        <Text className="text-white font-medium text-sm">Like</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default LongPressPreviewModal;
