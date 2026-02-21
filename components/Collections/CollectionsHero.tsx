import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Clock, Calendar, Film, Star, Users } from 'lucide-react-native';
import { CollectionDetails } from '../../types';
import { getBackdropUrl, getPosterUrl } from '../../services/tmdb';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CollectionsHeroProps {
    collection: CollectionDetails;
    onStartMarathon: () => void;
    onViewCollection: () => void;
}

function formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
}

function getTypeDisplayName(type?: string): string {
    const map: Record<string, string> = {
        trilogy: 'Trilogy', quadrilogy: 'Quadrilogy', pentology: 'Pentology',
        hexalogy: 'Hexalogy', septology: 'Septology', octology: 'Octology',
        nonology: 'Nonology', extended_series: 'Extended Series', incomplete_series: 'Series',
    };
    return map[type || ''] || 'Series';
}

export default function CollectionsHero({ collection, onStartMarathon, onViewCollection }: CollectionsHeroProps) {
    const backdropUri = collection.backdrop_path
        ? getBackdropUrl(collection.backdrop_path, 'w1280')
        : collection.parts?.[0]?.backdrop_path
            ? getBackdropUrl(collection.parts[0].backdrop_path, 'w1280')
            : null;

    const posterUri = collection.poster_path ? getPosterUrl(collection.poster_path, 'w500') : null;

    const progress = collection.user_progress
        ? (collection.user_progress.watched_films.length / collection.film_count) * 100
        : 0;

    const avgRating = collection.parts.length > 0
        ? (collection.parts.reduce((s, f) => s + (f.vote_average || 0), 0) / collection.parts.length).toFixed(1)
        : '0.0';

    const firstYear = collection.first_release_date ? new Date(collection.first_release_date).getFullYear() : null;
    const lastYear = collection.latest_release_date ? new Date(collection.latest_release_date).getFullYear() : null;

    return (
        <View style={styles.container}>
            {/* Backdrop */}
            {backdropUri && (
                <Image source={{ uri: backdropUri }} style={styles.backdrop} resizeMode="cover" />
            )}

            {/* Gradient overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(10,10,31,0.6)', 'rgba(10,10,31,0.95)', '#0A0A1F']}
                style={styles.gradient}
            />

            {/* Content */}
            <View style={styles.content}>
                {/* Poster */}
                {posterUri && (
                    <View style={styles.posterContainer}>
                        <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
                        {progress > 0 && (
                            <View style={styles.progressBadge}>
                                <Text style={styles.progressBadgeText}>{Math.round(progress)}%</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Info */}
                <View style={styles.info}>
                    {/* Badges */}
                    <View style={styles.badgesRow}>
                        <View style={[styles.badge, { backgroundColor: '#E50914' }]}>
                            <Text style={styles.badgeText}>{getTypeDisplayName(collection.type)}</Text>
                        </View>
                        <View style={[styles.badge, {
                            backgroundColor: collection.status === 'complete' ? '#16A34A' : collection.status === 'ongoing' ? '#2563EB' : '#CA8A04'
                        }]}>
                            <Text style={styles.badgeText}>{collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Star size={12} color="#FACC15" fill="#FACC15" />
                            <Text style={[styles.badgeText, { color: '#FACC15', marginLeft: 4 }]}>{avgRating}</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title} numberOfLines={2}>{collection.name}</Text>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Film size={14} color="#9CA3AF" />
                            <Text style={styles.statText}>{collection.film_count} Films</Text>
                        </View>
                        <View style={styles.stat}>
                            <Clock size={14} color="#9CA3AF" />
                            <Text style={styles.statText}>{formatRuntime(collection.total_runtime)}</Text>
                        </View>
                    </View>
                    {firstYear && lastYear && (
                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Calendar size={14} color="#9CA3AF" />
                                <Text style={styles.statText}>{firstYear}-{lastYear}</Text>
                            </View>
                        </View>
                    )}

                    {/* Genre pills */}
                    <View style={styles.genresRow}>
                        {(collection.genre_categories || []).slice(0, 3).map((genre, i) => (
                            <View key={i} style={styles.genrePill}>
                                <Text style={styles.genrePillText}>{genre}</Text>
                            </View>
                        ))}
                    </View>

                    {/* CTA Buttons */}
                    <View style={styles.ctaRow}>
                        <TouchableOpacity style={styles.ctaPrimary} onPress={onStartMarathon} activeOpacity={0.8}>
                            <Play size={18} color="#fff" fill="#fff" />
                            <Text style={styles.ctaPrimaryText}>
                                {progress > 0 ? 'Continue' : 'Start'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.ctaSecondary} onPress={onViewCollection} activeOpacity={0.8}>
                            <Users size={18} color="#fff" />
                            <Text style={styles.ctaSecondaryText}>View</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: 480,
        position: 'relative',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        width: SCREEN_WIDTH,
        height: 480,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 20,
        alignItems: 'flex-end',
        gap: 14,
    },
    posterContainer: {
        position: 'relative',
    },
    poster: {
        width: 110,
        height: 165,
        borderRadius: 10,
    },
    progressBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#E50914',
        borderRadius: 14,
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0A0A1F',
    },
    progressBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    info: {
        flex: 1,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
        lineHeight: 28,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '500',
    },
    genresRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 12,
    },
    genrePill: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    genrePillText: {
        color: '#D1D5DB',
        fontSize: 11,
        fontWeight: '500',
    },
    ctaRow: {
        flexDirection: 'row',
        gap: 10,
    },
    ctaPrimary: {
        flex: 1,
        backgroundColor: '#E50914',
        borderRadius: 10,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ctaPrimaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    ctaSecondary: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ctaSecondaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
