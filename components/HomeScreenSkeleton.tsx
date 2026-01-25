import React from 'react';
import { View, ScrollView } from 'react-native';
import { HeroSkeleton, RowSkeleton } from './SkeletonLoader';

/**
 * Home Screen Full Skeleton
 * Complete loading state for the home screen with hero + multiple content rows
 */
const HomeScreenSkeleton: React.FC = () => {
    return (
        <View className="flex-1 bg-netflix-black">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Hero Section Skeleton */}
                <HeroSkeleton />

                {/* Content Rows Skeleton */}
                <View className="pt-4 pb-20">
                    {/* Render 6 content row skeletons */}
                    {Array.from({ length: 6 }).map((_, index) => (
                        <RowSkeleton key={index} />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default HomeScreenSkeleton;
