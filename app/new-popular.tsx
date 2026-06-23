import { View, Text } from "react-native";

// STUB — to be implemented (parity with web src/pages/NewPopularPage.tsx).
// Curated discovery: New Releases, Trending Now, Coming Soon, Top 10 Movies,
// Top 10 TV, Recently Added; content-type/sort/time-period filters; grid/carousel toggle.
export default function NewPopularScreen() {
    return (
        <View className="flex-1 bg-surface-background justify-center items-center">
            <Text className="text-white text-lg">New & Popular</Text>
            <Text className="text-netflix-lightgray mt-2">Coming soon</Text>
        </View>
    );
}
