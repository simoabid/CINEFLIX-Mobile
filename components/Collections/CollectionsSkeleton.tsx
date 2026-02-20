import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

function ShimmerBlock({ width, height, borderRadius = 8, style }: any) {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    return (
        <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#1F2937', opacity }, style]} />
    );
}

interface CollectionsSkeletonProps {
    progress?: { scanned: number; found: number; step: string };
}

export default function CollectionsSkeleton({ progress }: CollectionsSkeletonProps) {
    return (
        <View style={styles.container}>
            {/* Hero skeleton */}
            <ShimmerBlock width={SCREEN_WIDTH} height={480} borderRadius={0} />

            {/* Progress text */}
            {progress && (
                <View style={styles.progressContainer}>
                    <Text style={styles.progressStep}>{progress.step}</Text>
                    <View style={styles.progressStats}>
                        <View style={styles.progressStat}>
                            <Text style={styles.progressValue}>{progress.scanned}</Text>
                            <Text style={styles.progressLabel}>Scanned</Text>
                        </View>
                        <View style={styles.progressStat}>
                            <Text style={[styles.progressValue, { color: '#4ADE80' }]}>{progress.found}</Text>
                            <Text style={styles.progressLabel}>Found</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Filter chips skeleton */}
            <View style={styles.chipsRow}>
                {[70, 90, 80, 100, 75].map((w, i) => (
                    <ShimmerBlock key={i} width={w} height={40} borderRadius={20} />
                ))}
            </View>

            {/* Category rows skeleton */}
            {[1, 2].map((row) => (
                <View key={row} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                        <ShimmerBlock width={180} height={22} />
                        <ShimmerBlock width={60} height={16} />
                    </View>
                    <View style={styles.cardRow}>
                        {[1, 2].map((card) => (
                            <View key={card} style={styles.cardSkeleton}>
                                <ShimmerBlock width={CARD_WIDTH} height={170} borderRadius={14} />
                                <View style={{ padding: 12, gap: 8 }}>
                                    <ShimmerBlock width={CARD_WIDTH * 0.7} height={18} />
                                    <ShimmerBlock width={CARD_WIDTH * 0.5} height={14} />
                                    <ShimmerBlock width={CARD_WIDTH * 0.4} height={12} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A1F',
    },
    progressContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    progressStep: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    progressStats: {
        flexDirection: 'row',
        gap: 32,
    },
    progressStat: {
        alignItems: 'center',
    },
    progressValue: {
        color: '#60A5FA',
        fontSize: 24,
        fontWeight: '800',
    },
    progressLabel: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 2,
    },
    chipsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        paddingVertical: 12,
    },
    categorySection: {
        marginBottom: 28,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 14,
    },
    cardRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 14,
    },
    cardSkeleton: {
        width: CARD_WIDTH,
        backgroundColor: '#1A1A2E',
        borderRadius: 14,
        overflow: 'hidden',
    },
});
