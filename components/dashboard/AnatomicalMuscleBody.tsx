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
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
                return Math.abs(gestureState.dx) > 3;
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
                // Snap cleanly to nearest 180° face (0, 180, 360, 540, -180, etc.)
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
        return Math.max(0.48, Math.min(0.92, (intensity / 100) * 0.95));
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
        if (selectedMuscle === muscleName) return 2.6;
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
                    source={require('../../assets/anatomy_front_cropped.png')}
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

                {/* 2. Precision SVG Heatmap Layer - Calibrated 1:1 with 512x960 3D body */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Svg width="100%" height="100%" viewBox="0 0 512 960" preserveAspectRatio="xMidYMid meet">
                        <Defs>
                            {colors['Peito'] && (
                                <RadialGradient id="grad-pec-front" cx="50%" cy="50%" rx="60%" ry="50%">
                                    <Stop offset="0%" stopColor={colors['Peito']} stopOpacity="0.95" />
                                    <Stop offset="75%" stopColor={colors['Peito']} stopOpacity="0.75" />
                                    <Stop offset="100%" stopColor={colors['Peito']} stopOpacity="0.3" />
                                </RadialGradient>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}

                            {colors['Bíceps'] && (
                                <LinearGradient id="grad-biceps-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Bíceps']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Bíceps']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}

                            {colors['Antebraços'] && (
                                <LinearGradient id="grad-forearms-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Antebraços']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Antebraços']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Abdômen'] && (
                                <RadialGradient id="grad-abs-front" cx="50%" cy="50%" rx="50%" ry="50%">
                                    <Stop offset="0%" stopColor={colors['Abdômen']} stopOpacity="0.95" />
                                    <Stop offset="80%" stopColor={colors['Abdômen']} stopOpacity="0.7" />
                                    <Stop offset="100%" stopColor={colors['Abdômen']} stopOpacity="0.3" />
                                </RadialGradient>
                            )}

                            {colors['Quadríceps'] && (
                                <LinearGradient id="grad-quads-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Quadríceps']} stopOpacity="0.92" />
                                    <Stop offset="70%" stopColor={colors['Quadríceps']} stopOpacity="0.65" />
                                    <Stop offset="100%" stopColor={colors['Quadríceps']} stopOpacity="0.25" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.92" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.4" />
                                </LinearGradient>
                            )}

                            {colors['Trapézio'] && (
                                <LinearGradient id="grad-traps-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Trapézio']} stopOpacity="0.9" />
                                    <Stop offset="100%" stopColor={colors['Trapézio']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Costas'] && (
                                <LinearGradient id="grad-back-front" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Costas']} stopOpacity="0.92" />
                                    <Stop offset="100%" stopColor={colors['Costas']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}
                        </Defs>

                        <G>
                            {/* Trapézio Superior (Frontal) - Desce do pescoço acompanhando a clavícula até o ombro */}
                            <G {...getSvgPressProps('Trapézio')}>
                                <Path
                                    d="M 244 146 C 236 166 220 188 188 208 L 220 206 C 234 188 240 166 244 146 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-front')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                                <Path
                                    d="M 268 146 C 276 166 292 188 324 208 L 292 206 C 278 188 272 166 268 146 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-front')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Anteriores e Laterais (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="M 188 208 C 166 212 140 222 128 245 C 118 268 124 295 144 314 C 156 305 166 275 172 245 C 176 225 182 214 188 208 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="M 324 208 C 346 212 372 222 384 245 C 394 268 388 295 368 314 C 356 305 346 275 340 245 C 336 225 330 214 324 208 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-front')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Peitoral (Superior + Maior) - Perfeita curvatura e encaixe nos ombros */}
                            <G {...getSvgPressProps('Peito')}>
                                <Path
                                    d="M 254 208 C 228 205 196 212 182 225 C 170 238 168 256 174 272 C 190 284 225 285 254 276 Z"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                                <Path
                                    d="M 258 208 C 284 205 316 212 330 225 C 342 238 344 256 338 272 C 322 284 287 285 258 276 Z"
                                    fill={getMuscleFill('Peito', 'grad-pec-front')}
                                    fillOpacity={getMuscleOpacity('Peito')}
                                    stroke={getMuscleStroke('Peito')}
                                    strokeWidth={getMuscleStrokeWidth('Peito')}
                                />
                            </G>

                            {/* Dorsais / Serrátil (Costas visíveis pela frente no V-Taper) */}
                            <G {...getSvgPressProps('Costas')}>
                                <Path
                                    d="M 174 274 C 164 288 156 312 164 336 C 172 355 180 372 186 385 C 190 375 188 350 184 325 C 180 300 178 285 174 274 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-front')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                                <Path
                                    d="M 338 274 C 348 288 356 312 348 336 C 340 355 332 372 326 385 C 322 375 324 350 328 325 C 332 300 334 285 338 274 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-front')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                            </G>

                            {/* Bíceps & Braquial */}
                            <G {...getSvgPressProps('Bíceps')}>
                                <Path
                                    d="M 144 308 C 130 318 120 338 120 358 C 120 368 128 372 138 370 C 150 358 155 335 155 312 C 155 306 148 308 144 308 Z"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                                <Path
                                    d="M 368 308 C 382 318 392 338 392 358 C 392 368 384 372 374 370 C 362 358 357 335 357 312 C 357 306 364 308 368 308 Z"
                                    fill={getMuscleFill('Bíceps', 'grad-biceps-front')}
                                    fillOpacity={getMuscleOpacity('Bíceps')}
                                    stroke={getMuscleStroke('Bíceps')}
                                    strokeWidth={getMuscleStrokeWidth('Bíceps')}
                                />
                            </G>

                            {/* Antebraços - Acompanhando a inclinação dos braços e ossos até os punhos */}
                            <G {...getSvgPressProps('Antebraços')}>
                                <Path
                                    d="M 124 368 C 110 395 94 428 80 458 C 72 470 72 476 80 476 C 92 476 108 454 126 424 C 136 395 138 376 134 368 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-front')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                                <Path
                                    d="M 388 368 C 402 395 418 428 432 458 C 440 470 440 476 432 476 C 420 476 404 454 386 424 C 376 395 374 376 378 368 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-front')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                            </G>

                            {/* Abdômen (Reto Abdominal 6-Pack + Oblíquos laterais da cintura) */}
                            <G {...getSvgPressProps('Abdômen')}>
                                {/* 6-pack gomos superiores */}
                                <Path
                                    d="M 220 286 C 235 284 250 284 253 284 L 253 324 C 238 325 224 322 218 316 C 216 302 216 292 220 286 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M 259 284 C 262 284 277 284 292 286 C 296 292 296 302 294 316 C 288 322 274 325 259 324 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                {/* 6-pack gomos médios */}
                                <Path
                                    d="M 218 330 L 253 330 L 253 372 C 238 372 222 370 216 364 C 214 350 214 340 218 330 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M 259 330 L 294 330 C 298 340 298 350 296 364 C 290 370 274 372 259 372 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                {/* 6-pack gomos inferiores */}
                                <Path
                                    d="M 217 378 L 253 378 L 253 430 C 242 432 232 426 224 410 C 218 396 216 386 217 378 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M 259 378 L 295 378 C 296 386 294 396 288 410 C 280 426 270 432 259 430 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                {/* Oblíquos Externos (cintura atlética lateral) */}
                                <Path
                                    d="M 210 300 C 196 318 188 345 186 370 C 184 395 192 418 206 435 C 214 425 216 400 214 375 C 214 345 216 320 210 300 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                                <Path
                                    d="M 302 300 C 316 318 324 345 326 370 C 328 395 320 418 306 435 C 298 425 296 400 298 375 C 298 345 296 320 302 300 Z"
                                    fill={getMuscleFill('Abdômen', 'grad-abs-front')}
                                    fillOpacity={getMuscleOpacity('Abdômen')}
                                    stroke={getMuscleStroke('Abdômen')}
                                    strokeWidth={getMuscleStrokeWidth('Abdômen')}
                                />
                            </G>

                            {/* Quadríceps (Coxa frontal completa: desde a virilha/quadril até o topo do joelho) */}
                            <G {...getSvgPressProps('Quadríceps')}>
                                <Path
                                    d="M 185 448 C 165 490 160 545 170 605 C 178 635 190 660 205 668 C 220 672 234 660 238 625 C 245 565 250 500 248 475 C 230 460 205 448 185 448 Z"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                                <Path
                                    d="M 327 448 C 347 490 352 545 342 605 C 334 635 322 660 307 668 C 292 672 278 660 274 625 C 267 565 262 500 264 475 C 282 460 307 448 327 448 Z"
                                    fill={getMuscleFill('Quadríceps', 'grad-quads-front')}
                                    fillOpacity={getMuscleOpacity('Quadríceps')}
                                    stroke={getMuscleStroke('Quadríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Quadríceps')}
                                />
                            </G>

                            {/* Panturrilhas (Perna inferior completa até o tornozelo) */}
                            <G {...getSvgPressProps('Panturrilhas')}>
                                <Path
                                    d="M 200 695 C 182 725 174 765 176 815 C 180 860 190 895 198 915 C 210 915 220 895 226 845 C 228 795 226 745 218 705 Z"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-front')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                                <Path
                                    d="M 312 695 C 330 725 338 765 336 815 C 332 860 322 895 314 915 C 302 915 292 895 286 845 C 284 795 286 745 294 705 Z"
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

                {/* 2. Precision SVG Heatmap Layer */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <Svg width="100%" height="100%" viewBox="0 0 512 960" preserveAspectRatio="xMidYMid meet">
                        <Defs>
                            {colors['Trapézio'] && (
                                <LinearGradient id="grad-traps-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Trapézio']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Trapézio']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Costas'] && (
                                <LinearGradient id="grad-back-lat" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Costas']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Costas']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}

                            {colors['Tríceps'] && (
                                <LinearGradient id="grad-triceps-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Tríceps']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Tríceps']} stopOpacity="0.5" />
                                </LinearGradient>
                            )}

                            {colors['Glúteos'] && (
                                <RadialGradient id="grad-glutes-back" cx="50%" cy="50%" rx="60%" ry="60%">
                                    <Stop offset="0%" stopColor={colors['Glúteos']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Glúteos']} stopOpacity="0.4" />
                                </RadialGradient>
                            )}

                            {colors['Isquiotibiais'] && (
                                <LinearGradient id="grad-hamstrings-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Isquiotibiais']} stopOpacity="0.92" />
                                    <Stop offset="100%" stopColor={colors['Isquiotibiais']} stopOpacity="0.4" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.92" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.4" />
                                </LinearGradient>
                            )}

                            {colors['Antebraços'] && (
                                <LinearGradient id="grad-forearms-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Antebraços']} stopOpacity="0.95" />
                                    <Stop offset="100%" stopColor={colors['Antebraços']} stopOpacity="0.45" />
                                </LinearGradient>
                            )}
                        </Defs>

                        <G>
                            {/* Trapézio Dorsal Superior & Médio - Acompanha a curvatura ergonômica da nuca, pescoço e crista da escápula */}
                            <G {...getSvgPressProps('Trapézio')}>
                                <Path
                                    d="M 256 142 C 242 152 230 172 210 192 C 190 204 174 210 162 214 C 176 226 205 236 228 260 C 244 278 252 298 256 318 C 260 298 268 278 284 260 C 307 236 336 226 350 214 C 338 210 322 204 302 192 C 282 172 270 152 256 142 Z"
                                    fill={getMuscleFill('Trapézio', 'grad-traps-back')}
                                    fillOpacity={getMuscleOpacity('Trapézio')}
                                    stroke={getMuscleStroke('Trapézio')}
                                    strokeWidth={getMuscleStrokeWidth('Trapézio')}
                                />
                            </G>

                            {/* Deltoides Posteriores (Ombros) */}
                            <G {...getSvgPressProps('Ombros')}>
                                <Path
                                    d="M 162 214 C 144 218 126 235 122 255 C 118 276 124 296 138 310 C 148 312 158 296 164 274 C 170 252 174 232 176 226 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                                <Path
                                    d="M 350 214 C 368 218 386 235 390 255 C 394 276 388 296 374 310 C 364 312 354 296 348 274 C 342 252 338 232 336 226 Z"
                                    fill={getMuscleFill('Ombros', 'grad-delts-back')}
                                    fillOpacity={getMuscleOpacity('Ombros')}
                                    stroke={getMuscleStroke('Ombros')}
                                    strokeWidth={getMuscleStrokeWidth('Ombros')}
                                />
                            </G>

                            {/* Costas & Grandes Dorsais (V-Taper anatômico) */}
                            <G {...getSvgPressProps('Costas')}>
                                <Path
                                    d="M 254 318 C 238 285 212 250 176 262 C 160 275 152 298 160 324 C 168 344 176 368 190 392 C 206 414 228 428 254 428 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                                <Path
                                    d="M 258 318 C 274 285 300 250 336 262 C 352 275 360 298 352 324 C 344 344 336 368 322 392 C 306 414 284 428 258 428 Z"
                                    fill={getMuscleFill('Costas', 'grad-back-lat')}
                                    fillOpacity={getMuscleOpacity('Costas')}
                                    stroke={getMuscleStroke('Costas')}
                                    strokeWidth={getMuscleStrokeWidth('Costas')}
                                />
                            </G>

                            {/* Tríceps (Braço Posterior Completo) */}
                            <G {...getSvgPressProps('Tríceps')}>
                                <Path
                                    d="M 138 310 C 124 318 116 335 116 355 C 116 368 124 374 136 372 C 146 368 155 355 158 338 C 160 322 154 312 144 310 Z"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                                <Path
                                    d="M 374 310 C 388 318 396 335 396 355 C 396 368 388 374 376 372 C 366 368 357 355 354 338 C 352 322 358 312 368 310 Z"
                                    fill={getMuscleFill('Tríceps', 'grad-triceps-back')}
                                    fillOpacity={getMuscleOpacity('Tríceps')}
                                    stroke={getMuscleStroke('Tríceps')}
                                    strokeWidth={getMuscleStrokeWidth('Tríceps')}
                                />
                            </G>

                            {/* Antebraços Dorsais */}
                            <G {...getSvgPressProps('Antebraços')}>
                                <Path
                                    d="M 124 370 C 112 395 96 426 82 454 C 74 468 74 476 84 476 C 96 476 112 454 128 424 C 138 395 140 376 134 370 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-back')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                                <Path
                                    d="M 388 370 C 400 395 416 426 430 454 C 438 468 438 476 428 476 C 416 476 400 454 384 424 C 374 395 372 376 378 370 Z"
                                    fill={getMuscleFill('Antebraços', 'grad-forearms-back')}
                                    fillOpacity={getMuscleOpacity('Antebraços')}
                                    stroke={getMuscleStroke('Antebraços')}
                                    strokeWidth={getMuscleStrokeWidth('Antebraços')}
                                />
                            </G>

                            {/* Glúteos */}
                            <G {...getSvgPressProps('Glúteos')}>
                                <Path
                                    d="M 254 430 C 220 426 178 440 166 470 C 158 500 172 528 212 530 C 236 531 250 518 254 490 Z"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                                <Path
                                    d="M 258 430 C 292 426 334 440 346 470 C 354 500 340 528 300 530 C 276 531 262 518 258 490 Z"
                                    fill={getMuscleFill('Glúteos', 'grad-glutes-back')}
                                    fillOpacity={getMuscleOpacity('Glúteos')}
                                    stroke={getMuscleStroke('Glúteos')}
                                    strokeWidth={getMuscleStrokeWidth('Glúteos')}
                                />
                            </G>

                            {/* Isquiotibiais (Posterior de Coxa) */}
                            <G {...getSvgPressProps('Isquiotibiais')}>
                                <Path
                                    d="M 252 533 C 242 560 234 605 230 650 C 230 670 236 672 228 672 C 210 672 188 650 176 610 C 168 565 174 533 198 533 Z"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                                <Path
                                    d="M 260 533 C 270 560 278 605 282 650 C 282 670 276 672 284 672 C 302 672 324 650 336 610 C 344 565 338 533 314 533 Z"
                                    fill={getMuscleFill('Isquiotibiais', 'grad-hamstrings-back')}
                                    fillOpacity={getMuscleOpacity('Isquiotibiais')}
                                    stroke={getMuscleStroke('Isquiotibiais')}
                                    strokeWidth={getMuscleStrokeWidth('Isquiotibiais')}
                                />
                            </G>

                            {/* Panturrilhas Traseiras (Perna inferior completa até o tendão de aquiles e tornozelo) */}
                            <G {...getSvgPressProps('Panturrilhas')}>
                                <Path
                                    d="M 200 695 C 182 725 174 765 176 815 C 180 860 190 895 198 915 C 210 915 220 895 226 845 C 228 795 226 745 218 705 Z"
                                    fill={getMuscleFill('Panturrilhas', 'grad-calves-back')}
                                    fillOpacity={getMuscleOpacity('Panturrilhas')}
                                    stroke={getMuscleStroke('Panturrilhas')}
                                    strokeWidth={getMuscleStrokeWidth('Panturrilhas')}
                                />
                                <Path
                                    d="M 312 695 C 330 725 338 765 336 815 C 332 860 322 895 314 915 C 302 915 292 895 286 845 C 284 795 286 745 294 705 Z"
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
