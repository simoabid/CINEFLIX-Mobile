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
                        </Stack>
                        <StatusBar style="light" backgroundColor="#0A0A1F" />
                    </View>
                </ToastProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
