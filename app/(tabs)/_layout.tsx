import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, Search, List, User, Film } from "lucide-react-native";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(10, 10, 31, 0.92)',
                    borderTopColor: 'rgba(255, 255, 255, 0.08)',
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#E50914',
                tabBarInactiveTintColor: '#6B7280',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarIcon: ({ color, size }) => <Search color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name="collections"
                options={{
                    title: "Collections",
                    tabBarIcon: ({ color, size }) => <Film color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name="my-list"
                options={{
                    title: "My List",
                    tabBarIcon: ({ color, size }) => <List color={color} size={size} />
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: "My Account",
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tabs>
    );
}
