import React from 'react';
import { View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 24) / 3; // 3 columns with padding
const GRID_ITEM_HEIGHT = GRID_ITEM_WIDTH * 1.5;

export const MyListSkeleton: React.FC = () => {
    return (
        <View className="flex-1 w-full mt-4">
            <View className="flex-row flex-wrap px-2 gap-y-6">
                {Array.from({ length: 12 }).map((_, index) => (
                    <View key={index} className="px-1" style={{ width: GRID_ITEM_WIDTH + 8 }}>
                        {/* Poster Placeholder */}
                        <View
                            className="rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/30"
                            style={{ width: GRID_ITEM_WIDTH, height: GRID_ITEM_HEIGHT }}
                        >
                            <View className="w-full h-full bg-gray-800" />
                        </View>

                        {/* Title Placeholder */}
                        <View style={{ width: GRID_ITEM_WIDTH }} className="mt-2">
                            <View className="h-3 bg-gray-800/50 rounded w-full overflow-hidden mb-1" />
                            <View className="h-2.5 bg-gray-800/50 rounded w-2/3 overflow-hidden" />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default MyListSkeleton;
