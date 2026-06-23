import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <ToastProvider>
                    <View className="flex-1 bg-netflix-black">
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                contentStyle: { backgroundColor: '#0A0A1F' },
                                animation: 'fade'
                            }}
                        >
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            {/* Auth */}
                            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
                            <Stack.Screen name="signup" options={{ presentation: 'modal' }} />
                            {/* Browse destinations (web navbar parity) */}
                            <Stack.Screen name="movies" />
                            <Stack.Screen name="tv-shows" />
                            <Stack.Screen name="new-popular" />
                            <Stack.Screen name="browse" />
                            <Stack.Screen name="continue-watching" />
                            {/* Playback */}
                            <Stack.Screen name="watch/[type]/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
                        </Stack>
                        <StatusBar style="light" backgroundColor="#0A0A1F" />
                    </View>
                </ToastProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
