import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    GestureResponderEvent,
    Image,
    PanResponder,
    PanResponderGestureState,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import Svg, {
    Defs,
    G,
    LinearGradient,
    Path,
    RadialGradient,
    Stop,
} from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

export interface MuscleColorMap {
    'Peito'?: string;
    'Costas'?: string;
    'Ombros'?: string;
    'Bíceps'?: string;
    'Tríceps'?: string;
    'Abdômen'?: string;
    'Quadríceps'?: string;
    'Isquiotibiais'?: string;
    'Panturrilhas'?: string;
    'Glúteos'?: string;
    'Antebraços'?: string;
    'Trapézio'?: string;
}

export interface MuscleIntensityMap {
    [key: string]: number; // 0 a 100%
}

interface AnatomicalMuscleBodyProps {
    viewSide: 'Front' | 'Back';
    colors: MuscleColorMap;
    intensities?: MuscleIntensityMap;
    mode?: 'load' | 'recovery' | 'carga' | 'recuperacao';
    selectedMuscle?: string | null;
    onSelectMuscle?: (muscleName: string) => void;
    width?: number;
    height?: number;
    onToggleSide?: () => void;
}

export function AnatomicalMuscleBody({
    viewSide,
    colors,
    intensities = {},
    mode = 'load',
    selectedMuscle,
    onSelectMuscle,
    width = 230,
    height = 345,
    onToggleSide,
}: AnatomicalMuscleBodyProps) {
    const { theme } = useTheme();
    const isDark = theme.mode === 'dark';

    // 1. Idle 3D Micro-Motion (Breathing & Floating)
    const idleAnim = useRef(new Animated.Value(0)).current;

    // 2. 3D Rotation Value (Continuous degrees for smooth 360° rotation)
    const rotateYAnim = useRef(new Animated.Value(viewSide === 'Front' ? 0 : 180)).current;
    const currentAngle = useRef(viewSide === 'Front' ? 0 : 180);
    const dragStartAngle = useRef(viewSide === 'Front' ? 0 : 180);

    useEffect(() => {
        const isCurrentlyBack = Math.abs(Math.round(currentAngle.current / 180) % 2) === 1;
        const currentSide = isCurrentlyBack ? 'Back' : 'Front';
        if (viewSide === currentSide) return;

        // Smoothly rotate 180° in the natural direction
        const target = currentAngle.current + (viewSide === 'Back' ? 180 : -180);
        Animated.spring(rotateYAnim, {
            toValue: target,
            useNativeDriver: true,
            friction: 8,
            tension: 32,
        }).start(() => {
            currentAngle.current = target;
        });
    }, [viewSide, rotateYAnim]);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(idleAnim, {
                    toValue: 1,
                    duration: 3200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(idleAnim, {
                    toValue: 0,
                    duration: 3200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [idleAnim]);

    // 3. Touch / Mouse Gesture PanResponder for Complete 360° Dragging
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
                return Math.abs(gestureState.dx) > 6 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: () => {
                dragStartAngle.current = currentAngle.current;
            },
            onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                const deltaAngle = gestureState.dx * 1.05;
                rotateYAnim.setValue(dragStartAngle.current + deltaAngle);
            },
            onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                const finalRaw = dragStartAngle.current + gestureState.dx * 1.05;
                const flickMomentum = gestureState.vx * 65;
                const projected = finalRaw + flickMomentum;
                const nearestSnap = Math.round(projected / 180) * 180;

                Animated.spring(rotateYAnim, {
                    toValue: nearestSnap,
                    velocity: gestureState.vx,
                    useNativeDriver: true,
                    friction: 7,
                    tension: 32,
                }).start(() => {
                    currentAngle.current = nearestSnap;
                    const isBack = Math.abs(Math.round(nearestSnap / 180) % 2) === 1;
                    const targetSide = isBack ? 'Back' : 'Front';
                    if (targetSide !== viewSide) {
                        onToggleSide?.();
                    }
                });
            },
        })
    ).current;

    const rotateYFront = rotateYAnim.interpolate({
        inputRange: [-360, 0, 360],
        outputRange: ['-360deg', '0deg', '360deg'],
        extrapolate: 'extend',
    });

    const rotateYBack = rotateYAnim.interpolate({
        inputRange: [-360, 0, 360],
        outputRange: ['-180deg', '180deg', '540deg'],
        extrapolate: 'extend',
    });

    const translateY = idleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -3],
    });

    const rotateXIdle = idleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '1.2deg'],
    });

    // Helper to get fill for active muscles
    const getMuscleFill = (muscleName: keyof MuscleColorMap, gradientId?: string) => {
        const color = colors[muscleName];
        if (!color) return 'transparent';
        if (gradientId) return `url(#${gradientId})`;
        return color;
    };

    const getMuscleOpacity = (muscleName: keyof MuscleColorMap) => {
        if (selectedMuscle === muscleName) return 0.95;
        if (!colors[muscleName]) return 0;
        const intensity = intensities[muscleName] ?? 70;
        return Math.max(0.55, Math.min(0.92, (intensity / 100) * 0.95));
    };

    const getMuscleStroke = (muscleName: keyof MuscleColorMap) => {
        if (selectedMuscle === muscleName) {
            return isDark ? '#38BDF8' : '#0284C7';
        }
        if (colors[muscleName]) {
            return colors[muscleName];
        }
        return 'transparent';
    };

    const getMuscleStrokeWidth = (muscleName: keyof MuscleColorMap) => {
        if (selectedMuscle === muscleName) return 3.2;
        if (colors[muscleName]) return 1.8;
        return 0;
    };

    // Cross-platform click props avoiding React Web DOM onStartShouldSetResponder warnings
    const getSvgPressProps = (muscleName: string): any => {
        if (Platform.OS === 'web') {
            return {
                onClick: () => onSelectMuscle?.(muscleName),
                style: { cursor: 'pointer' },
            };
        }
        return {
            onPress: () => onSelectMuscle?.(muscleName),
        };
    };

    return (
        <View
            style={[
                {
                    width,
                    height,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                Platform.OS === 'web' && ({
                    cursor: 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                    WebkitUserSelect: 'none',
                } as any),
            ]}
            {...panResponder.panHandlers}
        >
            {/* ════════════════════════════ FRONT 3D VIEW ════════════════════════════ */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backfaceVisibility: 'hidden',
                        transform: [
                            { perspective: 1000 },
                            { translateY },
                            { rotateY: rotateYFront },
                            { rotateX: rotateXIdle },
                        ],
                    },
                ]}
            >
                {/* 1. Realistic 3D Muscle Base Image */}
                <Image
                    source={require('../../assets/anatomy_front_realistic.png')}
                    style={[
                        {
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            opacity: isDark ? 0.96 : 0.88,
                        },
                        Platform.OS === 'web' && ({
                            pointerEvents: 'none',
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        } as any),
                    ]}
                    resizeMode="contain"
                />

                {/* 2. Precision SVG Heatmap Layer - Calibrated 1:1 with 974x1615 3D body */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Svg width="100%" height="100%" viewBox="0 0 974 1615" preserveAspectRatio="xMidYMid meet">
                        <Defs>
                            {colors['Peito'] && (
                                <RadialGradient id="grad-pec-front" cx="50%" cy="50%" rx="60%" ry="50%">
                                    <Stop offset="0%" stopColor={colors['Peito']} stopOpacity="0.95" />
                                    <Stop offset="75%" stopColor={colors['Peito']} stopOpacity="0.75" />
                                    <Stop offset="100%" stopColor={colors['Peito']} stopOpacity="0.35" />
                                </RadialGradient>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.55" />
                                </LinearGradient>
                            )}

                            {colors['Bíceps'] && (
                                <LinearGradient id="grad-biceps-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Bíceps']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Bíceps']} stopOpacity="0.55" />
                                </LinearGradient>
                            )}

                            {colors['Antebraços'] && (
                                <LinearGradient id="grad-forearms-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Antebraços']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Antebraços']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}

                            {colors['Abdômen'] && (
                                <RadialGradient id="grad-abs-front" cx="50%" cy="50%" rx="50%" ry="50%">
                                    <Stop offset="0%" stopColor={colors['Abdômen']} stopOpacity="0.95" />
                                    <Stop offset="80%" stopColor={colors['Abdômen']} stopOpacity="0.75" />
                                    <Stop offset="100%" stopColor={colors['Abdômen']} stopOpacity="0.35" />
                                </RadialGradient>
                            )}

                            {colors['Quadríceps'] && (
                                <LinearGradient id="grad-quads-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Quadríceps']} stopOpacity="0.92" />
                                    <Stop offset="70%" stopColor={colors['Quadríceps']} stopOpacity="0.7" />
                                    <Stop offset="100%" stopColor={colors['Quadríceps']} stopOpacity="0.3" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.92" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Trapézio'] && (
                                <LinearGradient id="grad-traps-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Trapézio']} stopOpacity="0.92" />
                                    <Stop offset="100%" stopColor={colors['Trapézio']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}
                        </Defs>

                        <G>
                            {/* Trapézio Superior (Frontal) */}
                            <G {...getSvgPressProps('Trapézio')}>
                                <Path
                                    d="M 487 210 L 440 235 L 380 260 L 340 290 L 410 280 L 487 270 L 564 280 L 634 290 L 594 260 L 534 235 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-front')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Anteriores e Laterais (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="M 309 280 L 290 310 L 282 340 L 282 370 L 274 400 L 266 415 L 309 415 L 329 360 L 344 310 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="M 665 280 L 684 310 L 692 340 L 692 370 L 700 400 L 708 415 L 665 415 L 645 360 L 630 310 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Peitoral (Peito) */}
                            <G {...getSvgPressProps('Peito')}>
                                <Path
                                    d="M 487 285 L 390 295 L 340 320 L 315 360 L 330 415 L 370 435 L 487 435 Z"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                                <Path
                                    d="M 487 285 L 584 295 L 634 320 L 659 360 L 644 415 L 604 435 L 487 435 Z"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                            </G>

                            {/* Bíceps */}
                            <G {...getSvgPressProps('Bíceps')}>
                                <Path
                                    d="M 260 415 L 235 460 L 210 500 L 185 540 L 170 575 L 245 575 L 270 520 L 290 470 L 285 425 Z"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                                <Path
                                    d="M 708 415 L 720 440 L 732 470 L 754 500 L 778 530 L 792 560 L 800 575 L 720 575 L 710 560 L 692 530 L 680 500 L 662 470 L 645 440 L 665 415 Z"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                            </G>

                            {/* Antebraços */}
                            <G {...getSvgPressProps('Antebraços')}>
                                <Path
                                    d="M 170 575 L 155 600 L 140 625 L 122 650 L 100 675 L 60 700 L 60 725 L 60 750 L 115 750 L 125 725 L 130 700 L 150 675 L 174 650 L 200 625 L 225 600 L 245 575 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-front')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                                <Path
                                    d="M 798 575 L 812 600 L 825 625 L 842 650 L 863 675 L 905 700 L 910 725 L 910 750 L 855 750 L 836 725 L 830 700 L 812 675 L 790 650 L 764 625 L 738 600 L 720 575 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-front')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                            </G>

                            {/* Abdômen & Oblíquos */}
                            <G {...getSvgPressProps('Abdômen')}>
                                <Path
                                    d="M 350 440 L 360 480 L 372 520 L 370 560 L 370 600 L 362 640 L 356 680 L 350 710 L 345 740 L 487 750 L 621 740 L 615 710 L 609 680 L 603 640 L 595 600 L 594 560 L 593 520 L 605 480 L 615 440 L 487 440 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                            </G>

                            {/* Quadríceps */}
                            <G {...getSvgPressProps('Quadríceps')}>
                                <Path
                                    d="M 340 755 L 338 800 L 337 850 L 342 900 L 353 950 L 372 1000 L 377 1050 L 378 1090 L 448 1090 L 454 1050 L 457 1000 L 457 950 L 462 900 L 469 850 L 469 800 L 472 755 Z"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                                <Path
                                    d="M 493 755 L 497 800 L 496 850 L 503 900 L 509 950 L 509 1000 L 512 1050 L 518 1090 L 588 1090 L 589 1050 L 593 1000 L 612 950 L 624 900 L 629 850 L 627 800 L 625 755 Z"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                            </G>

                            {/* Panturrilhas (Frontal) */}
                            <G {...getSvgPressProps('Panturrilhas')}>
                                <Path
                                    d="M 368 1125 L 360 1180 L 360 1230 L 372 1280 L 384 1340 L 392 1400 L 388 1450 L 440 1450 L 438 1400 L 430 1340 L 438 1280 L 448 1230 L 450 1180 L 445 1125 Z"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-front')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                                <Path
                                    d="M 518 1125 L 512 1180 L 514 1230 L 524 1280 L 532 1340 L 524 1400 L 524 1450 L 576 1450 L 572 1400 L 580 1340 L 592 1280 L 604 1230 L 604 1180 L 596 1125 Z"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-front')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                            </G>
                        </G>
                    </Svg>
                </View>
            </Animated.View>

            {/* ════════════════════════════ BACK 3D VIEW ════════════════════════════ */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backfaceVisibility: 'hidden',
                        transform: [
                            { perspective: 1000 },
                            { translateY },
                            { rotateY: rotateYBack },
                            { rotateX: rotateXIdle },
                        ],
                    },
                ]}
            >
                {/* 1. Realistic 3D Muscle Base Image */}
                <Image
                    source={require('../../assets/anatomy_back_realistic.png')}
                    style={[
                        {
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            opacity: isDark ? 0.96 : 0.88,
                        },
                        Platform.OS === 'web' && ({
                            pointerEvents: 'none',
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        } as any),
                    ]}
                    resizeMode="contain"
                />

                {/* 2. Precision SVG Heatmap Layer - Calibrated 1:1 with 953x1650 3D body */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Svg width="100%" height="100%" viewBox="0 0 953 1650" preserveAspectRatio="xMidYMid meet">
                        <Defs>
                            {colors['Trapézio'] && (
                                <LinearGradient id="grad-traps-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Trapézio']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Trapézio']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}

                            {colors['Costas'] && (
                                <LinearGradient id="grad-back-lat" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Costas']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Costas']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.55" />
                                </LinearGradient>
                            )}

                            {colors['Tríceps'] && (
                                <LinearGradient id="grad-triceps-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Tríceps']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Tríceps']} stopOpacity="0.55" />
                                </LinearGradient>
                            )}

                            {colors['Glúteos'] && (
                                <RadialGradient id="grad-glutes-back" cx="50%" cy="50%" rx="60%" ry="60%">
                                    <Stop offset="0%" stopColor={colors['Glúteos']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Glúteos']} stopOpacity="0.45" />
                                </RadialGradient>
                            )}

                            {colors['Isquiotibiais'] && (
                                <LinearGradient id="grad-hamstrings-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Isquiotibiais']} stopOpacity="0.92" />
                                    <Stop offset="100%" stopColor={colors['Isquiotibiais']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.92" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Antebraços'] && (
                                <LinearGradient id="grad-forearms-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Antebraços']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Antebraços']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}
                        </Defs>

                        <G>
                            {/* Trapézio Dorsal Superior & Médio */}
                            <G {...getSvgPressProps('Trapézio')}>
                                <Path
                                    d="M 476 170 L 440 200 L 390 240 L 340 275 L 380 290 L 420 310 L 476 375 L 532 310 L 572 290 L 612 275 L 562 240 L 512 200 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-back')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Posteriores (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="M 335 278 L 275 305 L 245 345 L 255 400 L 285 415 L 315 395 L 335 335 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="M 617 278 L 677 305 L 707 345 L 697 400 L 667 415 L 637 395 L 617 335 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Costas & Grandes Dorsais */}
                            <G {...getSvgPressProps('Costas')}>
                                <Path
                                    d="M 476 375 L 420 340 L 355 400 L 340 420 L 345 470 L 356 530 L 358 590 L 350 645 L 345 680 L 410 690 L 476 695 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                                <Path
                                    d="M 476 375 L 532 340 L 597 400 L 612 420 L 607 470 L 596 530 L 594 590 L 602 645 L 607 680 L 542 690 L 476 695 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                            </G>

                            {/* Tríceps (Braço Posterior) */}
                            <G {...getSvgPressProps('Tríceps')}>
                                <Path
                                    d="M 252 405 L 230 445 L 198 495 L 170 540 L 148 565 L 180 560 L 220 525 L 255 475 L 280 420 Z"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                                <Path
                                    d="M 700 405 L 722 445 L 754 495 L 782 540 L 804 565 L 772 560 L 732 525 L 697 475 L 672 420 Z"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                            </G>

                            {/* Antebraços Dorsais */}
                            <G {...getSvgPressProps('Antebraços')}>
                                <Path
                                    d="M 145 570 L 120 615 L 85 665 L 52 715 L 28 750 L 45 770 L 78 745 L 115 685 L 150 625 L 178 565 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-back')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                                <Path
                                    d="M 807 570 L 832 615 L 867 665 L 900 715 L 924 750 L 907 770 L 874 745 L 837 685 L 802 625 L 774 565 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-back')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                            </G>

                            {/* Glúteos */}
                            <G {...getSvgPressProps('Glúteos')}>
                                <Path
                                    d="M 462 699 L 408 696 L 352 686 L 345 729 L 338 784 L 340 836 L 371 862 L 418 862 L 462 855 Z"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                                <Path
                                    d="M 480 699 L 544 696 L 605 686 L 613 733 L 620 784 L 618 836 L 581 862 L 534 862 L 482 859 Z"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                            </G>

                            {/* Isquiotibiais (Posterior de Coxa) */}
                            <G {...getSvgPressProps('Isquiotibiais')}>
                                <Path
                                    d="M 462 900 L 458 950 L 455 1000 L 454 1050 L 450 1100 L 370 1100 L 364 1050 L 350 1000 L 338 950 L 330 900 Z"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                                <Path
                                    d="M 486 900 L 490 950 L 492 1000 L 493 1050 L 497 1100 L 579 1100 L 583 1050 L 598 1000 L 610 950 L 618 900 Z"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                            </G>

                            {/* Panturrilhas Traseiras */}
                            <G {...getSvgPressProps('Panturrilhas')}>
                                <Path
                                    d="M 372 1130 L 364 1200 L 367 1250 L 378 1300 L 389 1350 L 398 1400 L 400 1445 L 445 1445 L 443 1400 L 445 1350 L 450 1300 L 457 1250 L 455 1200 L 448 1130 Z"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-back')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                                <Path
                                    d="M 504 1130 L 492 1200 L 490 1250 L 498 1300 L 503 1350 L 507 1400 L 500 1445 L 546 1445 L 548 1400 L 558 1350 L 570 1300 L 581 1250 L 584 1200 L 579 1130 Z"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-back')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                            </G>
                        </G>
                    </Svg>
                </View>
            </Animated.View>
        </View>
    );
}
