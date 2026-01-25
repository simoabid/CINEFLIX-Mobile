import React, { useEffect, useRef } from 'react';
import { View, Dimensions, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Constants
const POSTER_WIDTH = 110;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

interface SkeletonLoaderProps {
    type?: 'card' | 'row' | 'hero' | 'grid' | 'detail' | 'person';
    count?: number;
}

/**
 * Shimmer Animation Component
 * Creates a smooth left-to-right shimmer effect for skeleton loaders
 */
const ShimmerEffect: React.FC<{ width: number; height: number }> = ({ width: w, height: h }) => {
    const shimmerAnim = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        const animation = RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-w, w],
    });

    return (
        <RNAnimated.View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: [{ translateX }],
            }}
        >
            <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: w, height: h }}
            />
        </RNAnimated.View>
    );
};

/**
 * Single Card Skeleton
 * Used in horizontal rows and grids
 */
export const CardSkeleton: React.FC = () => (
    <View className="mr-3">
        {/* Poster */}
        <View
            className="rounded-lg overflow-hidden bg-gray-800/50 border border-gray-700/30"
            style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT }}
        >
            <ShimmerEffect width={POSTER_WIDTH} height={POSTER_HEIGHT} />
        </View>

        {/* Title and Year */}
        <View style={{ width: POSTER_WIDTH }} className="mt-2 space-y-1">
            <View className="h-3 bg-gray-800/50 rounded w-3/4 overflow-hidden">
                <ShimmerEffect width={POSTER_WIDTH * 0.75} height={12} />
            </View>
            <View className="h-2.5 bg-gray-800/50 rounded w-1/2 overflow-hidden">
                <ShimmerEffect width={POSTER_WIDTH * 0.5} height={10} />
            </View>
        </View>
    </View>
);

/**
 * Content Row Skeleton
 * Horizontal scrollable row with multiple cards
 */
export const RowSkeleton: React.FC = () => (
    <View className="mb-6">
        {/* Header */}
        <View className="px-4 mb-3">
            <View className="h-5 bg-gray-800/50 rounded w-40 overflow-hidden">
                <ShimmerEffect width={160} height={20} />
            </View>
        </View>

        {/* Cards Row */}
        <View className="flex-row px-4">
            {Array.from({ length: 5 }).map((_, index) => (
                <CardSkeleton key={index} />
            ))}
        </View>
    </View>
);

/**
 * Hero Section Skeleton
 * Full-height hero with gradient and content placeholders
 */
