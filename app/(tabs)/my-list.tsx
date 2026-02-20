import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MyListSkeleton from '../../components/MyListSkeleton';
import { FilterChips, FilterOption } from '../../components/MyList/FilterChips';
import { MyListCard } from '../../components/MyList/MyListCard';
import { useMyList } from '../../services/hooks/useMyList'; // adjust path if necessary as we fetch from web context
import { MyListItem } from '../../types/myList';
import LongPressPreviewModal from '../../components/LongPressPreviewModal';
import { Film } from 'lucide-react-native';

export default function MyListScreen() {
    const { myListItems, isLoading, loadMyList } = useMyList();

    const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
    const [previewItem, setPreviewItem] = useState<any | null>(null);

    // Load list on mount
    useEffect(() => {
        loadMyList();
    }, []);

    const filteredItems = useMemo(() => {
        if (!myListItems) return [];

        return myListItems.filter((item: MyListItem) => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Movies' && item.contentType === 'movie') return true;
            if (activeFilter === 'TV Shows' && item.contentType === 'tv') return true;
            if (activeFilter === 'In Progress' && item.status === 'inProgress') return true;
            if (activeFilter === 'Completed' && item.status === 'completed') return true;
            if (activeFilter === 'Liked' && item.isLiked) return true;
            return false;
        }).sort((a: MyListItem, b: MyListItem) => new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime());
    }, [myListItems, activeFilter]);

    const handleLongPress = useCallback((item: MyListItem) => {
        setPreviewItem({
            ...item.content,
            mediaType: item.contentType,
        });
    }, []);

    const closePreview = useCallback(() => {
        setPreviewItem(null);
    }, []);

    const renderEmptyState = () => {
        if (isLoading) return null;
        return (
            <View className="flex-1 items-center justify-center p-8 mt-20">
                <View className="w-20 h-20 bg-gray-900 rounded-full items-center justify-center mb-6">
                    <Film size={32} color="#4B5563" />
                </View>
                <Text className="text-white text-xl font-bold mb-3 text-center">
                    Your list is empty
                </Text>
                <Text className="text-gray-400 text-center mb-8 px-4 leading-6">
                    Add shows and movies that you want to watch later by tapping the + My List button.
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#141414] pt-2" edges={['top']}>
            <View className="px-4 mb-4 mt-2 flex-row items-center justify-between">
                <Text className="text-white text-2xl font-bold">My List</Text>
            </View>

            <FilterChips
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <MyListSkeleton />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        paddingBottom: 100,
                        flexGrow: 1
                    }}
                    columnWrapperStyle={{ justifyContent: 'flex-start' }}
                    renderItem={({ item, index }) => (
                        <MyListCard
                            item={item}
                            index={index}
                            onLongPress={handleLongPress}
                        />
                    )}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={12}
                    maxToRenderPerBatch={6}
                    windowSize={5}
                    removeClippedSubviews={true}
                />
            )}

            {/* Long Press Preview Modal */}
            {previewItem && (
                <LongPressPreviewModal
                    visible={!!previewItem}
                    item={previewItem}
                    mediaType={previewItem.mediaType}
                    onClose={closePreview}
                    onPlay={() => { }} // or actual implement later
                />
            )}
        </SafeAreaView>
    );
}
