import Palette from '../constants/palette.json';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props {
    onFinish: () => void;
}

export const AnimatedSplashScreen: React.FC<Props> = ({ onFinish }) => {
    const reducedMotion = useReducedMotion();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Animation values
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(30);
    const lineScaleX = useSharedValue(0);
    const dotScale = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        let isDone = false;
        const complete = () => {
            if (!isDone) {
                isDone = true;
                onFinish();
            }
        };

        if (reducedMotion) {
            textOpacity.value = 1;
            textTranslateY.value = 0;
            lineScaleX.value = 1;
            dotScale.value = 1;
            containerOpacity.value = 1;
            const reducedTimer = setTimeout(complete, 120);
            return () => clearTimeout(reducedTimer);
        }

        // 1. Sleek text reveal (fade up)
        textOpacity.value = withDelay(100, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        textTranslateY.value = withDelay(100, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));

        // 2. Barbell / Line expansion
        lineScaleX.value = withDelay(400, withSpring(1, { damping: 14, stiffness: 90 }));

        // 3. Accent dot pop (neon green)
        dotScale.value = withDelay(500, withSpring(1, { damping: 10, stiffness: 150 }));

        // 4. Exit sequence (agile, fast startup)
        const exitTimer = setTimeout(() => {
            textOpacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) });
            textTranslateY.value = withTiming(-15, { duration: 300, easing: Easing.in(Easing.ease) });
            lineScaleX.value = withTiming(0, { duration: 250 });
            dotScale.value = withTiming(0, { duration: 200 });

            containerOpacity.value = withDelay(150, withTiming(0, { duration: 400 }, (finished) => {
                if (finished) {
                    runOnJS(complete)();
                }
            }));

            // Guaranteed timer fallback (critical for Web & SSR)
            setTimeout(complete, 600);
        }, 800);

        // Ultimate safety timeout for Web
        const safetyTimer = setTimeout(complete, 1600);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(safetyTimer);
        };
    }, [containerOpacity, dotScale, lineScaleX, onFinish, reducedMotion, textOpacity, textTranslateY]);

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }]
    }));

    const lineStyle = useAnimatedStyle(() => ({
        transform: [{ scaleX: lineScaleX.value }]
    }));

    const dotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale.value }]
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value
    }));

    const themeBg = isDark ? '#000000' : '#FFFFFF';
    const primaryColor = '#4F8FF7'; // Electric Blue
    const accentColor = '#22C55E'; // Neon Green

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: themeBg },
                containerStyle
            ]}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={styles.contentContainer}>
                {/* Text Reveal */}
                <Animated.View style={[styles.textWrapper, textStyle]}>
                    <Text style={[styles.brandText, { color: isDark ? Palette.light.onImage : '#000000' }]}>
                        STRIVE
                    </Text>
                    {/* Pop Dot */}
                    <Animated.View style={[styles.dot, { backgroundColor: accentColor }, dotStyle]} />
                </Animated.View>

                {/* Animated Line */}
                <Animated.View style={[styles.lineWrapper, textStyle]}>
                    <Animated.View style={[styles.line, { backgroundColor: primaryColor }, lineStyle]} />
                </Animated.View>

                <Animated.Text style={[styles.subtitle, { color: isDark ? '#636366' : '#868E96' }, textStyle]}>
                    ATHLETICS
                </Animated.Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrapper: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    brandText: {
        fontSize: 56,
        fontFamily: 'Inter_700Bold', fontWeight: '700',
        fontStyle: 'italic',
        letterSpacing: -2,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: 4,
        marginBottom: 8,
    },
    lineWrapper: {
        width: 140,
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    line: {
        width: '100%',
        height: 3,
        borderRadius: 2,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: 'Inter_700Bold', fontWeight: 'bold',
        letterSpacing: 6,
        paddingLeft: 6, // Optical centering for letter spacing
    }
});
