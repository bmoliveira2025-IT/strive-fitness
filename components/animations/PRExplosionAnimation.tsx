import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PRExplosionAnimationProps {
    visible: boolean;
    onComplete: () => void;
}

export const PRExplosionAnimation = ({ visible, onComplete }: PRExplosionAnimationProps) => {
    const [active, setActive] = useState(false);
    const { theme } = useTheme();
    const reducedMotion = useReducedMotion();
    const titleScale = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(0);

    const handleFinish = useCallback(() => {
        setActive(false);
        onComplete();
        titleScale.value = 0;
        titleOpacity.value = 0;
    }, [onComplete, titleOpacity, titleScale]);

    useEffect(() => {
        if (visible) {
            setActive(true);
            containerOpacity.value = withTiming(1, { duration: reducedMotion ? 0 : 160 });
            titleScale.value = reducedMotion
                ? 1
                : withSequence(withSpring(1.08, { damping: 14 }), withSpring(1));
            titleOpacity.value = withTiming(1, { duration: reducedMotion ? 0 : 180 });

            const timer = setTimeout(() => {
                containerOpacity.value = withTiming(0, { duration: reducedMotion ? 0 : 180 }, () => {
                    runOnJS(handleFinish)();
                });
            }, reducedMotion ? 900 : 1400);

            return () => clearTimeout(timer);
        }
    }, [containerOpacity, handleFinish, reducedMotion, titleOpacity, titleScale, visible]);

    const titleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: titleScale.value }],
        opacity: titleOpacity.value,
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    if (!active) return null;

    return (
        <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
            <View style={styles.center}>
                <Animated.View style={[styles.messageContainer, titleStyle]}>
                    <Ionicons name="trophy" size={56} color={theme.colors.warning} style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 8 }} />
                    <Text style={[styles.title, { color: theme.colors.warning, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }]}>NOVO RECORDE!</Text>
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    gradient: {
        paddingHorizontal: 30,
        paddingVertical: 20,
        borderRadius: 24,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    title: {
        color: '#000',
        fontSize: 24,
        fontFamily: 'Inter_700Bold', fontWeight: '700',
        marginTop: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: 'rgba(0,0,0,0.7)',
        fontSize: 14,
        fontFamily: 'Inter_700Bold', fontWeight: '700',
        marginTop: 2,
        textAlign: 'center',
    },
});
