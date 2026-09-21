import Palette from '../constants/palette.json';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    PanResponder,
    Platform,
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

const COMPACT_H = 68;
const MINIMIZED_W = 52;
const MINIMIZED_H = 48;

// Draggable variant — self-positioned and pan-enabled
function DraggableBanner({ onPress, showDiscard = true }: Omit<ActiveWorkoutBannerProps, 'draggable' | 'style'>) {
    const { theme } = useTheme();
    const { clearWorkout } = useWorkoutStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { width: SW, height: SH } = useWindowDimensions();
    const [minimized, setMinimized] = useState(false);
    const minimizedRef = useRef(false);
    const BANNER_W = Math.min(SW - 32, 360);

    const initialX = (SW - BANNER_W) / 2;
    const initialY = SH - COMPACT_H - Math.max(insets.bottom, 16) - 60;

    const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
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
                const currentWidth = minimizedRef.current ? MINIMIZED_W : BANNER_W;
                const currentHeight = minimizedRef.current ? MINIMIZED_H : COMPACT_H;
                Animated.spring(pan, {
                    toValue: {
                        x: Math.max(0, Math.min(x, SW - currentWidth)),
                        y: Math.max(insets.top + 8, Math.min(y, SH - currentHeight - insets.bottom - 8)),
                    },
                    useNativeDriver: false,
                    bounciness: 4,
                }).start();
            },
        })
    ).current;

    const minimizedPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,
            onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 3,
            onPanResponderGrant: () => {
                pan.setOffset({ x: SW - MINIMIZED_W, y: (pan.y as any)._value });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (_, gesture) => {
                pan.setValue({ x: 0, y: gesture.dy });
            },
            onPanResponderRelease: () => {
                pan.flattenOffset();
                const y = (pan.y as any)._value;
                Animated.spring(pan, {
                    toValue: {
                        x: SW - MINIMIZED_W,
                        y: Math.max(insets.top + 8, Math.min(y, SH - MINIMIZED_H - insets.bottom - 8)),
                    },
                    useNativeDriver: false,
                    bounciness: 3,
                }).start();
            },
        })
    ).current;

    const handleResume = () => {
        if (onPress) onPress();
        else router.push('/workout');
    };

    const handleDiscard = () => {
        const executeDiscard = () => {
            clearWorkout();
            useWorkoutStore.getState().clearWorkout();
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                try {
                    localStorage.removeItem('@active_workout_session');
                } catch {}
            }
            router.navigate('/(tabs)');
        };

        if (Platform.OS === 'web') {
            const confirmed = typeof window !== 'undefined'
                ? window.confirm('Tem certeza que deseja descartar o treino atual? O progresso da sessão será perdido.')
                : true;
            if (confirmed) {
                executeDiscard();
            }
            return;
        }

        Alert.alert(
            'Descartar Treino',
            'Tem certeza que deseja descartar o treino atual?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Descartar',
                    style: 'destructive',
                    onPress: executeDiscard,
                },
            ]
        );
    };

    const minimizeToSide = () => {
        minimizedRef.current = true;
        pan.stopAnimation(({ y }) => {
            pan.setValue({
                x: SW - MINIMIZED_W,
                y: Math.max(insets.top + 8, Math.min(y, SH - MINIMIZED_H - insets.bottom - 8)),
            });
            setMinimized(true);
        });
    };

    const restoreBanner = () => {
        minimizedRef.current = false;
        pan.stopAnimation(({ x, y }) => {
            pan.setValue({
                x: Math.max(8, Math.min(x, SW - BANNER_W - 8)),
                y: Math.max(insets.top + 8, Math.min(y, SH - COMPACT_H - insets.bottom - 8)),
            });
            setMinimized(false);
        });
    };

    if (minimized) {
        return (
            <Animated.View
                {...minimizedPanResponder.panHandlers}
                style={[styles.minimizedDock, { left: pan.x, top: pan.y, backgroundColor: theme.colors.primary }, Platform.OS === 'web' ? ({ touchAction: 'none' } as any) : null]}
            >
                <TouchableOpacity
                    onPress={restoreBanner}
                    activeOpacity={0.82}
                    accessibilityLabel="Expandir treino em andamento"
                    style={styles.minimizedButton}
                >
                    <Ionicons name="barbell-outline" size={21} color={theme.colors.onPrimary} />
                    <Ionicons name="chevron-back" size={13} color={theme.colors.onPrimary} />
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: BANNER_W,
                left: pan.x,
                top: pan.y,
                zIndex: 9999,
                elevation: 12,
            }}
        >
            <View style={[
                styles.card,
                styles.draggableCard,
                {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                },
            ]}>
                <View
                    {...panResponder.panHandlers}
                    style={[styles.dragZone, Platform.OS === 'web' ? ({ touchAction: 'none' } as any) : null]}
                >
                    <Ionicons name="move-outline" size={14} color={theme.colors.textSecondary} />
                    <Text numberOfLines={1} style={[styles.compactTitle, { color: theme.colors.text }]}>Treino ativo</Text>
                </View>

                <TouchableOpacity
                    onPress={handleResume}
                    activeOpacity={0.8}
                    style={[styles.compactResume, { backgroundColor: theme.colors.primary }]}
                >
                    <Ionicons name="play" size={14} color={theme.colors.onPrimary} />
                    <Text style={[styles.compactResumeText, { color: theme.colors.onPrimary }]}>Retomar</Text>
                </TouchableOpacity>

                {showDiscard && (
                    <TouchableOpacity
                        onPress={handleDiscard}
                        activeOpacity={0.8}
                        accessibilityLabel="Descartar treino"
                        style={[styles.compactIconButton, { backgroundColor: `${theme.colors.error}18`, borderColor: `${theme.colors.error}70` }]}
                    >
                        <Ionicons name="trash-outline" size={17} color={theme.colors.error} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={minimizeToSide}
                    accessibilityLabel="Minimizar treino na lateral"
                    style={[styles.compactIconButton, { borderColor: theme.colors.border }]}
                >
                    <Ionicons name="chevron-forward" size={17} color={theme.colors.textSecondary} />
                </TouchableOpacity>
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
        const executeDiscard = () => {
            clearWorkout();
            useWorkoutStore.getState().clearWorkout();
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                try {
                    localStorage.removeItem('@active_workout_session');
                } catch {}
            }
            router.navigate('/(tabs)');
        };

        if (Platform.OS === 'web') {
            const confirmed = typeof window !== 'undefined'
                ? window.confirm('Tem certeza que deseja descartar o treino atual? O progresso da sessão será perdido.')
                : true;
            if (confirmed) {
                executeDiscard();
            }
            return;
        }

        Alert.alert(
            'Descartar Treino',
            'Tem certeza que deseja descartar o treino atual?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Descartar',
                    style: 'destructive',
                    onPress: executeDiscard,
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
                        accessibilityLabel="Descartar treino"
                        style={[styles.button, styles.discardButton, { backgroundColor: theme.colors.backgroundTertiary, borderWidth: 1, borderColor: theme.colors.border }]}
                    >
                        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
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
    dragHeader: {
        minHeight: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
        marginBottom: 7,
    },
    draggableCard: {
        minHeight: 54,
        paddingHorizontal: 8,
        paddingVertical: 7,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dragZone: {
        minWidth: 88,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    compactTitle: {
        fontFamily: FontFamily.displaySemiBold,
        fontSize: 12,
    },
    compactResume: {
        flex: 1,
        minWidth: 88,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: Radius.md,
    },
    compactResumeText: {
        fontFamily: FontFamily.sansSemiBold,
        fontSize: 12,
    },
    compactIconButton: {
        width: 38,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: Radius.md,
    },
    dragHeaderSpacer: {
        width: 15,
    },
    minimizeButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
    },
    minimizedDock: {
        position: 'absolute',
        width: MINIMIZED_W,
        height: MINIMIZED_H,
        zIndex: 9999,
        elevation: 12,
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
        shadowColor: Palette.ink,
        shadowOffset: { width: -2, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 7,
    },
    minimizedButton: {
        width: 52,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
    },
    card: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        paddingHorizontal: 12,
        paddingTop: 7,
        paddingBottom: 11,
        shadowColor: Palette.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontFamily: FontFamily.displaySemiBold,
        fontSize: 14,
        textAlign: 'center',
        marginHorizontal: 7,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: Radius.md,
    },
    discardButton: {
        flex: 0,
        flexShrink: 0,
        width: 42,
        maxWidth: 42,
        minHeight: 40,
        paddingVertical: 8,
        paddingHorizontal: 0,
        borderRadius: Radius.md,
    },
    buttonText: {
        fontFamily: FontFamily.sansSemiBold,
        fontSize: 12,
        marginLeft: 5,
    },
});
