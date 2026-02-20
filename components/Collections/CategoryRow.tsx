import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { CollectionDetails, CollectionCategory } from '../../types';
import FranchiseCard from './FranchiseCard';

interface CategoryRowProps {
    category: CollectionCategory;
    onCollectionPress: (collection: CollectionDetails) => void;
    onViewAll?: () => void;
}

export default function CategoryRow({ category, onCollectionPress, onViewAll }: CategoryRowProps) {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>{category.name}</Text>
                    <Text style={styles.subtitle}>{category.description}</Text>
                </View>
                {onViewAll && (
                    <TouchableOpacity style={styles.viewAll} onPress={onViewAll} activeOpacity={0.7}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <ChevronRight size={16} color="#E50914" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Horizontal scroll */}
            <FlatList
                data={category.collections.slice(0, 10)}
                keyExtractor={(item) => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <FranchiseCard collection={item} onPress={onCollectionPress} />
                )}
                snapToInterval={Dimensions.get('window').width * 0.72 + 14}
                decelerationRate="fast"
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 14,
    },
    headerLeft: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    subtitle: {
        color: '#6B7280',
        fontSize: 13,
        marginTop: 2,
    },
    viewAll: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        color: '#E50914',
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 16,
    },
});
