import { View, Text } from "react-native";

// STUB — to be implemented (parity with web src/pages/WatchPage.tsx).
// Playback: WebView iframe player (rivestream/smashystream/111movies sources),
// Stream/Download/Torrent tabs, season/episode selector, watch-progress tracking,
// like/add-to-list, similar content. Route: /watch/[type]/[id].
export default function WatchScreen() {
    return (
        <View className="flex-1 bg-black justify-center items-center">
            <Text className="text-white text-lg">Watch</Text>
            <Text className="text-netflix-lightgray mt-2">Coming soon</Text>
        </View>
    );
}
