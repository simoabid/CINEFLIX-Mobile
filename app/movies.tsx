import { View, Text } from "react-native";

// STUB — to be implemented (parity with web src/pages/Movies.tsx).
// Movies browse: hero carousel with trailers, FilterBar (genre/year/rating/search),
// genre-based ContentCarousel rows (Trending, Popular, Top Rated, Now Playing, Upcoming).
export default function MoviesScreen() {
    return (
        <View className="flex-1 bg-surface-background justify-center items-center">
            <Text className="text-white text-lg">Movies</Text>
            <Text className="text-netflix-lightgray mt-2">Coming soon</Text>
        </View>
    );
}
