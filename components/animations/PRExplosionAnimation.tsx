import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface ParticleProps {
    id: number;
    color: string;
}

const Particle = ({ color }: ParticleProps) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(1);

    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 150;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;

    useEffect(() => {
        scale.value = withSpring(Math.random() * 1.5 + 0.5);
        translateX.value = withTiming(targetX, {
            duration: 800 + Math.random() * 400,
            easing: Easing.out(Easing.quad)
        });
        translateY.value = withTiming(targetY, {
            duration: 800 + Math.random() * 400,
            easing: Easing.out(Easing.quad)
        });
        opacity.value = withDelay(400, withTiming(0, { duration: 600 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                { backgroundColor: color },
                animatedStyle
            ]}
        />
    );
};

interface PRExplosionAnimationProps {
    visible: boolean;
    onComplete: () => void;
}

export const PRExplosionAnimation = ({ visible, onComplete }: PRExplosionAnimationProps) => {
    const [active, setActive] = useState(false);
    const { theme } = useTheme();
    const titleScale = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            setActive(true);
            containerOpacity.value = withTiming(1, { duration: 200 });
            titleScale.value = withSequence(
                withSpring(1.2, { damping: 10 }),
                withSpring(1)
            );
            titleOpacity.value = withTiming(1, { duration: 300 });

            const timer = setTimeout(() => {
                containerOpacity.value = withTiming(0, { duration: 400 }, () => {
                    runOnJS(handleFinish)();
                });
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleFinish = () => {
        setActive(false);
        onComplete();
        titleScale.value = 0;
        titleOpacity.value = 0;
    };

    const titleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: titleScale.value }],
        opacity: titleOpacity.value,
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    if (!active) return null;

    const particleColors = [theme.colors.primary, '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];
    const particles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        color: particleColors[i % particleColors.length],
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
            <View style={styles.center}>
                {particles.map((p) => (
                    <Particle key={p.id} id={p.id} color={p.color} />
                ))}

                <Animated.View style={[styles.messageContainer, titleStyle]}>
                    <Ionicons name="trophy" size={56} color="#F59E0B" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 8 }} />
                    <Text style={[styles.title, { color: '#F59E0B', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }]}>NOVO RECORDE!</Text>
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
    particle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
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
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        color: '#000',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: 'rgba(0,0,0,0.7)',
        fontSize: 14,
        fontWeight: '800',
        marginTop: 2,
        textAlign: 'center',
    },
});
