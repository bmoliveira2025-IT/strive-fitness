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
import { useReducedMotion } from '../../hooks/useReducedMotion';

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
    viewSide?: 'Front' | 'Back';
    colors: MuscleColorMap;
    intensities?: MuscleIntensityMap;
    mode?: 'load' | 'recovery' | 'carga' | 'recuperacao';
    selectedMuscle?: string | null;
    onSelectMuscle?: (muscleName: string) => void;
    width?: number;
    height?: number;
    onToggleSide?: () => void;
    resetTrigger?: number;
}

export function AnatomicalMuscleBody({
    viewSide = 'Front',
    colors,
    intensities = {},
    mode = 'load',
    selectedMuscle,
    onSelectMuscle,
    width = 230,
    height = 345,
    onToggleSide,
    resetTrigger,
}: AnatomicalMuscleBodyProps) {
    const { theme } = useTheme();
    const reducedMotion = useReducedMotion();
    const isDark = theme.mode === 'dark';

    // 1. Idle 3D Micro-Motion (Breathing & Subtle Float)
    const idleAnim = useRef(new Animated.Value(0)).current;

    // 2. Active Side ('Front' or 'Back') & Volumetric Continuous 360 System
    const [currentSide, setCurrentSide] = useState<'Front' | 'Back'>(viewSide);
    const continuousAngle = useRef(new Animated.Value(viewSide === 'Front' ? 0 : 180)).current;
    const currentAngle = useRef(viewSide === 'Front' ? 0 : 180);
    const pitchAnim = useRef(new Animated.Value(0)).current; // -22° to +22° (Pitch)
    const currentPitch = useRef(0);
    const dragStartAngle = useRef(0);
    const dragStartPitch = useRef(0);

    // Keep currentAngle and currentPitch updated via listeners
    useEffect(() => {
        const id = continuousAngle.addListener(({ value }) => {
            currentAngle.current = value;
            const norm = ((value % 360) + 360) % 360;
            const isBack = norm >= 90 && norm < 270;
            const side = isBack ? 'Back' : 'Front';
            setCurrentSide((prev) => (prev !== side ? side : prev));
        });
        const pid = pitchAnim.addListener(({ value }) => {
            currentPitch.current = value;
        });
        return () => {
            continuousAngle.removeListener(id);
            pitchAnim.removeListener(pid);
        };
    }, []);

    // Idle breathing animation
    useEffect(() => {
        if (reducedMotion) {
            idleAnim.setValue(0);
            return;
        }
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
    }, [idleAnim, reducedMotion]);

    // Flip action
    const triggerFlip = (targetSide?: 'Front' | 'Back') => {
        const raw = currentAngle.current;
        const norm = ((raw % 360) + 360) % 360;
        const isBack = norm >= 90 && norm < 270;
        const nextSide = targetSide || (isBack ? 'Front' : 'Back');
        const targetNormalized = nextSide === 'Back' ? 180 : 0;

        const base = Math.floor(raw / 360) * 360;
        let snap = base + targetNormalized;
        if (Math.abs(snap - raw) > 180) {
            snap += snap > raw ? -360 : 360;
        }

        Animated.parallel([
            Animated.spring(continuousAngle, {
                toValue: snap,
                friction: 8,
                tension: 38,
                useNativeDriver: true,
            }),
            Animated.spring(pitchAnim, {
                toValue: 0,
                friction: 8,
                tension: 34,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Synchronize if parent viewSide changes
    useEffect(() => {
        if (viewSide !== currentSide) {
            triggerFlip(viewSide);
        }
    }, [viewSide]);

    // Reset view trigger (returns to Front and zeroes out tilt)
    useEffect(() => {
        if (resetTrigger === undefined || resetTrigger === 0) return;
        Animated.parallel([
            Animated.spring(continuousAngle, {
                toValue: 0,
                friction: 8,
                tension: 38,
                useNativeDriver: true,
            }),
            Animated.spring(pitchAnim, {
                toValue: 0,
                friction: 8,
                tension: 34,
                useNativeDriver: true,
            }),
        ]).start();
    }, [resetTrigger]);

    // 3. Touch/Drag PanResponder - Continuous 360° Drag + Vertical Pitch Tilt
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
                return Math.hypot(gestureState.dx, gestureState.dy) > 4;
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: () => {
                dragStartAngle.current = currentAngle.current;
                dragStartPitch.current = currentPitch.current;
            },
            onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                // Continuous 360° horizontal drag
                const nextAngle = dragStartAngle.current + gestureState.dx * 0.45;
                continuousAngle.setValue(nextAngle);

                // Vertical pitch tilt (-22° to +22°)
                const nextPitch = Math.max(-22, Math.min(22, dragStartPitch.current - gestureState.dy * 0.3));
                pitchAnim.setValue(nextPitch);
            },
            onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                const raw = currentAngle.current;
                const norm = ((raw % 360) + 360) % 360;

                // Snap to Front (0) or Back (180) based on drag direction or closeness
                let targetNorm = 0;
                if (gestureState.vx > 0.45) {
                    targetNorm = norm > 90 && norm < 270 ? 0 : 180;
                } else if (gestureState.vx < -0.45) {
                    targetNorm = norm > 90 && norm < 270 ? 0 : 180;
                } else {
                    targetNorm = (norm >= 45 && norm < 225) ? 180 : 0;
                }

                const base = Math.floor(raw / 360) * 360;
                let snap = base + targetNorm;
                if (Math.abs(snap - raw) > 180) {
                    snap += snap > raw ? -360 : 360;
                }

                Animated.parallel([
                    Animated.spring(continuousAngle, {
                        toValue: snap,
                        friction: 8,
                        tension: 36,
                        useNativeDriver: true,
                    }),
                    Animated.spring(pitchAnim, {
                        toValue: 0,
                        friction: 8,
                        tension: 32,
                        useNativeDriver: true,
                    }),
                ]).start();
            },
        })
    ).current;

    // Volumetric Continuous 360° Transform Interpolations
    // Normalized angle [0, 360)
    const normAngle = Animated.modulo(
        Animated.add(Animated.modulo(continuousAngle, 360), 360),
        360
    );

    // Front is visible when facing camera (-90° to +90°, i.e. [270° to 360°] and [0° to 90°])
    const opacityFront = normAngle.interpolate({
        inputRange: [0, 75, 90, 270, 285, 360],
        outputRange: [1, 1, 0, 0, 1, 1],
        extrapolate: 'clamp',
    });

    // Back is visible when facing camera (90° to 270°)
    const opacityBack = normAngle.interpolate({
        inputRange: [0, 89, 90, 180, 270, 271, 360],
        outputRange: [0, 0, 1, 1, 1, 0, 0],
        extrapolate: 'clamp',
    });

    // Volumetric 3D tilt: max ±24° so the body NEVER flattens into a thin stick
    const rotateYFront = normAngle.interpolate({
        inputRange: [0, 90, 180, 270, 360],
        outputRange: ['0deg', '24deg', '0deg', '-24deg', '0deg'],
        extrapolate: 'clamp',
    });

    const rotateYBack = normAngle.interpolate({
        inputRange: [0, 90, 180, 270, 360],
        outputRange: ['0deg', '-24deg', '0deg', '24deg', '0deg'],
        extrapolate: 'clamp',
    });

    const rotateXDegrees = pitchAnim.interpolate({
        inputRange: [-30, 0, 30],
        outputRange: ['-24deg', '0deg', '24deg'],
        extrapolate: 'clamp',
    });

    const translateY = idleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -2.5],
    });

    // Helper to get fill for active muscles
    const getMuscleFill = (muscleName: keyof MuscleColorMap, gradientId?: string) => {
        const color = colors[muscleName];
        if (!color) return 'transparent';
        if (gradientId) return `url(#${gradientId})`;
        return color;
    };

    const getMuscleOpacity = (muscleName: keyof MuscleColorMap) => {
        if (selectedMuscle === muscleName) return 0.96;
        if (!colors[muscleName]) return 0;
        const intensity = intensities[muscleName] ?? 70;
        return Math.max(0.65, Math.min(0.95, (intensity / 100) * 0.95));
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
                pointerEvents={currentSide === 'Front' ? 'auto' : 'none'}
                style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: opacityFront,
                        backfaceVisibility: 'hidden',
                        transform: [
                            { perspective: 1000 },
                            { translateY },
                            { rotateY: rotateYFront },
                            { rotateX: rotateXDegrees },
                        ],
                    },
                ]}
            >
                {/* 1. Realistic 3D Muscle Base Image */}
                <Image
                    source={require('../../assets/anatomy_front_optimized.png')}
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
                                    <Stop offset="0%" stopColor={colors['Peito']} stopOpacity="0.96" />
                                    <Stop offset="80%" stopColor={colors['Peito']} stopOpacity="0.88" />
                                    <Stop offset="100%" stopColor={colors['Peito']} stopOpacity="0.75" />
                                </RadialGradient>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.96" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.78" />
                                </LinearGradient>
                            )}

                            {colors['Bíceps'] && (
                                <LinearGradient id="grad-biceps-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Bíceps']} stopOpacity="0.96" />
                                    <Stop offset="100%" stopColor={colors['Bíceps']} stopOpacity="0.78" />
                                </LinearGradient>
                            )}

                            {colors['Antebraços'] && (
                                <LinearGradient id="grad-forearms-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Antebraços']} stopOpacity="0.96" />
                                    <Stop offset="100%" stopColor={colors['Antebraços']} stopOpacity="0.75" />
                                </LinearGradient>
                            )}

                            {colors['Abdômen'] && (
                                <RadialGradient id="grad-abs-front" cx="50%" cy="50%" rx="50%" ry="50%">
                                    <Stop offset="0%" stopColor={colors['Abdômen']} stopOpacity="0.96" />
                                    <Stop offset="80%" stopColor={colors['Abdômen']} stopOpacity="0.88" />
                                    <Stop offset="100%" stopColor={colors['Abdômen']} stopOpacity="0.75" />
                                </RadialGradient>
                            )}

                            {colors['Quadríceps'] && (
                                <LinearGradient id="grad-quads-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Quadríceps']} stopOpacity="0.96" />
                                    <Stop offset="80%" stopColor={colors['Quadríceps']} stopOpacity="0.88" />
                                    <Stop offset="100%" stopColor={colors['Quadríceps']} stopOpacity="0.78" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.75" />
                                </LinearGradient>
                            )}

                            {colors['Trapézio'] && (
                                <LinearGradient id="grad-traps-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Trapézio']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Trapézio']} stopOpacity="0.75" />
                                </LinearGradient>
                            )}
                        </Defs>

                        <G>
                            {/* Trapézio Superior (Frontal) */}
                            <G {...getSvgPressProps('Trapézio')}>
                                <Path
                                    d="M 487 210 L 445 225 L 415 240 L 375 250 L 340 252 L 360 260 L 410 268 L 482 278 L 492 278 L 564 268 L 614 260 L 634 252 L 599 250 L 559 240 L 529 225 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-front')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Anteriores e Laterais (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="M 340 252 L 315 255 L 288 275 L 270 305 L 263 340 L 262 370 L 264 395 L 275 415 L 295 425 L 312 420 L 325 395 L 335 360 L 340 315 L 345 285 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="M 634 252 L 659 255 L 686 275 L 704 305 L 711 340 L 712 370 L 710 395 L 699 415 L 679 425 L 662 420 L 649 395 L 639 360 L 634 315 L 629 285 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Peitoral (Peito) */}
                            <G {...getSvgPressProps('Peito')}>
                                <Path
                                    d="M 482 278 L 460 274 L 430 260 L 390 258 L 360 262 L 340 285 L 335 315 L 342 350 L 358 380 L 378 395 L 405 405 L 435 405 L 460 398 L 475 390 L 482 385 Z"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                                <Path
                                    d="M 492 278 L 514 274 L 544 260 L 584 258 L 614 262 L 634 285 L 639 315 L 632 350 L 616 380 L 596 395 L 569 405 L 539 405 L 514 398 L 499 390 L 492 385 Z"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                            </G>

                            {/* Bíceps */}
                            <G {...getSvgPressProps('Bíceps')}>
                                <Path
                                    d="M 285 415 L 265 445 L 248 480 L 235 515 L 225 550 L 245 565 L 275 540 L 295 495 L 312 450 L 318 420 Z"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                                <Path
                                    d="M 689 415 L 709 445 L 726 480 L 739 515 L 749 550 L 729 565 L 699 540 L 679 495 L 662 450 L 656 420 Z"
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

                            {/* Abdômen & Cintura / Oblíquos */}
                            <G {...getSvgPressProps('Abdômen')}>
                                <Path
                                    d="M 482 385 L 460 398 L 435 405 L 405 405 L 378 395 L 358 380 L 336 435 L 344 460 L 354 485 L 361 510 L 365 535 L 362 560 L 360 585 L 361 610 L 355 635 L 351 660 L 347 685 L 341 710 L 415 710 L 476 745 L 487 755 L 498 745 L 559 710 L 633 710 L 627 685 L 623 660 L 619 635 L 613 610 L 614 585 L 612 560 L 609 535 L 613 510 L 620 485 L 630 460 L 638 435 L 616 380 L 596 395 L 569 405 L 539 405 L 514 398 L 492 385 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                            </G>

                            {/* Quadríceps (Coxas Completas - Do Quadril à Patela com Curva do Joelho) */}
                            <G {...getSvgPressProps('Quadríceps')}>
                                <Path
                                    d="M 349 680 L 337 740 L 330 800 L 329 830 L 334 900 L 345 950 L 365 1000 L 369 1050 L 372 1070 L 385 1085 L 412 1075 L 440 1085 L 455 1070 L 459 1000 L 460 950 L 465 900 L 470 840 L 474 780 L 476 745 L 415 710 Z"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                                <Path
                                    d="M 616 680 L 629 740 L 635 800 L 637 830 L 632 900 L 620 950 L 601 1000 L 597 1050 L 594 1070 L 581 1085 L 554 1075 L 526 1085 L 511 1070 L 507 1000 L 506 950 L 501 900 L 496 840 L 492 780 L 490 745 L 551 710 Z"
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
                pointerEvents={currentSide === 'Back' ? 'auto' : 'none'}
                style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: opacityBack,
                        backfaceVisibility: 'hidden',
                        transform: [
                            { perspective: 1000 },
                            { translateY },
                            { rotateY: rotateYBack },
                            { rotateX: rotateXDegrees },
                        ],
                    },
                ]}
            >
                {/* 1. Realistic 3D Muscle Base Image */}
                <Image
                    source={require('../../assets/anatomy_back_optimized.png')}
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
                                    <Stop offset="0%" stopColor={colors['Trapézio']} stopOpacity="0.96" />
                                    <Stop offset="100%" stopColor={colors['Trapézio']} stopOpacity="0.75" />
                                </LinearGradient>
                            )}

                            {colors['Costas'] && (
                                <LinearGradient id="grad-back-lat" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Costas']} stopOpacity="0.96" />
                                    <Stop offset="80%" stopColor={colors['Costas']} stopOpacity="0.88" />
                                    <Stop offset="100%" stopColor={colors['Costas']} stopOpacity="0.75" />
                                </LinearGradient>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.96" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.78" />
                                </LinearGradient>
                            )}

                            {colors['Tríceps'] && (
                                <LinearGradient id="grad-triceps-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Tríceps']} stopOpacity="0.96" />
                                    <Stop offset="100%" stopColor={colors['Tríceps']} stopOpacity="0.78" />
                                </LinearGradient>
                            )}

                            {colors['Glúteos'] && (
                                <RadialGradient id="grad-glutes-back" cx="50%" cy="50%" rx="60%" ry="60%">
                                    <Stop offset="0%" stopColor={colors['Glúteos']} stopOpacity="0.96" />
                                    <Stop offset="85%" stopColor={colors['Glúteos']} stopOpacity="0.88" />
                                    <Stop offset="100%" stopColor={colors['Glúteos']} stopOpacity="0.75" />
                                </RadialGradient>
                            )}

                            {colors['Isquiotibiais'] && (
                                <LinearGradient id="grad-hamstrings-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Isquiotibiais']} stopOpacity="0.96" />
                                    <Stop offset="85%" stopColor={colors['Isquiotibiais']} stopOpacity="0.88" />
                                    <Stop offset="100%" stopColor={colors['Isquiotibiais']} stopOpacity="0.75" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.75" />
                                </LinearGradient>
                            )}

                            {colors['Antebraços'] && (
                                <LinearGradient id="grad-forearms-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Antebraços']} stopOpacity="0.96" />
                                    <Stop offset="100%" stopColor={colors['Antebraços']} stopOpacity="0.75" />
                                </LinearGradient>
                            )}
                        </Defs>

                        <G>
                            {/* Trapézio Dorsal Superior & Médio */}
                            <G {...getSvgPressProps('Trapézio')}>
                                <Path
                                    d="M 476 190 L 440 220 L 395 240 L 340 252 L 370 290 L 410 360 L 440 440 L 476 520 L 512 440 L 542 360 L 583 290 L 613 252 L 558 240 L 512 220 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-back')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Posteriores (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="M 340 252 L 310 255 L 285 270 L 260 295 L 245 330 L 238 365 L 240 395 L 260 415 L 285 415 L 310 395 L 325 350 L 335 300 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="M 613 252 L 643 255 L 668 270 L 693 295 L 708 330 L 715 365 L 713 395 L 693 415 L 668 415 L 643 395 L 628 350 L 618 300 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Costas & Grandes Dorsais (Todas as Costas, Cintura Traseira e Crista Ilíaca) */}
                            <G {...getSvgPressProps('Costas')}>
                                <Path
                                    d="M 476 520 L 440 440 L 410 360 L 370 290 L 340 300 L 330 350 L 318 395 L 320 415 L 323 440 L 331 465 L 342 490 L 351 515 L 355 540 L 354 565 L 348 590 L 348 615 L 344 640 L 338 665 L 333 680 L 350 672 L 390 680 L 440 695 L 476 705 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                                <Path
                                    d="M 476 520 L 512 440 L 542 360 L 583 290 L 613 300 L 623 350 L 635 395 L 633 415 L 630 440 L 622 465 L 611 490 L 602 515 L 598 540 L 599 565 L 605 590 L 605 615 L 609 640 L 615 665 L 620 680 L 603 672 L 563 680 L 513 695 L 476 705 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                            </G>

                            {/* Tríceps (Braço Posterior) */}
                            <G {...getSvgPressProps('Tríceps')}>
                                <Path
                                    d="M 285 415 L 250 445 L 215 495 L 185 540 L 160 565 L 195 560 L 230 525 L 265 475 L 288 420 Z"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                                <Path
                                    d="M 668 415 L 703 445 L 738 495 L 768 540 L 793 565 L 758 560 L 723 525 L 688 475 L 665 420 Z"
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

                            {/* Glúteos (Glúteo Máximo, Glúteo Médio no Quadril e Contorno Subglúteo) */}
                            <G {...getSvgPressProps('Glúteos')}>
                                <Path
                                    d="M 472 708 L 440 695 L 390 680 L 350 672 L 330 685 L 320 715 L 314 750 L 312 780 L 315 810 L 318 840 L 335 850 L 360 845 L 390 835 L 420 830 L 450 820 L 470 808 Z"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                                <Path
                                    d="M 480 708 L 513 695 L 563 680 L 603 672 L 623 685 L 633 715 L 639 750 L 641 780 L 638 810 L 635 840 L 618 850 L 593 845 L 563 835 L 533 830 L 503 820 L 483 808 Z"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                            </G>

                            {/* Isquiotibiais (Posterior de Coxa Completo - Da Prega Glútea ao Joelho com Largura Lateral Total) */}
                            <G {...getSvgPressProps('Isquiotibiais')}>
                                <Path
                                    d="M 470 812 L 450 822 L 420 832 L 390 837 L 360 847 L 335 852 L 318 845 L 317 860 L 318 880 L 320 900 L 323 925 L 328 955 L 335 985 L 343 1015 L 352 1045 L 357 1070 L 361 1095 L 364 1115 L 375 1125 L 405 1095 L 440 1120 L 454 1105 L 459 1070 L 462 1030 L 464 990 L 466 950 L 469 910 L 471 870 L 472 835 Z"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                                <Path
                                    d="M 483 812 L 503 822 L 533 832 L 563 837 L 593 847 L 618 852 L 635 845 L 636 860 L 635 880 L 633 900 L 630 925 L 625 955 L 618 985 L 610 1015 L 601 1045 L 596 1070 L 592 1095 L 589 1115 L 578 1125 L 548 1095 L 513 1120 L 499 1105 L 494 1070 L 491 1030 L 489 990 L 487 950 L 484 910 L 482 870 L 481 835 Z"
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
