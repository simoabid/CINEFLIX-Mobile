import React, { ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    /** Where to send unauthenticated users. Defaults to the login screen. */
    redirectTo?: string;
}

/**
 * Gates a screen behind authentication, mirroring the web app's
 * `components/ProtectedRoute`. While the auth state is hydrating it shows a
 * spinner; once resolved it either renders the children or redirects.
 */
export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View className="flex-1 bg-netflix-black justify-center items-center">
                <ActivityIndicator color="#E50914" size="large" />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href={redirectTo as never} />;
    }

    return <>{children}</>;
}
