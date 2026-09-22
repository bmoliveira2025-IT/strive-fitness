const fs = require('fs');

const paths = JSON.parse(fs.readFileSync('scratch/final_calibrated_paths.json'));

const code = `import React, { useEffect, useRef } from 'react';
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
        if (gradientId) return \`url(#\${gradientId})\`;
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
                                    d="${paths.front.Trapezio}"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-front')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Anteriores e Laterais (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="${paths.front.Ombro_Left}"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="${paths.front.Ombro_Right}"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Peitoral (Peito) */}
                            <G {...getSvgPressProps('Peito')}>
                                <Path
                                    d="${paths.front.Peito_Left}"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                                <Path
                                    d="${paths.front.Peito_Right}"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                            </G>

                            {/* Bíceps */}
                            <G {...getSvgPressProps('Bíceps')}>
                                <Path
                                    d="${paths.front.Bicep_Left}"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                                <Path
                                    d="${paths.front.Bicep_Right}"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                            </G>

                            {/* Antebraços */}
                            <G {...getSvgPressProps('Antebraços')}>
                                <Path
                                    d="${paths.front.Antebraco_Left}"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-front')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                                <Path
                                    d="${paths.front.Antebraco_Right}"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-front')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                            </G>

                            {/* Abdômen & Oblíquos */}
                            <G {...getSvgPressProps('Abdômen')}>
                                <Path
                                    d="${paths.front.Abdomen}"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                            </G>

                            {/* Quadríceps */}
                            <G {...getSvgPressProps('Quadríceps')}>
                                <Path
                                    d="${paths.front.Quad_Left}"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                                <Path
                                    d="${paths.front.Quad_Right}"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                            </G>

                            {/* Panturrilhas (Frontal) */}
                            <G {...getSvgPressProps('Panturrilhas')}>
                                <Path
                                    d="${paths.front.Panturrilha_Left}"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-front')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                                <Path
                                    d="${paths.front.Panturrilha_Right}"
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
                                    d="${paths.back.Trapezio}"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-back')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Posteriores (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="${paths.back.Ombro_Left}"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="${paths.back.Ombro_Right}"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Costas & Grandes Dorsais */}
                            <G {...getSvgPressProps('Costas')}>
                                <Path
                                    d="${paths.back.Costas_Left}"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                                <Path
                                    d="${paths.back.Costas_Right}"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                            </G>

                            {/* Tríceps (Braço Posterior) */}
                            <G {...getSvgPressProps('Tríceps')}>
                                <Path
                                    d="${paths.back.Triceps_Left}"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                                <Path
                                    d="${paths.back.Triceps_Right}"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                            </G>

                            {/* Antebraços Dorsais */}
                            <G {...getSvgPressProps('Antebraços')}>
                                <Path
                                    d="${paths.back.Antebraco_Left}"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-back')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                                <Path
                                    d="${paths.back.Antebraco_Right}"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-back')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                            </G>

                            {/* Glúteos */}
                            <G {...getSvgPressProps('Glúteos')}>
                                <Path
                                    d="${paths.back.Gluteo_Left}"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                                <Path
                                    d="${paths.back.Gluteo_Right}"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                            </G>

                            {/* Isquiotibiais (Posterior de Coxa) */}
                            <G {...getSvgPressProps('Isquiotibiais')}>
                                <Path
                                    d="${paths.back.Isquiotibial_Left}"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                                <Path
                                    d="${paths.back.Isquiotibial_Right}"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                            </G>

                            {/* Panturrilhas Traseiras */}
                            <G {...getSvgPressProps('Panturrilhas')}>
                                <Path
                                    d="${paths.back.Panturrilha_Left}"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-back')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                                <Path
                                    d="${paths.back.Panturrilha_Right}"
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
`;

fs.writeFileSync('components/dashboard/AnatomicalMuscleBody.tsx', code, 'utf8');
console.log('Successfully wrote updated components/dashboard/AnatomicalMuscleBody.tsx');
