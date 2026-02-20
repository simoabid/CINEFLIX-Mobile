import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Star, Heart } from 'lucide-react-native';
import { Link } from 'expo-router';
import { MyListItem } from '../../types/myList';

interface MyListCardProps {
    item: MyListItem;
    index: number;
    onLongPress: (item: MyListItem) => void;
}

export const MyListCard: React.FC<MyListCardProps> = React.memo(({ item, index, onLongPress }) => {
    const content = item.content as any;
    const title = content.title || content.name;

    // Extract Year
    const releaseDate = content.release_date || content.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';

    const posterPath = content.poster_path;
    // Fallback to TMDB URL directly if getImageUrl is not setup in mobile/utils
    const imageUrl = posterPath ? `https://image.tmdb.org/t/p/w300${posterPath}` : 'https://via.placeholder.com/300x450';

    const voteAverage = content.vote_average || 0;
    const isLiked = item.isLiked;
    const progress = item.progress || 0;
    const isInProgress = item.status === 'inProgress' && progress > 0;

    const href = item.contentType === 'movie' ? `/movie/${item.contentId}` : `/tv/${item.contentId}`;

    return (
        <Animated.View
            entering={FadeInUp.delay(index * 30).springify()}
            className="flex-1 px-1.5 mb-5"
        >
            <Link href={href as any} asChild>
                <Pressable
                    onLongPress={() => onLongPress(item)}
                    className="active:opacity-80 active:scale-95 transition-all"
                >
                    {/* Poster Container */}
                    <View className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                        <Image
                            source={{ uri: imageUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />

                        {/* Rating Badge */}
                        {voteAverage > 0 && (
                            <View className="absolute top-2 right-2 flex-row items-center bg-black/80 rounded-md px-1.5 py-1">
                                <Text className="text-white text-xs font-bold mr-1">
                                    {voteAverage.toFixed(1)}
                                </Text>
                                <Star size={10} color="#E50914" fill="#E50914" />
                            </View>
                        )}

                        {/* Liked Badge */}
                        {isLiked && (
                            <View className="absolute top-2 left-2 flex-row items-center bg-black/80 rounded-full p-1.5">
                                <Heart size={12} color="#E50914" fill="#E50914" />
                            </View>
                        )}

                        {/* Progress Bar (If in progress) */}
                        {isInProgress && (
                            <View className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/80">
                                <View
                                    className="h-full bg-netflix-red"
                                    style={{ width: `${progress}%` }}
                                />
                            </View>
                        )}
                    </View>

                    {/* Title & Metadata */}
                    <View className="mt-2 px-0.5">
                        <Text
                            className="text-white text-xs font-medium leading-tight"
                            numberOfLines={2}
                        >
                            {title}
                        </Text>
                        {year ? (
                            <Text className="text-gray-400 text-[10px] mt-0.5">
                                {year}
                            </Text>
                        ) : null}
                    </View>
                </Pressable>
            </Link>
        </Animated.View>
    );
});

MyListCard.displayName = 'MyListCard';
