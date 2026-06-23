import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, User, setAuthToken, getAuthToken } from '../services/api';

interface AuthResult {
    success: boolean;
    error?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (email: string, password: string, name: string, avatar?: string) => Promise<AuthResult>;
    googleLogin: (token: string, type?: 'id_token' | 'access_token') => Promise<AuthResult>;
    logout: () => Promise<void>;
    updateProfile: (data: { name?: string; avatar?: string }) => Promise<AuthResult>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const response = await authApi.getMe();
            if (response.success && response.data) {
                setUser(response.data.user);
            } else {
                setAuthToken(null);
                setUser(null);
            }
        } catch (error) {
            setAuthToken(null);
            setUser(null);
        }
    }, []);

    // On mount, hydrate the token from AsyncStorage and validate it. We only hit
    // the backend when a token actually exists to avoid noisy network errors when
    // running without a backend (local-only mode).
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const stored = await AsyncStorage.getItem('auth_token');
                if (stored) {
                    setAuthToken(stored);
                    await refreshUser();
                }
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [refreshUser]);

    const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
        try {
            const response = await authApi.login(email, password);
            if (response.success && response.data) {
                setAuthToken(response.data.token);
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, error: response.error || 'Login failed' };
        } catch {
            return { success: false, error: 'An unexpected error occurred' };
        }
    }, []);

    const register = useCallback(async (email: string, password: string, name: string, avatar?: string): Promise<AuthResult> => {
        try {
            const response = await authApi.register(email, password, name, avatar);
            if (response.success && response.data) {
                setAuthToken(response.data.token);
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, error: response.error || 'Registration failed' };
        } catch {
            return { success: false, error: 'An unexpected error occurred' };
        }
    }, []);

    const googleLogin = useCallback(async (token: string, type: 'id_token' | 'access_token' = 'access_token'): Promise<AuthResult> => {
        try {
            const response = await authApi.googleLogin(token, type);
            if (response.success && response.data) {
                setAuthToken(response.data.token);
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, error: response.error || 'Google login failed' };
        } catch {
            return { success: false, error: 'An unexpected error occurred' };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            if (getAuthToken()) {
                await authApi.logout();
            }
        } finally {
            setAuthToken(null);
            setUser(null);
        }
    }, []);

    const updateProfile = useCallback(async (data: { name?: string; avatar?: string }): Promise<AuthResult> => {
        try {
            const response = await authApi.updateProfile(data);
            if (response.success && response.data) {
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, error: response.error || 'Update failed' };
        } catch {
            return { success: false, error: 'An unexpected error occurred' };
        }
    }, []);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
        try {
            const response = await authApi.changePassword(currentPassword, newPassword);
            if (response.success) {
                return { success: true };
            }
            return { success: false, error: response.error || 'Password change failed' };
        } catch {
            return { success: false, error: 'An unexpected error occurred' };
        }
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
