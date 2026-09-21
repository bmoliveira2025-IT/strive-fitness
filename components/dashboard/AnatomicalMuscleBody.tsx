import React, { useEffect, useRef, useState } from 'react';
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
    height = 340,
    onToggleSide,
}: AnatomicalMuscleBodyProps) {
    const { theme } = useTheme();
    const isDark = theme.mode === 'dark';

    // 1. Idle 3D Micro-Motion (Breathing & Floating)
    const idleAnim = useRef(new Animated.Value(0)).current;

    // 2. 3D Rotation Value (0 = Front, 180 = Back)
    const rotateYAnim = useRef(new Animated.Value(viewSide === 'Front' ? 0 : 180)).current;
    const currentAngle = useRef(viewSide === 'Front' ? 0 : 180);
    const dragStartAngle = useRef(viewSide === 'Front' ? 0 : 180);

    useEffect(() => {
        const target = viewSide === 'Front' ? 0 : 180;
        Animated.spring(rotateYAnim, {
            toValue: target,
            useNativeDriver: true,
            friction: 9,
            tension: 30,
        }).start();
        currentAngle.current = target;
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

    // 3. Touch / Mouse Gesture PanResponder for 360° Dragging
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
                return Math.abs(gestureState.dx) > 4;
            },
            onPanResponderGrant: () => {
                dragStartAngle.current = currentAngle.current;
            },
            onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                const deltaAngle = gestureState.dx * 0.72;
                rotateYAnim.setValue(dragStartAngle.current + deltaAngle);
            },
            onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                const finalRaw = dragStartAngle.current + gestureState.dx * 0.72;
                const normalized = ((finalRaw % 360) + 360) % 360;
                let target = 0;
                if (normalized >= 45 && normalized < 135) {
                    target = gestureState.vx > 0.2 ? 180 : 0;
                } else if (normalized >= 135 && normalized < 225) {
                    target = 180;
                } else if (normalized >= 225 && normalized < 315) {
                    target = gestureState.vx < -0.2 ? 180 : 360;
                } else {
                    target = finalRaw > 180 ? 360 : 0;
                }

                Animated.spring(rotateYAnim, {
                    toValue: target,
                    velocity: gestureState.vx * 0.5,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 36,
                }).start(() => {
                    const finalNorm = ((target % 360) + 360) % 360;
                    rotateYAnim.setValue(finalNorm);
                    currentAngle.current = finalNorm;
                });
            },
        })
    ).current;

    const rotateYFront = rotateYAnim.interpolate({
        inputRange: [-360, 0, 360],
        outputRange: ['-360deg', '0deg', '360deg'],
    });

    const rotateYBack = rotateYAnim.interpolate({
        inputRange: [-360, 0, 360],
        outputRange: ['-180deg', '180deg', '540deg'],
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
        return Math.max(0.45, Math.min(0.9, (intensity / 100) * 0.95));
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
        if (selectedMuscle === muscleName) return 2.8;
        if (colors[muscleName]) return 1.4;
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
            style={{ width, height, alignItems: 'center', justifyContent: 'center' }}
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
                    source={require('../../assets/anatomy_front_cropped.png')}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        opacity: isDark ? 0.96 : 0.88,
                    }}
                    resizeMode="contain"
                />

                {/* 2. Precision SVG Heatmap Layer */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Svg width="100%" height="100%" viewBox="256 16 512 960">
                        <Defs>
                            {/* Heatmap Gradients for Worked Muscles */}
                            {colors['Peito'] && (
                                <RadialGradient id="grad-pec-front" cx="50%" cy="40%" rx="60%" ry="50%">
                                    <Stop offset="0%" stopColor={colors['Peito']} stopOpacity="0.95" />
                                    <Stop offset="75%" stopColor={colors['Peito']} stopOpacity="0.65" />
                                    <Stop offset="100%" stopColor={colors['Peito']} stopOpacity="0.25" />
                                </RadialGradient>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Bíceps'] && (
                                <LinearGradient id="grad-biceps-front" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Bíceps']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Bíceps']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Abdômen'] && (
                                <RadialGradient id="grad-abs-front" cx="50%" cy="50%" rx="50%" ry="50%">
                                    <Stop offset="0%" stopColor={colors['Abdômen']} stopOpacity="0.9" />
                                    <Stop offset="80%" stopColor={colors['Abdômen']} stopOpacity="0.6" />
                                    <Stop offset="100%" stopColor={colors['Abdômen']} stopOpacity="0.2" />
                                </RadialGradient>
                            )}

                            {colors['Quadríceps'] && (
                                <LinearGradient id="grad-quads-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Quadríceps']} stopOpacity="0.9" />
                                    <Stop offset="70%" stopColor={colors['Quadríceps']} stopOpacity="0.6" />
                                    <Stop offset="100%" stopColor={colors['Quadríceps']} stopOpacity="0.2" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.35" />
                                </LinearGradient>
                            )}

                            {colors['Trapézio'] && (
                                <LinearGradient id="grad-traps-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Trapézio']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Trapézio']} stopOpacity="0.4" />
                                </LinearGradient>
                            )}

                            {colors['Antebraços'] && (
                                <LinearGradient id="grad-forearms-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Antebraços']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Antebraços']} stopOpacity="0.35" />
                                </LinearGradient>
                            )}
                        </Defs>

                        <G>
                            {/* Trapézio Superior (Frontal) */}
                            <G {...getSvgPressProps('Trapézio')}>
                                <Path
                                    d="M488 178 C468 190 435 215 408 226 L430 236 C460 234 480 215 488 178 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-front')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                                <Path
                                    d="M536 178 C556 190 589 215 616 226 L594 236 C564 234 544 215 536 178 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-front')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Anteriores e Laterais (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="M408 226 C388 235 372 260 368 290 C364 320 376 342 390 355 C396 342 404 316 414 290 C420 270 426 248 430 236 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="M616 226 C636 235 652 260 656 290 C660 320 648 342 634 355 C628 342 620 316 610 290 C604 270 598 248 594 236 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Peitoral (Superior + Maior) */}
                            <G {...getSvgPressProps('Peito')}>
                                <Path
                                    d="M510 244 C482 244 438 238 424 246 C412 254 402 284 406 312 C412 344 446 362 485 362 C504 362 509 350 510 340 Z"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                                <Path
                                    d="M514 244 C542 244 586 238 600 246 C612 254 622 284 618 312 C612 344 578 362 539 362 C520 362 515 350 514 340 Z"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                            </G>

                            {/* Bíceps & Braquial */}
                            <G {...getSvgPressProps('Bíceps')}>
                                <Path
                                    d="M388 340 C374 354 368 376 370 410 C372 438 382 458 392 468 C398 448 402 418 404 390 C406 366 404 350 398 335 Z"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                                <Path
                                    d="M636 340 C650 354 656 376 654 410 C652 438 642 458 632 468 C626 448 622 418 620 390 C618 366 620 350 626 335 Z"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                            </G>

                            {/* Antebraços */}
                            <G {...getSvgPressProps('Antebraços')}>
                                <Path
                                    d="M388 472 C376 492 368 522 364 555 C360 584 364 612 372 630 L388 628 C394 600 402 556 404 520 C406 495 400 480 394 470 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-front')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                                <Path
                                    d="M636 472 C648 492 656 522 660 555 C664 584 660 612 652 630 L636 628 C630 600 622 556 620 520 C618 495 624 480 630 470 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-front')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                            </G>

                            {/* Abdômen (Reto Abdominal 6-Pack) */}
                            <G {...getSvgPressProps('Abdômen')}>
                                <Path
                                    d="M486 372 C496 372 508 374 508 392 C508 406 496 410 482 410 C468 410 464 398 464 388 C464 376 474 372 486 372 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M538 372 C528 372 516 374 516 392 C516 406 528 410 542 410 C556 410 560 398 560 388 C560 376 550 372 538 372 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M484 416 C496 416 508 418 508 438 C508 454 496 458 480 458 C466 458 462 446 462 434 C462 420 472 416 484 416 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M540 416 C528 416 516 418 516 438 C516 454 528 458 544 458 C558 458 562 446 562 434 C562 420 552 416 540 416 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M486 464 C496 464 508 468 508 492 C508 514 494 520 476 518 C466 516 460 500 460 488 C460 470 472 464 486 464 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M538 464 C528 464 516 468 516 492 C516 514 530 520 548 518 C558 516 564 500 564 488 C564 470 552 464 538 464 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                            </G>

                            {/* Quadríceps */}
                            <G {...getSvgPressProps('Quadríceps')}>
                                <Path
                                    d="M446 534 C432 570 422 620 424 670 C426 710 436 740 452 764 C464 766 476 764 484 750 C488 720 486 670 488 620 C490 580 496 550 504 534 Z"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                                <Path
                                    d="M578 534 C592 570 602 620 600 670 C598 710 588 740 572 764 C560 766 548 764 540 750 C536 720 538 670 536 620 C534 580 528 550 520 534 Z"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                            </G>

                            {/* Panturrilhas Frontais */}
                            <G {...getSvgPressProps('Panturrilhas')}>
                                <Path
                                    d="M450 806 C438 825 432 856 438 888 C444 916 454 938 460 954 L474 952 C478 934 480 905 480 878 C480 845 476 820 472 806 Z"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-front')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                                <Path
                                    d="M574 806 C586 825 592 856 586 888 C580 916 570 938 564 954 L550 952 C546 934 544 905 544 878 C544 845 548 820 552 806 Z"
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
                    source={require('../../assets/anatomy_back_cropped.png')}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        opacity: isDark ? 0.96 : 0.88,
                    }}
                    resizeMode="contain"
                />

                {/* 2. Precision SVG Heatmap Layer */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Svg width="100%" height="100%" viewBox="256 16 512 960">
                        <Defs>
                            {colors['Trapézio'] && (
                                <LinearGradient id="grad-traps-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Trapézio']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Trapézio']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Costas'] && (
                                <LinearGradient id="grad-back-lat" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Costas']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Costas']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Tríceps'] && (
                                <LinearGradient id="grad-triceps-back" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Tríceps']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Tríceps']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Glúteos'] && (
                                <RadialGradient id="grad-glutes-back" cx="50%" cy="40%" rx="60%" ry="60%">
                                    <Stop offset="0%" stopColor={colors['Glúteos']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Glúteos']} stopOpacity="0.4" />
                                </RadialGradient>
                            )}

                            {colors['Isquiotibiais'] && (
                                <LinearGradient id="grad-hamstrings-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Isquiotibiais']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Isquiotibiais']} stopOpacity="0.4" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.4" />
                                </LinearGradient>
                            )}

                            {colors['Antebraços'] && (
                                <LinearGradient id="grad-forearms-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Antebraços']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Antebraços']} stopOpacity="0.35" />
                                </LinearGradient>
                            )}
                        </Defs>

                        <G>
                            {/* Trapézio Dorsal Superior & Médio */}
                            <G {...getSvgPressProps('Trapézio')}>
                                <Path
                                    d="M512 182 C488 200 445 224 416 235 C434 246 470 262 512 320 C554 262 590 246 608 235 C579 224 536 200 512 182 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-back')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Posteriores */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="M416 235 C394 244 374 268 370 298 C366 324 374 346 388 358 C396 342 404 316 414 290 C420 270 422 250 424 242 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="M608 235 C630 244 650 268 654 298 C658 324 650 346 636 358 C628 342 620 316 610 290 C604 270 602 250 600 242 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Costas & Grandes Dorsais */}
                            <G {...getSvgPressProps('Costas')}>
                                <Path
                                    d="M510 324 C474 280 434 264 416 280 C406 312 402 360 412 414 C422 452 444 480 476 498 C484 480 496 440 502 400 C508 360 510 335 510 324 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                                <Path
                                    d="M514 324 C550 280 590 264 608 280 C618 312 622 360 612 414 C602 452 580 480 548 498 C540 480 528 440 522 400 C516 360 514 335 514 324 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                            </G>

                            {/* Tríceps */}
                            <G {...getSvgPressProps('Tríceps')}>
                                <Path
                                    d="M386 338 C372 354 366 376 368 410 C370 438 380 458 390 468 C398 448 402 418 404 390 C406 366 402 350 396 335 Z"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                                <Path
                                    d="M638 338 C652 354 658 376 656 410 C654 438 644 458 634 468 C626 448 622 418 620 390 C618 366 622 350 628 335 Z"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                            </G>

                            {/* Antebraços Dorsais */}
                            <G {...getSvgPressProps('Antebraços')}>
                                <Path
                                    d="M388 472 C376 492 368 522 364 555 C360 584 364 612 372 630 L388 628 C394 600 402 556 404 520 C406 495 400 480 394 470 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-back')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                                <Path
                                    d="M636 472 C648 492 656 522 660 555 C664 584 660 612 652 630 L636 628 C630 600 622 556 620 520 C618 495 624 480 630 470 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-back')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                            </G>

                            {/* Glúteos */}
                            <G {...getSvgPressProps('Glúteos')}>
                                <Path
                                    d="M510 522 C476 520 442 534 436 570 C430 608 448 644 480 656 C498 662 508 650 510 636 Z"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                                <Path
                                    d="M514 522 C548 520 582 534 588 570 C594 608 576 644 544 656 C526 662 516 650 514 636 Z"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                            </G>

                            {/* Isquiotibiais (Posterior de Coxa) */}
                            <G {...getSvgPressProps('Isquiotibiais')}>
                                <Path
                                    d="M440 660 C430 690 428 730 436 764 C448 766 462 764 472 754 C478 732 482 696 484 664 C470 664 452 662 440 660 Z"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                                <Path
                                    d="M584 660 C594 690 596 730 588 764 C576 766 562 764 552 754 C546 732 542 696 540 664 C554 664 572 662 584 660 Z"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                            </G>

                            {/* Panturrilhas Traseiras */}
                            <G {...getSvgPressProps('Panturrilhas')}>
                                <Path
                                    d="M438 782 C426 805 422 840 432 878 C442 914 456 942 462 954 L474 952 C478 934 480 895 480 864 C480 830 476 802 466 782 Z"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-back')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                                <Path
                                    d="M586 782 C598 805 602 840 592 878 C582 914 568 942 562 954 L550 952 C546 934 544 895 544 864 C544 830 548 802 558 782 Z"
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
