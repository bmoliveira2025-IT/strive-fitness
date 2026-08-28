import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';
import { FontFamily } from '../../constants/theme';

interface HomeHeaderProps {
    userName: string;
    streak: number;
    unreadCount: number;
    onNotificationPress: () => void;
}

export function HomeHeader({ userName, streak, unreadCount, onNotificationPress }: HomeHeaderProps) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { profile } = useUserStore();
    const router = useRouter();

    const [currentMode, setCurrentMode] = useState<'user' | 'strive'>('user');
    const animProgress = useSharedValue(0); // 0 = user, 1 = strive

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMode(prev => (prev === 'user' ? 'strive' : 'user'));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        animProgress.value = withTiming(currentMode === 'user' ? 0 : 1, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [currentMode]);

    const userStyle = useAnimatedStyle(() => ({
        opacity: interpolate(animProgress.value, [0, 0.35, 1], [1, 0, 0]),
        transform: [
            { translateY: interpolate(animProgress.value, [0, 1], [0, -10]) }
        ],
    }));

    const striveStyle = useAnimatedStyle(() => ({
        opacity: interpolate(animProgress.value, [0, 0.65, 1], [0, 0, 1]),
        transform: [
            { translateY: interpolate(animProgress.value, [0, 1], [10, 0]) }
        ],
    }));

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 5) return 'Boa noite';
        if (h < 12) return 'Bom dia';
        if (h < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const initials = userName ? userName.charAt(0).toUpperCase() : 'S';

    return (
        <View style={{ paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: 'transparent' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Left: Avatar + Alternating Greeting/Strive */}
                <TouchableOpacity
                    onPress={() => router.push('/profile')}
                    activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}
                >
                    {/* Avatar circle */}
                    <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        overflow: 'hidden',
                        marginRight: 12,
                        borderWidth: 1.5,
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.backgroundTertiary,
                    }}>
                        {profile?.photoUri ? (
                            <Image
                                source={{ uri: profile.photoUri }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.colors.backgroundTertiary,
                            }}>
                                <Text style={{
                                    color: theme.colors.primary,
                                    fontSize: 18,
                                    fontFamily: FontFamily.display,
                                    fontWeight: '800',
                                }}>
                                    {initials}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Alternating text container */}
                    <View style={{ flex: 1, height: 42, justifyContent: 'center', position: 'relative' }}>
                        {/* User Greeting */}
                        <Animated.View
                            pointerEvents={currentMode === 'user' ? 'auto' : 'none'}
                            style={[{ position: 'absolute', left: 0, right: 0 }, userStyle]}
                        >
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: theme.colors.textMuted,
                                    fontSize: 12,
                                    fontFamily: FontFamily.sansMedium,
                                    letterSpacing: 0.2,
                                    marginBottom: 1,
                                }}
                            >
                                {getGreeting()}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: theme.colors.text,
                                    fontSize: 18,
                                    fontFamily: FontFamily.display,
                                    letterSpacing: -0.3,
                                }}
                            >
                                {userName || 'Atleta'}
                            </Text>
                        </Animated.View>

                        {/* Strive Branding */}
                        <Animated.View
                            pointerEvents={currentMode === 'strive' ? 'auto' : 'none'}
                            style={[{ position: 'absolute', left: 0, right: 0 }, striveStyle]}
                        >
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: theme.colors.textMuted,
                                    fontSize: 12,
                                    fontFamily: FontFamily.sansMedium,
                                    letterSpacing: 0.2,
                                    marginBottom: 1,
                                }}
                            >
                                Bem-vindo ao
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: theme.colors.text,
                                        fontSize: 18,
                                        fontFamily: FontFamily.display,
                                        letterSpacing: -0.3,
                                        fontWeight: '800',
                                    }}
                                >
                                    Strive
                                </Text>
                                <View
                                    style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: 2.5,
                                        backgroundColor: theme.colors.primary,
                                        marginLeft: 3,
                                        marginTop: 4,
                                    }}
                                />
                            </View>
                        </Animated.View>
                    </View>
                </TouchableOpacity>

                {/* Right: Streak badge + Notifications */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => router.push('/streak')}
                        activeOpacity={0.75}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            height: 38,
                            paddingHorizontal: 12,
                            borderRadius: 19,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.card,
                        }}
                    >
                        <Ionicons
                            name="flame"
                            size={16}
                            color="#F59E0B"
                        />
                        <Text style={{
                            color: theme.colors.text,
                            fontFamily: FontFamily.displaySemiBold,
                            marginLeft: 4,
                            fontSize: 13,
                        }}>
                            {streak}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onNotificationPress}
                        activeOpacity={0.75}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.card,
                        }}
                    >
                        <Ionicons name="notifications-outline" size={18} color={theme.colors.textSecondary} />
                        {unreadCount > 0 && (
                            <View style={{
                                position: 'absolute',
                                top: 9,
                                right: 9,
                                width: 7,
                                height: 7,
                                backgroundColor: theme.colors.error,
                                borderRadius: 3.5,
                            }} />
                        )}
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
}
