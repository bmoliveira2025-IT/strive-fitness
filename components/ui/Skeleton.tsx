import React, { useEffect } from 'react';
import { ViewStyle, DimensionValue } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
    className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style, className }: SkeletonProps) {
    const { theme } = useTheme();
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        if (reducedMotion) {
            opacity.value = 0.5;
            return;
        }
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // infinite loop
            true // reverse
        );
    }, [opacity, reducedMotion]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.colors.cardBorder, // Use the border color as base skeleton color
                },
                style,
                animatedStyle,
            ]}
            className={className}
        />
    );
}
