import { View, Text, ScrollView, Image, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import * as tmdb from "../../services/tmdb";
import { Movie, TVShow } from "../../types";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

type ComingSoonItem = (Movie | TVShow) & { coming_date: string };

const UpcomingCard = ({ item }: { item: ComingSoonItem }) => {
    const isMovie = 'title' in item;
    const title = isMovie ? (item as Movie).title : (item as TVShow).name;
    const overview = item.overview;
    const date = new Date(item.coming_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <Animated.View entering={FadeInDown.duration(500)} className="mb-6 flex-row">
            <View className="w-16 pt-2 items-center mr-2">
                <Text className="text-gray-400 font-bold text-xs uppercase">{new Date(item.coming_date).toLocaleDateString('en-US', { month: 'short' })}</Text>
                <Text className="text-white font-black text-3xl">{new Date(item.coming_date).getDate()}</Text>
            </View>

            <View className="flex-1">
                <View className="relative h-48 mb-3 rounded-lg overflow-hidden bg-gray-800">
                    <Image
                        source={{ uri: tmdb.getImageUrl(item.backdrop_path || item.poster_path, 'w500') }}
                        className="w-full h-full opacity-80"
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                    <View className="absolute bottom-0 left-0 p-2 bg-black/50 rounded-tr-lg">
                        <Image 
                            source={{ uri: tmdb.getImageUrl(item.logo_path, 'w300') }}
                            className="h-10 w-32"
                            resizeMode="contain"
                            style={{ height: 40, width: 128 }}
                        />
                    </View>
                </View>

                <Text className="text-white font-bold text-xl mb-1">{title}</Text>
                <Text className="text-gray-400 text-sm mb-3 line-clamp-3" numberOfLines={3}>{overview}</Text>
                
                <View className="flex-row gap-2">
                     {item.genre_ids?.slice(0, 3).map(id => (
                        <Text key={id} className="text-white text-xs bg-gray-800 px-2 py-1 rounded">
                            Genre
                        </Text>
                     ))}
                </View>
            </View>
        </Animated.View>
    );
}

export default function NewPopular() {
  const [upcoming, setUpcoming] = useState<ComingSoonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        try {
            const movies = await tmdb.getUpcomingMovies();
            // Simulate future dates for demo purposes as API might return mixed dates
            const items = movies.results.map((m, i) => ({
                ...m,
                coming_date: new Date(Date.now() + (i + 1) * 86400000 * 2).toISOString(), // Every 2 days
                media_type: 'movie' as const
            }));
            setUpcoming(items);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, []);

  return (
    <View className="flex-1 bg-netflix-black">
      <StatusBar style="light" />
      <View className="px-4 py-3 border-b border-gray-800 bg-netflix-black/90 z-10 pt-12">
          <Text className="text-white text-lg font-bold">New & Hot</Text>
      </View>
      
      {loading ? (
          <View className="flex-1 justify-center items-center">
              <ActivityIndicator color="#E50914" size="large" />
          </View>
      ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
              <View className="flex-row mb-6 items-center">
                  <Text className="text-white text-lg font-bold mr-2">🍿</Text>
                  <Text className="text-white text-lg font-bold">Coming Soon</Text>
              </View>
              {upcoming.map(item => <UpcomingCard key={item.id} item={item} />)}
              <View className="h-20" />
          </ScrollView>
      )}
    </View>
  );
}
