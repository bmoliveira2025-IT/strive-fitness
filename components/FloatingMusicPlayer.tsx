import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSegments } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated as RNAnimated,
    Dimensions,
    PanResponder,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, Radius } from '../constants/theme';
import { formatMediaUrl, useMusicPlayer } from '../context/MusicPlayerContext';
import { useTheme } from '../context/ThemeContext';
import { MarqueeText } from './ui/MarqueeText';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 3-Bar Live Audio Equalizer with Organic Waves
function LiveAudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
    const { theme } = useTheme();
    const h1 = useSharedValue(4);
    const h2 = useSharedValue(6);
    const h3 = useSharedValue(4);

    useEffect(() => {
        if (isPlaying) {
            h1.value = withRepeat(
                withSequence(
                    withTiming(14, { duration: 220 }),
                    withTiming(4, { duration: 180 }),
                    withTiming(10, { duration: 240 }),
                    withTiming(3, { duration: 190 })
                ),
                -1,
                true
            );
            h2.value = withRepeat(
                withSequence(
                    withTiming(5, { duration: 190 }),
                    withTiming(16, { duration: 260 }),
                    withTiming(6, { duration: 210 }),
                    withTiming(15, { duration: 200 })
                ),
                -1,
                true
            );
            h3.value = withRepeat(
                withSequence(
                    withTiming(12, { duration: 240 }),
                    withTiming(3, { duration: 200 }),
                    withTiming(15, { duration: 220 }),
                    withTiming(5, { duration: 180 })
                ),
                -1,
                true
            );
        } else {
            h1.value = withTiming(3, { duration: 200 });
            h2.value = withTiming(3, { duration: 200 });
            h3.value = withTiming(3, { duration: 200 });
        }
    }, [isPlaying]);

    const s1 = useAnimatedStyle(() => ({ height: h1.value }));
    const s2 = useAnimatedStyle(() => ({ height: h2.value }));
    const s3 = useAnimatedStyle(() => ({ height: h3.value }));

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 16, gap: 2.5 }}>
            <Animated.View style={[{ width: 2.5, backgroundColor: theme.colors.primary, borderRadius: 1.5 }, s1]} />
            <Animated.View style={[{ width: 2.5, backgroundColor: theme.colors.primary, borderRadius: 1.5 }, s2]} />
            <Animated.View style={[{ width: 2.5, backgroundColor: theme.colors.primary, borderRadius: 1.5 }, s3]} />
        </View>
    );
}

