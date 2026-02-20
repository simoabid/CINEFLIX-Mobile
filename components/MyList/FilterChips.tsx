import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

export type FilterOption = 'All' | 'Movies' | 'TV Shows' | 'In Progress' | 'Completed' | 'Liked';

interface FilterChipsProps {
    activeFilter: FilterOption;
    onFilterChange: (filter: FilterOption) => void;
}

const FILTERS: FilterOption[] = ['All', 'Movies', 'TV Shows', 'In Progress', 'Completed', 'Liked'];

export const FilterChips: React.FC<FilterChipsProps> = ({ activeFilter, onFilterChange }) => {
    return (
        <View className="mb-4">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
                {FILTERS.map((filter, index) => {
                    const isActive = activeFilter === filter;

                    return (
                        <Animated.View
                            key={filter}
                            entering={FadeInRight.delay(index * 50).springify()}
                        >
                            <Pressable
                                onPress={() => onFilterChange(filter)}
                                className={`px-5 py-2.5 rounded-full flex-row items-center justify-center border transition-all ${isActive
                                        ? 'bg-netflix-red border-netflix-red'
                                        : 'bg-gray-800/80 border-gray-700/50'
                                    }`}
                                style={{ minHeight: 44 }} // 44pt touch target
                            >
                                <Text
                                    className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-300'
                                        }`}
                                >
                                    {filter}
                                </Text>
                            </Pressable>
                        </Animated.View>
                    );
                })}
            </ScrollView>
        </View>
    );
};
