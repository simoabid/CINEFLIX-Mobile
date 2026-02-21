import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface FilterChipsProps {
    categories: { id: string; name: string }[];
    selected: string;
    onSelect: (id: string) => void;
}

export default function FilterChips({ categories, selected, onSelect }: FilterChipsProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {categories.map((cat) => {
                const isActive = selected === cat.id;
                return (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, isActive && styles.chipActive]}
                        onPress={() => onSelect(cat.id)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 70,
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    chipText: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#fff',
    },
});
