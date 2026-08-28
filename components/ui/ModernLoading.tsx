import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface ModernLoadingProps {
    size?: number;
    color?: string;
}

export function ModernLoading({ size = 32, color = '#8B5CF6' }: ModernLoadingProps) {
    const rotation = useSharedValue(0);
    const pulse = useSharedValue(0);

    // Normalize short hex (#RGB) to full hex (#RRGGBB) before appending alpha
    const normalizeHex = (hex: string): string => {
        if (hex.startsWith('#') && hex.length === 4) {
            const r = hex[1], g = hex[2], b = hex[3];
            return `#${r}${r}${g}${g}${b}${b}`;
        }
        return hex;
    };
    const trackColor = `${normalizeHex(color)}40`; // 25% opacity

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 1200,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
            }),
            -1,
            false
        );

        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 600, easing: Easing.ease }),
                withTiming(0, { duration: 600, easing: Easing.ease })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${rotation.value}deg` },
                { scale: interpolate(pulse.value, [0, 1], [0.85, 1.15]) }
            ],
        };
    });

    const innerStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(pulse.value, [0, 1], [0.6, 1]),
        };
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Animated.View
                style={[
                    styles.spinner,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: Math.max(2, size * 0.1),
                        borderColor: trackColor, // 25% opacity for track
                        borderTopColor: color,
                    },
                    animatedStyle,
                ]}
            />
            <Animated.View
                style={[
                    styles.innerDot,
                    {
                        width: size * 0.3,
                        height: size * 0.3,
                        borderRadius: size * 0.15,
                        backgroundColor: color,
                    },
                    innerStyle,
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        position: 'absolute',
    },
    innerDot: {
        position: 'absolute',
    },
});
