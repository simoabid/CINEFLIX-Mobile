import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Clock, Calendar, Film, Star } from 'lucide-react-native';
import { CollectionDetails } from '../../types';
import { getBackdropUrl, getPosterUrl } from '../../services/tmdb';

const CARD_WIDTH = Dimensions.get('window').width * 0.72;
const CARD_HEIGHT = 320;

interface FranchiseCardProps {
    collection: CollectionDetails;
    onPress: (collection: CollectionDetails) => void;
}

function formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
}

function getTypeDisplayName(type: string): string {
    const map: Record<string, string> = {
        trilogy: 'Trilogy', quadrilogy: 'Quadrilogy', pentology: 'Pentology',
        hexalogy: 'Hexalogy', septology: 'Septology', octology: 'Octology',
        nonology: 'Nonology', extended_series: 'Extended Series', incomplete_series: 'Series',
    };
    return map[type] || 'Series';
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'complete': return '#16A34A';
        case 'ongoing': return '#2563EB';
        case 'incomplete': return '#CA8A04';
        default: return '#6B7280';
    }
}

export default function FranchiseCard({ collection, onPress }: FranchiseCardProps) {
    const progress = collection.user_progress
        ? (collection.user_progress.watched_films.length / collection.film_count) * 100
        : 0;

    const backdropUri = collection.backdrop_path
        ? getBackdropUrl(collection.backdrop_path, 'w780')
        : collection.parts?.[0]?.backdrop_path
            ? getBackdropUrl(collection.parts[0].backdrop_path, 'w780')
            : null;

    const firstYear = collection.first_release_date ? new Date(collection.first_release_date).getFullYear() : null;
    const lastYear = collection.latest_release_date ? new Date(collection.latest_release_date).getFullYear() : null;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(collection)}
            activeOpacity={0.85}
        >
            {/* Backdrop */}
            <View style={styles.imageContainer}>
                {backdropUri ? (
                    <Image source={{ uri: backdropUri }} style={styles.backdrop} resizeMode="cover" />
                ) : collection.parts && collection.parts.length > 0 ? (
                    <View style={styles.posterGrid}>
                        {collection.parts.slice(0, 4).map(film => (
                            <Image
                                key={film.id}
                                source={{ uri: getPosterUrl(film.poster_path, 'w342') }}
                                style={styles.gridPoster}
                                resizeMode="cover"
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.placeholder}>
                        <Film size={40} color="#4B5563" />
                    </View>
                )}

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(collection.status) }]}>
                    <Text style={styles.badgeText}>
                        {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                    </Text>
                </View>

                {/* Type badge */}
                <View style={styles.typeBadge}>
                    <Text style={styles.badgeText}>{getTypeDisplayName(collection.type)}</Text>
                </View>

                {/* Play overlay */}
                <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                        <Play size={20} color="#fff" fill="#fff" />
                    </View>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{collection.name}</Text>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Film size={12} color="#9CA3AF" />
                        <Text style={styles.statText}>{collection.film_count} Films</Text>
                    </View>
                    <View style={styles.stat}>
                        <Clock size={12} color="#9CA3AF" />
                        <Text style={styles.statText}>{formatRuntime(collection.total_runtime)}</Text>
                    </View>
                    {firstYear && lastYear && (
                        <View style={styles.stat}>
                            <Calendar size={12} color="#9CA3AF" />
                            <Text style={styles.statText}>{firstYear}-{lastYear}</Text>
                        </View>
                    )}
                </View>

                {/* Progress */}
                {progress > 0 && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                    </View>
                )}

                {/* Genres */}
                <View style={styles.genresRow}>
                    {(collection.genre_categories || []).slice(0, 2).map((genre, i) => (
                        <View key={i} style={styles.genrePill}>
                            <Text style={styles.genrePillText}>{genre}</Text>
                        </View>
                    ))}
                    {collection.genre_categories.length > 2 && (
                        <View style={styles.genrePill}>
                            <Text style={styles.genrePillText}>+{collection.genre_categories.length - 2}</Text>
                        </View>
                    )}
                </View>

                {/* Poster stack */}
                <View style={styles.posterStack}>
                    {collection.parts.slice(0, 4).map((film, i) => (
                        <View key={film.id} style={[styles.miniPoster, { zIndex: 4 - i, marginLeft: i > 0 ? -6 : 0 }]}>
                            <Image
                                source={{ uri: getPosterUrl(film.poster_path, 'w92') }}
                                style={styles.miniPosterImage}
                                resizeMode="cover"
                            />
                        </View>
                    ))}
                    {collection.parts.length > 4 && (
                        <View style={[styles.miniPoster, styles.miniPosterMore, { marginLeft: -6 }]}>
                            <Text style={styles.miniPosterMoreText}>+{collection.parts.length - 4}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#1A1A2E',
        borderRadius: 14,
        overflow: 'hidden',
        marginRight: 14,
    },
    imageContainer: {
        width: CARD_WIDTH,
        height: 170,
        position: 'relative',
        overflow: 'hidden',
    },
    backdrop: {
        width: '100%',
        height: '100%',
    },
    posterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        height: '100%',
    },
    gridPoster: {
        width: '50%',
        height: '50%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    typeBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#E50914',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
    },
    playButton: {
        backgroundColor: '#E50914',
        borderRadius: 30,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 3,
    },
    content: {
        padding: 12,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    statText: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: '500',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#374151',
        borderRadius: 2,
    },
    progressFill: {
        height: 4,
        backgroundColor: '#E50914',
        borderRadius: 2,
    },
    progressText: {
        color: '#E50914',
        fontSize: 11,
        fontWeight: '700',
    },
    genresRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 8,
    },
    genrePill: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    genrePillText: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: '500',
    },
    posterStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniPoster: {
        width: 26,
        height: 38,
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#1A1A2E',
    },
    miniPosterImage: {
        width: '100%',
        height: '100%',
    },
    miniPosterMore: {
        backgroundColor: '#374151',
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniPosterMoreText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
    },
});
