import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Play, Clock, Calendar, Film, Star, Check, Share2 } from 'lucide-react-native';
import { CollectionDetails, Movie } from '../../types';
import { getBackdropUrl, getPosterUrl, getCollectionDetailsLight } from '../../services/tmdb';
import CollectionsService from '../../services/collectionsService';
import CollectionFilmCard from '../../components/Collections/CollectionFilmCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function CollectionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [collection, setCollection] = useState<CollectionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewingOrder, setViewingOrder] = useState<'release' | 'chronological'>('release');
    const [progress, setProgress] = useState(0);
    const [watchedFilms, setWatchedFilms] = useState<number[]>([]);

    useEffect(() => {
        loadCollection();
    }, [id]);

    const loadCollection = async () => {
        try {
            setLoading(true);

            // Try cache first
            let found: CollectionDetails | null = null;
            try {
                const { getCachedCollections } = require('../../services/tmdb');
                const cached = getCachedCollections();
                found = cached.find((c: CollectionDetails) => String(c.id) === String(id)) || null;
            } catch { }

            // If not in cache, fetch directly from TMDB
            if (!found) {
                found = await getCollectionDetailsLight(Number(id));
            }

            if (found) {
                setCollection(found);
                // Load user progress
                try {
                    const userProgress = await CollectionsService.getFranchiseProgress(Number(id));
                    if (userProgress) {
                        setProgress(userProgress.completion_percentage);
                        setWatchedFilms(userProgress.watched_films);
                    }
                } catch { }
            }
        } catch (err) {
            console.error('Error loading collection:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPress = () => {
        if (!collection?.parts?.length) return;
        // Sort by release date, find first unwatched film
        const sorted = [...collection.parts].sort(
            (a, b) => new Date(a.release_date || '').getTime() - new Date(b.release_date || '').getTime()
        );
        const nextUnwatched = sorted.find(f => !watchedFilms.includes(f.id)) || sorted[0];
        router.push(`/movie/${nextUnwatched.id}`);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color="#E50914" />
                <Text style={styles.loadingText}>Loading collection...</Text>
            </View>
        );
    }

    if (!collection) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <Text style={styles.errorEmoji}>🎬</Text>
                <Text style={styles.errorTitle}>Collection not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const backdropUri = collection.backdrop_path
        ? getBackdropUrl(collection.backdrop_path, 'w1280')
        : collection.parts?.[0]?.backdrop_path
            ? getBackdropUrl(collection.parts[0].backdrop_path, 'w1280')
            : null;

    const posterUri = collection.poster_path ? getPosterUrl(collection.poster_path, 'w500') : null;

    const avgRating = collection.parts.length > 0
        ? (collection.parts.reduce((s, f) => s + (f.vote_average || 0), 0) / collection.parts.length).toFixed(1)
        : '0.0';

    const firstYear = collection.first_release_date ? new Date(collection.first_release_date).getFullYear() : null;
    const lastYear = collection.latest_release_date ? new Date(collection.latest_release_date).getFullYear() : null;

    // Sort films
    const sortedFilms = [...collection.parts].sort((a, b) => {
        if (viewingOrder === 'release') {
            return new Date(a.release_date || '').getTime() - new Date(b.release_date || '').getTime();
        }
        // Chronological = same as release for standard collections
        return new Date(a.release_date || '').getTime() - new Date(b.release_date || '').getTime();
    });

    const nextFilm = collection.user_progress?.next_film || sortedFilms[0];

    const handleFilmPress = (film: Movie) => {
        router.push(`/movie/${film.id}`);
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.heroContainer}>
                    {backdropUri && (
                        <Image source={{ uri: backdropUri }} style={styles.heroBackdrop} resizeMode="cover" />
                    )}
                    <LinearGradient
                        colors={['transparent', 'rgba(10,10,31,0.6)', 'rgba(10,10,31,0.95)', '#0A0A1F']}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Back button */}
                    <TouchableOpacity style={styles.heroBackButton} onPress={() => router.back()} activeOpacity={0.7}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Hero content */}
                    <View style={styles.heroContent}>
                        {/* Poster */}
                        {posterUri && (
                            <View style={styles.posterWrapper}>
                                <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
                                {progress > 0 && (
                                    <View style={styles.progressRing}>
                                        <Text style={styles.progressRingText}>{Math.round(progress)}%</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.heroInfo}>
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

                            <Text style={styles.heroTitle} numberOfLines={3}>{collection.name}</Text>

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
                        </View>
                    </View>
                </View>

                {/* Genre pills */}
                <View style={styles.genresRow}>
                    {(collection.genre_categories || []).map((genre, i) => (
                        <View key={i} style={styles.genrePill}>
                            <Text style={styles.genrePillText}>{genre}</Text>
                        </View>
                    ))}
                </View>

                {/* Overview */}
                {collection.overview && (
                    <View style={styles.section}>
                        <Text style={styles.overview}>{collection.overview}</Text>
                    </View>
                )}

                {/* CTA buttons */}
                <View style={styles.ctaRow}>
                    <TouchableOpacity style={styles.ctaPrimary} activeOpacity={0.8} onPress={handleStartPress}>
                        <Play size={18} color="#fff" fill="#fff" />
                        <Text style={styles.ctaPrimaryText}>
                            {progress > 0 ? 'Continue' : 'Start'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctaIcon} activeOpacity={0.8}>
                        <Share2 size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Progress section */}
                {progress > 0 && nextFilm && (
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressTitle}>Your Progress</Text>
                            <Text style={styles.progressPercent}>{Math.round(progress)}% Complete</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                        <View style={styles.nextFilm}>
                            <Image
                                source={{ uri: getPosterUrl(nextFilm.poster_path, 'w92') }}
                                style={styles.nextFilmPoster}
                                resizeMode="cover"
                            />
                            <View style={styles.nextFilmInfo}>
                                <Text style={styles.nextFilmLabel}>Up Next:</Text>
                                <Text style={styles.nextFilmTitle}>{nextFilm.title}</Text>
                                <Text style={styles.nextFilmYear}>
                                    {nextFilm.release_date ? new Date(nextFilm.release_date).getFullYear() : ''}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.nextFilmPlay} activeOpacity={0.8} onPress={() => nextFilm && handleFilmPress(nextFilm)}>
                                <Play size={14} color="#fff" fill="#fff" />
                                <Text style={styles.nextFilmPlayText}>Watch</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Stats dashboard */}
                <View style={styles.statsGrid}>
                    <View style={styles.statsGridCard}>
                        <Clock size={20} color="#60A5FA" />
                        <Text style={[styles.statsGridValue, { color: '#60A5FA' }]}>{formatRuntime(collection.total_runtime)}</Text>
                        <Text style={styles.statsGridLabel}>Total Runtime</Text>
                    </View>
                    <View style={styles.statsGridCard}>
                        <Star size={20} color="#FACC15" />
                        <Text style={[styles.statsGridValue, { color: '#FACC15' }]}>{avgRating}</Text>
                        <Text style={styles.statsGridLabel}>Avg Rating</Text>
                    </View>
                    <View style={styles.statsGridCard}>
                        <Calendar size={20} color="#C084FC" />
                        <Text style={[styles.statsGridValue, { color: '#C084FC' }]}>
                            {firstYear && lastYear ? `${lastYear - firstYear + 1}` : '-'}
                        </Text>
                        <Text style={styles.statsGridLabel}>Year Span</Text>
                    </View>
                    <View style={styles.statsGridCard}>
                        <Check size={20} color="#4ADE80" />
                        <Text style={[styles.statsGridValue, { color: '#4ADE80' }]}>
                            {watchedFilms.length}/{collection.film_count}
                        </Text>
                        <Text style={styles.statsGridLabel}>Watched</Text>
                    </View>
                </View>

                {/* Films section */}
                <View style={styles.section}>
                    <View style={styles.filmsHeader}>
                        <Text style={styles.sectionTitle}>Films in Collection</Text>
                        {/* Order toggle */}
                        <View style={styles.orderToggle}>
                            <TouchableOpacity
                                style={[styles.orderButton, viewingOrder === 'release' && styles.orderButtonActive]}
                                onPress={() => setViewingOrder('release')}
                            >
                                <Text style={[styles.orderButtonText, viewingOrder === 'release' && styles.orderButtonTextActive]}>Release</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.orderButton, viewingOrder === 'chronological' && styles.orderButtonActive]}
                                onPress={() => setViewingOrder('chronological')}
                            >
                                <Text style={[styles.orderButtonText, viewingOrder === 'chronological' && styles.orderButtonTextActive]}>Chronological</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {sortedFilms.map((film, index) => (
                        <CollectionFilmCard
                            key={film.id}
                            film={film}
                            index={index}
                            isWatched={watchedFilms.includes(film.id)}
                            onPress={handleFilmPress}
                        />
                    ))}
                </View>

                {/* Bottom padding */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0A0A1F',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0A0A1F',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    errorEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    errorTitle: {
        color: '#D1D5DB',
        fontSize: 18,
        fontWeight: '700',
    },
    backButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 16,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    // Hero
    heroContainer: {
        width: SCREEN_WIDTH,
        height: 420,
        position: 'relative',
    },
    heroBackdrop: {
        ...StyleSheet.absoluteFillObject,
        width: SCREEN_WIDTH,
        height: 420,
    },
    heroBackButton: {
        position: 'absolute',
        top: 48,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    heroContent: {
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
    posterWrapper: {
        position: 'relative',
    },
    poster: {
        width: 120,
        height: 180,
        borderRadius: 12,
    },
    progressRing: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E50914',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#0A0A1F',
    },
    progressRingText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    heroInfo: {
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
    heroTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 8,
        lineHeight: 30,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
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

    // Genres
    genresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    genrePill: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    genrePillText: {
        color: '#D1D5DB',
        fontSize: 12,
        fontWeight: '500',
    },

    // Overview
    section: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    overview: {
        color: '#9CA3AF',
        fontSize: 14,
        lineHeight: 22,
    },

    // CTA
    ctaRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 20,
    },
    ctaPrimary: {
        flex: 1,
        backgroundColor: '#E50914',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ctaPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    ctaIcon: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderRadius: 12,
        width: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Progress Card
    progressCard: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    progressPercent: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: '700',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#374151',
        borderRadius: 3,
        marginBottom: 14,
    },
    progressBarFill: {
        height: 6,
        backgroundColor: '#E50914',
        borderRadius: 3,
    },
    nextFilm: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    nextFilmPoster: {
        width: 40,
        height: 60,
        borderRadius: 6,
    },
    nextFilmInfo: {
        flex: 1,
    },
    nextFilmLabel: {
        color: '#6B7280',
        fontSize: 12,
    },
    nextFilmTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    nextFilmYear: {
        color: '#6B7280',
        fontSize: 12,
    },
    nextFilmPlay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E50914',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    nextFilmPlayText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 24,
    },
    statsGridCard: {
        width: (SCREEN_WIDTH - 42) / 2,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        gap: 6,
    },
    statsGridValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    statsGridLabel: {
        color: '#6B7280',
        fontSize: 12,
    },

    // Films section
    filmsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    orderToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: 2,
    },
    orderButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    orderButtonActive: {
        backgroundColor: '#E50914',
    },
    orderButtonText: {
        color: '#6B7280',
        fontSize: 11,
        fontWeight: '600',
    },
    orderButtonTextActive: {
        color: '#fff',
    },
});
