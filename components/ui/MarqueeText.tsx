import React, { useEffect, useState } from 'react';
import {
    LayoutChangeEvent,
    NativeSyntheticEvent,
    StyleProp,
    Text,
    TextLayoutEventData,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface MarqueeTextProps {
    text: string;
    style?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    speed?: number; // pixels per second
    pauseDuration?: number; // ms to pause at start
    loopGap?: number; // gap between repeated text in px
    isPlaying?: boolean;
}

export function MarqueeText({
    text = '',
    style,
    containerStyle,
    speed = 36,
    pauseDuration = 1000,
    loopGap = 40,
}: MarqueeTextProps) {
    const [containerWidth, setContainerWidth] = useState(0);
    const [measuredTextWidth, setMeasuredTextWidth] = useState(0);
    const translateX = useSharedValue(0);

    // Extract fontSize from style if available for instant heuristic calculation
    const flatStyle = (Array.isArray(style) ? Object.assign({}, ...style) : style) || {};
    const fontSize = flatStyle.fontSize || 14;

    // Guaranteed width calculation (heuristic fallback + real measured width)
    const estimatedWidth = Math.ceil((text?.length || 0) * (fontSize * 0.64));
    // Use the heuristic only until Android reports the real rendered width.
    const effectiveTextWidth = measuredTextWidth > 0 ? measuredTextWidth : estimatedWidth;

    const onContainerLayout = (e: LayoutChangeEvent) => {
        const width = Math.round(e.nativeEvent.layout.width);
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
            setContainerWidth(width);
        }
    };

    const onMeasureText = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
        // `onLayout` on the visible Text reports the width after Yoga has
        // constrained it to the player. `onTextLayout`, measured in a very
        // wide invisible line, reports the actual glyph width on Android.
        const width = Math.ceil(e.nativeEvent.lines?.[0]?.width || 0);
        if (width > 0 && Math.abs(width - measuredTextWidth) > 1) {
            setMeasuredTextWidth(width);
        }
    };

    const isOverflowing = containerWidth > 0 && effectiveTextWidth > containerWidth + 4;

    useEffect(() => {
        cancelAnimation(translateX);
        translateX.value = 0;

        if (!isOverflowing || !effectiveTextWidth) {
            return;
        }

        // Move only the exact overflowing portion. The previous continuous-loop
        // implementation depended on an estimated duplicated-text width and
        // could reset before the final glyph was visible on Android.
        const scrollDistance = Math.max(0, effectiveTextWidth - containerWidth + 2);
        const duration = Math.max(1400, (scrollDistance / speed) * 1000);

        translateX.value = withRepeat(
            withSequence(
                withDelay(
                    pauseDuration,
                    withTiming(-scrollDistance, {
                        duration,
                        easing: Easing.linear,
                    })
                ),
                withDelay(
                    pauseDuration,
                    withTiming(0, {
                        duration: Math.max(500, duration * 0.55),
                        easing: Easing.inOut(Easing.quad),
                    })
                )
            ),
            -1,
            false
        );

        return () => {
            cancelAnimation(translateX);
        };
    }, [isOverflowing, effectiveTextWidth, containerWidth, text, speed, pauseDuration]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View
            onLayout={onContainerLayout}
            style={[
                {
                    overflow: 'hidden',
                    justifyContent: 'center',
                    minWidth: 0,
                    maxWidth: '100%',
                },
                containerStyle,
            ]}
        >
            {/* Measure outside the player's width constraint. Without this,
                Android reports only the already-clipped title width. */}
            <Text
                numberOfLines={1}
                onTextLayout={onMeasureText}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[
                    style,
                    {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 10000,
                        opacity: 0,
                    },
                ]}
            >
                {text}
            </Text>

            {/* A single real-width title avoids seams and premature loop resets. */}
            <Animated.View
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        width: effectiveTextWidth + 4,
                    },
                    animatedStyle,
                ]}
            >
                <Text
                    numberOfLines={1}
                    style={[style, { width: effectiveTextWidth + 4, flexShrink: 0, paddingRight: 4 }]}
                >
                    {text}
                </Text>
            </Animated.View>
        </View>
    );
}
