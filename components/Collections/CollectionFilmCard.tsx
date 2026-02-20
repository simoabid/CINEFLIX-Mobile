import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Clock, Star, Check } from 'lucide-react-native';
import { Movie } from '../../types';
import { getPosterUrl } from '../../services/tmdb';

interface CollectionFilmCardProps {
    film: Movie;
    index: number;
    isWatched: boolean;
    onPress: (film: Movie) => void;
}

function formatRuntime(minutes?: number): string {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
}

export default function CollectionFilmCard({ film, index, isWatched, onPress }: CollectionFilmCardProps) {
    const year = film.release_date ? new Date(film.release_date).getFullYear() : null;

    return (
        <TouchableOpacity
            style={[styles.card, isWatched && styles.cardWatched]}
            onPress={() => onPress(film)}
            activeOpacity={0.8}
        >
            {/* Index */}
            <Text style={styles.index}>{index + 1}</Text>

            {/* Poster */}
            <View style={styles.posterContainer}>
                <Image
                    source={{ uri: getPosterUrl(film.poster_path, 'w185') }}
                    style={styles.poster}
                    resizeMode="cover"
                />
                {isWatched && (
                    <View style={styles.watchedOverlay}>
                        <Check size={20} color="#fff" />
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{film.title}</Text>
                <View style={styles.meta}>
                    {year && <Text style={styles.metaText}>{year}</Text>}
                    {film.runtime ? (
                        <>
                            <Text style={styles.metaDot}>•</Text>
                            <Clock size={12} color="#6B7280" />
                            <Text style={styles.metaText}>{formatRuntime(film.runtime)}</Text>
                        </>
                    ) : null}
                </View>
                <View style={styles.rating}>
                    <Star size={12} color="#FACC15" fill="#FACC15" />
                    <Text style={styles.ratingText}>{(film.vote_average || 0).toFixed(1)}</Text>
                </View>
            </View>

            {/* Play */}
            <View style={styles.playIcon}>
                <Play size={16} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cardWatched: {
        opacity: 0.7,
    },
    index: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '800',
        width: 24,
        textAlign: 'center',
    },
    posterContainer: {
        position: 'relative',
    },
    poster: {
        width: 52,
        height: 78,
        borderRadius: 8,
    },
    watchedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        lineHeight: 18,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    metaText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '500',
    },
    metaDot: {
        color: '#4B5563',
        fontSize: 12,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#FACC15',
        fontSize: 12,
        fontWeight: '600',
    },
    playIcon: {
        padding: 8,
    },
});