export function FloatingMusicPlayer() {
    const { theme } = useTheme();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const { currentItem, isPlaying, isBuffering, togglePlay, nextTrack } = useMusicPlayer();

    // Coordinates for floating expanded player
    const pan = useRef(new RNAnimated.ValueXY({ x: 12, y: insets.top + 10 })).current;

    // Y-coordinate for lateral minimized tab
    const sideTabY = useRef(new RNAnimated.Value(insets.top + 70)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value || 0,
                    y: (pan.y as any)._value || 0,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: RNAnimated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
            },
        })
    ).current;

    const sideTabPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 6;
            },
            onPanResponderGrant: () => {
                sideTabY.setOffset((sideTabY as any)._value || 0);
                sideTabY.setValue(0);
            },
            onPanResponderMove: RNAnimated.event(
                [null, { dy: sideTabY }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                sideTabY.flattenOffset();
            },
        })
    ).current;

    // Hide if completely dismissed, stopped, or on Home tab
    if (isDismissed || (!isPlaying && !isBuffering)) return null;

    const isHomeScreen = !segments || !segments[1] || (segments[0] as string) !== '(tabs)' || (segments[1] as string) === 'index';
    if (isHomeScreen) return null;

    const logoUri = formatMediaUrl(currentItem?.logo);
    const isConnecting = isBuffering && !isPlaying;

    // --- MINIMIZED LATERAL TAB (Aba Lateral Ultra Moderna) ---
    if (isMinimized) {
        return (
            <RNAnimated.View
                {...sideTabPanResponder.panHandlers}
                style={{
                    position: 'absolute',
                    right: 0,
                    top: sideTabY,
                    zIndex: 99999,
                    elevation: 14,
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: -2, height: 4 },
                    shadowOpacity: 0.45,
                    shadowRadius: 10,
                }}
            >
                <TouchableOpacity
                    onPress={() => setIsMinimized(false)}
                    activeOpacity={0.88}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.mode === 'dark' ? '#0F121A' : '#FFFFFF',
                        borderTopLeftRadius: 26,
                        borderBottomLeftRadius: 26,
                        borderWidth: 1.5,
                        borderRightWidth: 0,
                        borderColor: theme.colors.primary,
                        paddingVertical: 6,
                        paddingLeft: 10,
                        paddingRight: 8,
                        gap: 8,
                    }}
                >
                    <Ionicons name="chevron-back" size={14} color={theme.colors.primary} />

                    <View
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: theme.mode === 'dark' ? '#1B202E' : '#F1F5F9',
                            overflow: 'hidden',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1.2,
                            borderColor: theme.colors.primary + '50',
                        }}
                    >
                        {logoUri ? (
                            <Image
                                source={{ uri: logoUri }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <Ionicons
                                name={currentItem?.type === 'song' ? 'musical-note' : 'radio'}
                                size={14}
                                color={theme.colors.primary}
                            />
                        )}
                    </View>

                    <LiveAudioVisualizer isPlaying={isPlaying} />
                </TouchableOpacity>
            </RNAnimated.View>
        );
    }

    // --- EXPANDED FLOATING CAPSULE (Design Cápsula Fluida Premium) ---
    return (
        <RNAnimated.View
            {...panResponder.panHandlers}
            style={{
                position: 'absolute',
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                width: SCREEN_WIDTH - 24,
                maxWidth: 420,
                zIndex: 99999,
                borderRadius: Radius.full,
                overflow: 'hidden',
                borderWidth: 1.2,
                borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: theme.mode === 'dark' ? 0.35 : 0.18,
                shadowRadius: 14,
                elevation: 12,
            }}
        >
            <LinearGradient
                colors={
                    theme.mode === 'dark'
                        ? ['#161922', '#0D0F14']
                        : ['#FFFFFF', '#F8FAFC']
                }
                style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {/* Left Section: Cover + Info + Equalizer */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    {/* Album Art with Neon Border */}
                    <View
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: theme.mode === 'dark' ? '#1D212E' : '#F1F5F9',
                            overflow: 'hidden',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1.5,
                            borderColor: isPlaying ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)',
                            marginRight: 10,
                        }}
                    >
                        {logoUri ? (
                            <Image
                                source={{ uri: logoUri }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <Ionicons
                                name={currentItem?.type === 'song' ? 'musical-note' : 'radio'}
                                size={18}
                                color={theme.colors.primary}
                            />
                        )}
                    </View>

                    {/* Track Title & Artist */}
                    <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                        <MarqueeText
                            text={currentItem?.title || 'Música de Treino'}
                            isPlaying={isPlaying}
                            style={{
                                color: theme.colors.text,
                                fontSize: 13,
                                fontFamily: FontFamily.sansBold,
                                letterSpacing: -0.2,
                            }}
                            containerStyle={{ width: '100%' }}
                        />

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                            <MarqueeText
                                text={currentItem?.artist || 'MusiKA'}
                                isPlaying={isPlaying}
                                style={{
                                    color: theme.colors.textMuted,
                                    fontSize: 11,
                                    fontFamily: FontFamily.sansMedium,
                                }}
                                containerStyle={{ flex: 1, minWidth: 0 }}
                            />

                            <LiveAudioVisualizer isPlaying={isPlaying} />
                        </View>
                    </View>
                </View>

                {/* Right Section: Hero Play Button + Next + Minimize */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Hero Play/Pause Button */}
                    <TouchableOpacity
                        onPress={togglePlay}
                        activeOpacity={0.82}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: theme.colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.45,
                            shadowRadius: 6,
                            elevation: 5,
                        }}
                    >
                        {isConnecting ? (
                            <ActivityIndicator size="small" color="#000000" />
                        ) : (
                            <Ionicons
                                name={isPlaying ? 'pause' : 'play'}
                                size={18}
                                color="#000000"
                                style={!isPlaying ? { marginLeft: 2 } : undefined}
                            />
                        )}
                    </TouchableOpacity>

                    {/* Next Track Button */}
                    <TouchableOpacity
                        onPress={nextTrack}
                        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                        activeOpacity={0.7}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="play-skip-forward" size={15} color={theme.colors.text} />
                    </TouchableOpacity>

                    {/* Minimize Button (Recolher lateralmente) */}
                    <TouchableOpacity
                        onPress={() => setIsMinimized(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                        activeOpacity={0.7}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </RNAnimated.View>
    );
}
