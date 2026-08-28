import React, { useEffect, useState } from 'react';
import {
    LayoutChangeEvent,
    StyleProp,
    Text,
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
    const effectiveTextWidth = Math.max(measuredTextWidth, estimatedWidth);

    const onContainerLayout = (e: LayoutChangeEvent) => {
        const width = Math.round(e.nativeEvent.layout.width);
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
            setContainerWidth(width);
        }
    };

    const isOverflowing = containerWidth > 0 && effectiveTextWidth > containerWidth + 4;

    useEffect(() => {
        cancelAnimation(translateX);
        translateX.value = 0;

        if (!isOverflowing || !effectiveTextWidth) {
            return;
        }

        const scrollDistance = effectiveTextWidth + loopGap;
        const duration = Math.max(1800, (scrollDistance / speed) * 1000);

        translateX.value = withDelay(
            pauseDuration,
            withRepeat(
                withTiming(-scrollDistance, {
                    duration: duration,
                    easing: Easing.linear,
                }),
                -1,
                false
            )
        );

        return () => {
            cancelAnimation(translateX);
        };
    }, [isOverflowing, effectiveTextWidth, containerWidth, text, speed, pauseDuration, loopGap]);

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
                },
                containerStyle,
            ]}
        >
            {/* Hidden measuring container with wide width so text is never truncated during measurement */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: 0,
                    width: 3000,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
                pointerEvents="none"
            >
                <Text
                    numberOfLines={1}
                    onLayout={(e) => {
                        const width = Math.ceil(e.nativeEvent.layout.width);
                        if (width > 0 && Math.abs(width - measuredTextWidth) > 1) {
                            setMeasuredTextWidth(width);
                        }
                    }}
                    style={[style, { flexShrink: 0 }]}
                >
                    {text}
                </Text>
            </View>

            {/* Visible Content with wide horizontal layout so Android never inserts ellipsis */}
            <Animated.View
                style={[
                    {
                        width: 3000,
                        flexDirection: 'row',
                        alignItems: 'center',
                    },
                    animatedStyle,
                ]}
            >
                <Text numberOfLines={1} style={[style, { flexShrink: 0 }]}>
                    {text}
                </Text>

                {isOverflowing && (
                    <>
                        <View style={{ width: loopGap }} />
                        <Text numberOfLines={1} style={[style, { flexShrink: 0 }]}>
                            {text}
                        </Text>
                    </>
                )}
            </Animated.View>
        </View>
    );
}
