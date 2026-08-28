import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { hapticSuccess, hapticError, hapticWarning, hapticLight } from '../utils/haptics';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'pr' | 'sync' | 'offline';

export interface ToastOptions {
    id?: string;
    type?: ToastType;
    title?: string;
    message: string;
    duration?: number;
    actionLabel?: string;
    onAction?: () => void;
}

interface ToastItem extends ToastOptions {
    id: string;
    type: ToastType;
}

interface ToastContextType {
    show: (options: ToastOptions | string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    pr: (message: string, exerciseName?: string) => void;
    sync: (message: string) => void;
    offline: (message?: string) => void;
    hide: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();

    const hide = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback((options: ToastOptions | string) => {
        const item: ToastItem = typeof options === 'string'
            ? { id: `${Date.now()}-${Math.random()}`, message: options, type: 'info', duration: 2500 }
            : {
                id: options.id || `${Date.now()}-${Math.random()}`,
                type: options.type || 'info',
                title: options.title,
                message: options.message,
                duration: options.duration ?? (options.type === 'error' ? 3500 : 2500),
                actionLabel: options.actionLabel,
                onAction: options.onAction
            };

        // Haptics based on type
        if (item.type === 'success' || item.type === 'pr') hapticSuccess();
        else if (item.type === 'error') hapticError();
        else if (item.type === 'warning') hapticWarning();
        else hapticLight();

        setToasts(prev => [item, ...prev.slice(0, 2)]); // Max 3 concurrent

        if (item.duration && item.duration > 0) {
            setTimeout(() => {
                hide(item.id);
            }, item.duration);
        }
    }, [hide]);

    const success = useCallback((message: string, title?: string) => {
        show({ type: 'success', message, title });
    }, [show]);

    const error = useCallback((message: string, title?: string) => {
        show({ type: 'error', message, title: title || 'Atenção' });
    }, [show]);

    const info = useCallback((message: string, title?: string) => {
        show({ type: 'info', message, title });
    }, [show]);

    const warning = useCallback((message: string, title?: string) => {
        show({ type: 'warning', message, title });
    }, [show]);

    const pr = useCallback((message: string, exerciseName?: string) => {
        show({ type: 'pr', message, title: exerciseName ? `Novo Recorde • ${exerciseName}` : '🏆 NOVO RECORDE PESSOAL!' });
    }, [show]);

    const sync = useCallback((message: string) => {
        show({ type: 'sync', message, title: 'Sincronização' });
    }, [show]);

    const offline = useCallback((message?: string) => {
        show({
            type: 'offline',
            message: message || 'Você está offline. Seus dados continuam salvos no aparelho.',
            title: 'Modo Offline'
        });
    }, [show]);

    const getToastStyle = (type: ToastType) => {
        const isDark = theme.mode === 'dark';
        switch (type) {
            case 'success':
                return {
                    bg: isDark ? '#0C281E' : '#ECFDF5',
                    border: isDark ? '#10B98150' : '#A7F3D0',
                    icon: 'checkmark-circle' as const,
                    iconColor: '#10B981',
                    textColor: isDark ? '#D1FAE5' : '#065F46',
                };
            case 'error':
                return {
                    bg: isDark ? '#2C1214' : '#FEF2F2',
                    border: isDark ? '#EF444450' : '#FECACA',
                    icon: 'alert-circle' as const,
                    iconColor: '#EF4444',
                    textColor: isDark ? '#FEE2E2' : '#991B1B',
                };
            case 'warning':
                return {
                    bg: isDark ? '#2B1E0C' : '#FFFBEB',
                    border: isDark ? '#F59E0B50' : '#FDE68A',
                    icon: 'warning' as const,
                    iconColor: '#F59E0B',
                    textColor: isDark ? '#FEF3C7' : '#92400E',
                };
            case 'pr':
                return {
                    bg: isDark ? '#261F0B' : '#FEFCE8',
                    border: isDark ? '#EAB30880' : '#FDE047',
                    icon: 'trophy' as const,
                    iconColor: '#EAB308',
                    textColor: isDark ? '#FEF08A' : '#854D0E',
                };
            case 'sync':
                return {
                    bg: isDark ? '#111827' : '#F0FDF4',
                    border: isDark ? '#3B82F650' : '#BFDBFE',
                    icon: 'sync' as const,
                    iconColor: '#3B82F6',
                    textColor: isDark ? '#DBEAFE' : '#1E40AF',
                };
            case 'offline':
                return {
                    bg: isDark ? '#1E2430' : '#F1F5F9',
                    border: isDark ? '#64748B50' : '#CBD5E1',
                    icon: 'cloud-offline' as const,
                    iconColor: '#94A3B8',
                    textColor: isDark ? '#E2E8F0' : '#334155',
                };
            default: // info
                return {
                    bg: isDark ? '#131D2E' : '#EFF6FF',
                    border: isDark ? '#3B82F650' : '#BFDBFE',
                    icon: 'information-circle' as const,
                    iconColor: '#3B82F6',
                    textColor: isDark ? '#DBEAFE' : '#1E40AF',
                };
        }
    };

    return (
        <ToastContext.Provider value={{ show, success, error, info, warning, pr, sync, offline, hide }}>
            {children}
            <View
                pointerEvents="box-none"
                style={[
                    styles.toastContainer,
                    { top: Math.max(insets.top, 16) + 4 }
                ]}
            >
                {toasts.map(item => {
                    const cfg = getToastStyle(item.type);
                    return (
                        <Animated.View
                            key={item.id}
                            entering={FadeInUp.duration(200)}
                            exiting={FadeOutUp.duration(150)}
                            layout={LinearTransition.springify()}
                            style={[
                                styles.toastCard,
                                {
                                    backgroundColor: cfg.bg,
                                    borderColor: cfg.border,
                                }
                            ]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => hide(item.id)}
                                style={styles.toastInner}
                            >
                                <View style={styles.iconWrapper}>
                                    <Ionicons name={cfg.icon} size={20} color={cfg.iconColor} />
                                </View>
                                <View style={styles.textWrapper}>
                                    {item.title ? (
                                        <Text style={[styles.title, { color: cfg.textColor }]} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                    ) : null}
                                    <Text style={[styles.message, { color: cfg.textColor }]} numberOfLines={2}>
                                        {item.message}
                                    </Text>
                                </View>
                                {item.actionLabel && item.onAction ? (
                                    <TouchableOpacity
                                        onPress={() => {
                                            item.onAction?.();
                                            hide(item.id);
                                        }}
                                        style={[styles.actionBtn, { borderColor: cfg.iconColor }]}
                                    >
                                        <Text style={[styles.actionText, { color: cfg.iconColor }]}>
                                            {item.actionLabel}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={() => hide(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Ionicons name="close" size={16} color={cfg.iconColor} style={{ opacity: 0.6 }} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
        alignItems: 'center',
    },
    toastCard: {
        width: '100%',
        maxWidth: 480,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    toastInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    iconWrapper: {
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrapper: {
        flex: 1,
        paddingRight: 8,
    },
    title: {
        fontFamily: 'Sora_600SemiBold',
        fontSize: 13,
        marginBottom: 2,
    },
    message: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12.5,
        lineHeight: 17,
    },
    actionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        marginLeft: 6,
    },
    actionText: {
        fontFamily: 'Sora_600SemiBold',
        fontSize: 11,
    },
});