export const HeroSkeleton: React.FC = () => {
    const HERO_HEIGHT = Dimensions.get('window').height * 0.75;

    return (
        <View className="relative" style={{ height: HERO_HEIGHT }}>
            {/* Background */}
            <View className="absolute inset-0 bg-gray-900">
                <ShimmerEffect width={width} height={HERO_HEIGHT} />
            </View>

            {/* Gradient Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(20,20,20,0.4)', 'rgba(20,20,20,0.95)', '#141414']}
                locations={[0, 0.5, 0.85, 1]}
                className="absolute bottom-0 w-full h-full"
            />

            {/* Content Placeholders */}
            <View className="absolute bottom-0 w-full px-4 pb-6 items-center">
                {/* Title */}
                <View className="h-8 bg-gray-800/50 rounded w-64 mb-2 overflow-hidden">
                    <ShimmerEffect width={256} height={32} />
                </View>

                {/* Metadata */}
                <View className="flex-row items-center gap-2 mb-4">
                    <View className="h-3 bg-gray-800/50 rounded w-12 overflow-hidden">
                        <ShimmerEffect width={48} height={12} />
                    </View>
                    <View className="h-3 bg-gray-800/50 rounded w-12 overflow-hidden">
                        <ShimmerEffect width={48} height={12} />
                    </View>
                    <View className="h-3 bg-gray-800/50 rounded w-16 overflow-hidden">
                        <ShimmerEffect width={64} height={12} />
                    </View>
                </View>

                {/* Buttons */}
                <View className="flex-row items-center gap-4 mb-4">
                    <View className="w-10 h-10 rounded-full bg-gray-800/50 overflow-hidden">
                        <ShimmerEffect width={40} height={40} />
                    </View>
                    <View className="h-12 bg-gray-800/50 rounded-lg w-32 overflow-hidden">
                        <ShimmerEffect width={128} height={48} />
                    </View>
                    <View className="w-10 h-10 rounded-full bg-gray-800/50 overflow-hidden">
                        <ShimmerEffect width={40} height={40} />
                    </View>
                </View>

                {/* Dots */}
                <View className="flex-row gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <View
                            key={i}
                            className="w-2 h-2 rounded-full bg-gray-800/50 overflow-hidden"
                        >
                            <ShimmerEffect width={8} height={8} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

/**
 * Grid Skeleton
 * 3-column grid layout for search/genre screens
 */
export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => {
    const GRID_ITEM_WIDTH = (width - 48) / 3; // 3 columns with padding
    const GRID_ITEM_HEIGHT = GRID_ITEM_WIDTH * 1.5;

    return (
        <View className="flex-row flex-wrap px-4 gap-3">
            {Array.from({ length: count }).map((_, index) => (
                <View key={index}>
                    {/* Poster */}
                    <View
                        className="rounded-lg overflow-hidden bg-gray-800/50 border border-gray-700/30"
                        style={{ width: GRID_ITEM_WIDTH, height: GRID_ITEM_HEIGHT }}
                    >
                        <ShimmerEffect width={GRID_ITEM_WIDTH} height={GRID_ITEM_HEIGHT} />
                    </View>

                    {/* Title */}
                    <View style={{ width: GRID_ITEM_WIDTH }} className="mt-2">
                        <View className="h-3 bg-gray-800/50 rounded w-full overflow-hidden">
                            <ShimmerEffect width={GRID_ITEM_WIDTH} height={12} />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
};

/**
 * Detail Screen Skeleton
 * For movie/TV detail pages
 */
export const DetailSkeleton: React.FC = () => {
    const DETAIL_HERO_HEIGHT = Dimensions.get('window').height * 0.6;

    return (
        <View className="flex-1 bg-netflix-black">
            {/* Hero Section */}
            <View className="relative" style={{ height: DETAIL_HERO_HEIGHT }}>
                <View className="absolute inset-0 bg-gray-900">
                    <ShimmerEffect width={width} height={DETAIL_HERO_HEIGHT} />
                </View>

                <LinearGradient
                    colors={['transparent', 'rgba(20,20,20,0.8)', '#141414']}
                    locations={[0, 0.7, 1]}
                    className="absolute bottom-0 w-full h-full"
                />

                {/* Content */}
                <View className="absolute bottom-0 w-full px-4 pb-6">
                    {/* Title */}
                    <View className="h-10 bg-gray-800/50 rounded w-3/4 mb-3 overflow-hidden">
                        <ShimmerEffect width={width * 0.75} height={40} />
                    </View>

                    {/* Metadata */}
                    <View className="flex-row items-center gap-2 mb-4">
                        <View className="h-3 bg-gray-800/50 rounded w-16 overflow-hidden">
                            <ShimmerEffect width={64} height={12} />
                        </View>
                        <View className="h-3 bg-gray-800/50 rounded w-12 overflow-hidden">
                            <ShimmerEffect width={48} height={12} />
                        </View>
                        <View className="h-3 bg-gray-800/50 rounded w-20 overflow-hidden">
                            <ShimmerEffect width={80} height={12} />
                        </View>
                    </View>

                    {/* Buttons */}
                    <View className="flex-row gap-3">
                        <View className="h-12 bg-gray-800/50 rounded-lg flex-1 overflow-hidden">
                            <ShimmerEffect width={width / 2} height={48} />
                        </View>
                        <View className="h-12 bg-gray-800/50 rounded-lg flex-1 overflow-hidden">
                            <ShimmerEffect width={width / 2} height={48} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Content Sections */}
            <View className="px-4 py-6 space-y-6">
                {/* Overview */}
                <View className="space-y-2">
                    <View className="h-4 bg-gray-800/50 rounded w-full overflow-hidden">
                        <ShimmerEffect width={width - 32} height={16} />
                    </View>
                    <View className="h-4 bg-gray-800/50 rounded w-5/6 overflow-hidden">
                        <ShimmerEffect width={(width - 32) * 0.83} height={16} />
                    </View>
                    <View className="h-4 bg-gray-800/50 rounded w-4/6 overflow-hidden">
                        <ShimmerEffect width={(width - 32) * 0.67} height={16} />
                    </View>
                </View>

                {/* Cast Section */}
                <View>
                    <View className="h-5 bg-gray-800/50 rounded w-24 mb-3 overflow-hidden">
                        <ShimmerEffect width={96} height={20} />
                    </View>
                    <View className="flex-row gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <View key={i}>
                                <View className="w-20 h-20 rounded-full bg-gray-800/50 overflow-hidden">
                                    <ShimmerEffect width={80} height={80} />
                                </View>
                                <View className="h-3 bg-gray-800/50 rounded w-16 mt-2 overflow-hidden">
                                    <ShimmerEffect width={64} height={12} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Similar Content */}
                <RowSkeleton />
            </View>
        </View>
    );
};

/**
 * Person Detail Skeleton
 * For actor/crew profile pages
 */
export const PersonSkeleton: React.FC = () => {
    const PERSON_HERO_HEIGHT = Dimensions.get('window').height * 0.5;

    return (
        <View className="flex-1 bg-netflix-black">
            {/* Hero Image */}
            <View className="relative" style={{ height: PERSON_HERO_HEIGHT }}>
                <View className="absolute inset-0 bg-gray-900">
                    <ShimmerEffect width={width} height={PERSON_HERO_HEIGHT} />
                </View>

                <LinearGradient
                    colors={['transparent', 'rgba(20,20,20,0.8)', '#141414']}
                    locations={[0, 0.7, 1]}
                    className="absolute bottom-0 w-full h-full"
                />

                {/* Name */}
                <View className="absolute bottom-6 px-4">
                    <View className="h-8 bg-gray-800/50 rounded w-48 overflow-hidden">
                        <ShimmerEffect width={192} height={32} />
                    </View>
                </View>
            </View>

            {/* Content */}
            <View className="px-4 py-6 space-y-6">
                {/* Info Cards */}
                <View className="flex-row gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <View
                            key={i}
                            className="flex-1 h-20 bg-gray-800/30 rounded-lg border border-gray-700/30 p-3 overflow-hidden"
                        >
                            <ShimmerEffect width={(width - 48) / 3} height={80} />
                        </View>
                    ))}
                </View>

                {/* Biography */}
                <View className="space-y-2">
                    <View className="h-5 bg-gray-800/50 rounded w-32 mb-2 overflow-hidden">
                        <ShimmerEffect width={128} height={20} />
                    </View>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <View
                            key={i}
                            className="h-3 bg-gray-800/50 rounded overflow-hidden"
                            style={{ width: width - 32 - (i === 4 ? 100 : 0) }}
                        >
                            <ShimmerEffect width={width - 32} height={12} />
                        </View>
                    ))}
                </View>

                {/* Filmography */}
                <RowSkeleton />
            </View>
        </View>
    );
};

/**
 * Main Skeleton Loader Component
 * Unified interface for all skeleton types
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'row', count = 1 }) => {
    switch (type) {
        case 'card':
            return (
                <View className="flex-row px-4">
                    {Array.from({ length: count }).map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </View>
            );

        case 'row':
            return (
                <>
                    {Array.from({ length: count }).map((_, i) => (
                        <RowSkeleton key={i} />
                    ))}
                </>
            );

        case 'hero':
            return <HeroSkeleton />;

        case 'grid':
            return <GridSkeleton count={count} />;

        case 'detail':
            return <DetailSkeleton />;

        case 'person':
            return <PersonSkeleton />;

        default:
            return <RowSkeleton />;
    }
};

export default SkeletonLoader;

