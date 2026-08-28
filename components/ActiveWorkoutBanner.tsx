import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
    Alert,
    Animated,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { FontFamily, Radius } from '../constants/theme';

interface ActiveWorkoutBannerProps {
    onPress?: () => void;
    style?: any;
    showDiscard?: boolean;
    /** When true the banner positions itself absolutely and can be dragged anywhere */
    draggable?: boolean;
}

const COMPACT_H = 110;

// Draggable variant — self-positioned and pan-enabled
function DraggableBanner({ onPress, showDiscard = true }: Omit<ActiveWorkoutBannerProps, 'draggable' | 'style'>) {
    const { theme } = useTheme();
    const { clearWorkout } = useWorkoutStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { width: SW, height: SH } = useWindowDimensions();
    const BANNER_W = Math.min(SW - 32, 360);

    const initialX = (SW - BANNER_W) / 2;
    const initialY = SH - COMPACT_H - Math.max(insets.bottom, 16) - 60;

    const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, { dx, dy }) =>
                Math.abs(dx) > 6 || Math.abs(dy) > 6,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                const x = (pan.x as any)._value;
                const y = (pan.y as any)._value;
                Animated.spring(pan, {
                    toValue: {
                        x: Math.max(8, Math.min(x, SW - BANNER_W - 8)),
                        y: Math.max(insets.top + 8, Math.min(y, SH - COMPACT_H - insets.bottom - 8)),
                    },
                    useNativeDriver: false,
                    bounciness: 4,
                }).start();
            },
        })
    ).current;

    const handleResume = () => {
        if (onPress) onPress();
        else router.push('/workout');
    };

    const handleDiscard = () => {
        Alert.alert(
            'Descartar Treino',
            'Tem certeza que deseja descartar o treino atual?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Descartar',
                    style: 'destructive',
                    onPress: () => { clearWorkout(); router.replace('/'); },
                },
            ]
        );
    };

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={{
                position: 'absolute',
                width: BANNER_W,
                left: pan.x,
                top: pan.y,
                zIndex: 9999,
                elevation: 12,
            }}
        >
            {/* Drag handle strip */}
            <View style={styles.handleContainer}>
                <View style={[
                    styles.handle,
                    { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)' },
                ]} />
            </View>

            <View style={[
                styles.card,
                {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                },
            ]}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Treino em Andamento
                </Text>

                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={handleResume}
                        activeOpacity={0.8}
                        style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    >
                        <Ionicons name="play" size={16} color={theme.colors.onPrimary} />
                        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Retornar</Text>
                    </TouchableOpacity>

                    {showDiscard && (
                        <TouchableOpacity
                            onPress={handleDiscard}
                            activeOpacity={0.8}
                            style={[styles.button, { backgroundColor: theme.colors.backgroundTertiary, borderWidth: 1, borderColor: theme.colors.border }]}
                        >
                            <Ionicons name="close" size={16} color={theme.colors.error} />
                            <Text style={[styles.buttonText, { color: theme.colors.error }]}>Descartar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Animated.View>
    );
}

// Static variant — used inline inside modals / screens
function StaticBanner({ onPress, style, showDiscard = true }: Omit<ActiveWorkoutBannerProps, 'draggable'>) {
    const { theme } = useTheme();
    const { clearWorkout } = useWorkoutStore();
    const router = useRouter();

    const handleResume = () => {
        if (onPress) onPress();
        else router.push('/workout');
    };

    const handleDiscard = () => {
        Alert.alert(
            'Descartar Treino',
            'Tem certeza que deseja descartar o treino atual?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Descartar',
                    style: 'destructive',
                    onPress: () => { clearWorkout(); router.replace('/'); },
                },
            ]
        );
    };

    return (
        <View style={[styles.card, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.cardBorder,
        }, style]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Treino em Andamento
            </Text>

            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={handleResume}
                    activeOpacity={0.8}
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                >
                    <Ionicons name="play" size={16} color={theme.colors.onPrimary} />
                    <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Retornar</Text>
                </TouchableOpacity>

                {showDiscard && (
                    <TouchableOpacity
                        onPress={handleDiscard}
                        activeOpacity={0.8}
                        style={[styles.button, { backgroundColor: theme.colors.backgroundTertiary, borderWidth: 1, borderColor: theme.colors.border }]}
                    >
                        <Ionicons name="close" size={16} color={theme.colors.error} />
                        <Text style={[styles.buttonText, { color: theme.colors.error }]}>Descartar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

export function ActiveWorkoutBanner({ draggable = false, ...rest }: ActiveWorkoutBannerProps) {
    if (draggable) return <DraggableBanner {...rest} />;
    return <StaticBanner {...rest} />;
}

const styles = StyleSheet.create({
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 4,
    },
    handle: {
        width: 32,
        height: 4,
        borderRadius: 2,
    },
    card: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    title: {
        fontFamily: FontFamily.displaySemiBold,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: Radius.md,
    },
    buttonText: {
        fontFamily: FontFamily.sansSemiBold,
        fontSize: 13,
        marginLeft: 6,
    },
});
