import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

const TOAST_STYLES: Record<ToastType, { border: string; bg: string }> = {
    success: { border: 'rgba(34,197,94,0.4)', bg: 'rgba(34,197,94,0.12)' },
    error: { border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.12)' },
    warning: { border: 'rgba(234,179,8,0.4)', bg: 'rgba(234,179,8,0.12)' },
    info: { border: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.12)' },
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    switch (type) {
        case 'success': return <CheckCircle color="#4ade80" size={20} />;
        case 'error': return <AlertCircle color="#ef4444" size={20} />;
        case 'warning': return <AlertTriangle color="#eab308" size={20} />;
        default: return <Info color="#60a5fa" size={20} />;
    }
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const insets = useSafeAreaInsets();

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => hideToast(id), duration);
        }
    }, [hideToast]);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <View pointerEvents="box-none" style={[styles.container, { bottom: insets.bottom + 24 }]}>
                {toasts.map((toast) => {
                    const palette = TOAST_STYLES[toast.type];
                    return (
                        <Animated.View
                            key={toast.id}
                            entering={FadeInDown.springify()}
                            exiting={FadeOutDown}
                            style={[styles.toast, { borderColor: palette.border, backgroundColor: palette.bg }]}
                        >
                            <ToastIcon type={toast.type} />
                            <Text style={styles.message} numberOfLines={3}>{toast.message}</Text>
                            <Pressable onPress={() => hideToast(toast.id)} hitSlop={8}>
                                <X color="rgba(255,255,255,0.5)" size={18} />
                            </Pressable>
                        </Animated.View>
                    );
                })}
            </View>
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        gap: 10,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ToastContext;
