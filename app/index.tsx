import { View, Text, Pressable } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Since we haven't copied images yet, we'll use a placeholder or pure CSS
// We can use Lucide icons later

export default function WelcomeScreen() {
    return (
        <View className="flex-1 bg-netflix-black justify-center items-center relative">
            {/* Background Gradient Effect */}
            <LinearGradient
                colors={['rgba(10,10,31,0.5)', 'rgba(10,10,31,0.9)', '#0A0A1F']}
                className="absolute w-full h-full z-0"
            />

            <Animated.View entering={FadeInDown.duration(1000).springify()} className="z-10 items-center w-full px-6">
                <Text className="text-netflix-red text-6xl font-black mb-2 tracking-tighter shadow-lg">CINEFLIX</Text>
                <Text className="text-gray-300 text-lg mb-10 text-center font-medium">Unlimited movies, TV shows, and more.</Text>

                <Pressable
                    className="bg-netflix-red w-full py-4 rounded-md items-center active:opacity-80 active:scale-95 transition-all"
                    onPress={() => alert('Navigate to Login')}
                >
                    <Text className="text-white font-bold text-lg">Get Started</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}
