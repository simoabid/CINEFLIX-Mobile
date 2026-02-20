import { Movie, TVShow } from './index';

export interface MyListItem {
    id: string; // Internal ID for the list item
    contentId: number; // TMDB ID
    contentType: 'movie' | 'tv';
    content: Movie | TVShow;
    dateAdded: string; // ISO timestamp
    status: 'planToWatch' | 'inProgress' | 'completed' | 'dropped';
    priority: 'low' | 'medium' | 'high';
    isLiked: boolean;
    progress?: number; // 0-100 percentage
    customTags?: string[]; // User-defined tags for organization
    personalRating?: number; // 1-10 string
    notes?: string;
}

export interface CustomCollection {
    id: string;
    name: string;
    description?: string;
    items: string[]; // Array of MyListItem IDs
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    coverImage?: string; // Optional custom cover image
}

export interface ListStats {
    totalItems: number;
    totalMovies: number;
    totalTVShows: number;
    totalHours: number;
    completionRate: number;
    averageRating: number;
    genreDistribution: Record<string, number>;
    statusDistribution: {
        notStarted: number;
        inProgress: number;
        completed: number;
        dropped: number;
    };
    monthlyAdditions: Record<string, number>;
}

export interface FilterOptions {
    contentType?: 'movie' | 'tv' | 'all';
    status?: 'planToWatch' | 'inProgress' | 'completed' | 'dropped' | 'all';
    liked?: 'liked' | 'not_liked' | 'all';
    genres?: number[];
    isLiked?: boolean;
    hasTags?: string[];
    priority?: 'low' | 'medium' | 'high' | 'all';
}

export interface ListPreferences {
    defaultSortOption: 'dateAdded' | 'releaseDate' | 'title' | 'personalRating' | 'priority';
    defaultSortDirection: 'asc' | 'desc';
    defaultViewMode: 'grid' | 'list' | 'compact';
    autoRemoveCompleted: boolean;
    autoRemoveAfterDays: number;
    showProgressBars: boolean;
    enableNotifications: boolean;
    compactModeItemsPerRow: number;
}

export interface BulkOperation {
    type: 'delete' | 'markCompleted' | 'changePriority' | 'addTags';
    itemIds: string[];
    payload?: any;
}
