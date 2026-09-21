import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    GestureResponderEvent,
    PanResponder,
    PanResponderGestureState,
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

interface AnatomicalMuscleBodyProps {
    viewSide: 'Front' | 'Back';
    colors: MuscleColorMap;
    width?: number;
    height?: number;
    onToggleSide?: () => void;
}

// Sleek aesthetic palette for the unworked athletic base body
const BASE_FILL = '#162032';
const BASE_STROKE = '#2D3D54';
const BASE_LINE = 'rgba(74, 96, 126, 0.45)';
const BASE_DEEP = '#0F172A';

export function AnatomicalMuscleBody({
    viewSide,
    colors,
    width = 135,
    height = 250,
    onToggleSide,
}: AnatomicalMuscleBodyProps) {
    const [displaySide, setDisplaySide] = useState<'Front' | 'Back'>(viewSide);

    // 1. Idle 3D Micro-Motion (Breathing & Subtle 3D Floating)
    const idleAnim = useRef(new Animated.Value(0)).current;

    // 2. 3D Rotation Value (0 = Front, 180 = Back)
    const rotateYAnim = useRef(new Animated.Value(viewSide === 'Front' ? 0 : 180)).current;
    const currentAngle = useRef(viewSide === 'Front' ? 0 : 180);
    const dragStartAngle = useRef(viewSide === 'Front' ? 0 : 180);

    useEffect(() => {
        const id = rotateYAnim.addListener(({ value }) => {
            currentAngle.current = value;
            const normalized = ((value % 360) + 360) % 360;
            if (normalized > 90 && normalized < 270) {
                setDisplaySide('Back');
            } else {
                setDisplaySide('Front');
            }
        });
        return () => {
            rotateYAnim.removeListener(id);
        };
    }, [rotateYAnim]);

    useEffect(() => {
        const target = viewSide === 'Front' ? 0 : 180;
        Animated.spring(rotateYAnim, {
            toValue: target,
            useNativeDriver: true,
            friction: 9,
            tension: 30,
        }).start();
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

    // 3. Interactive 3D Pan Responder (Drag horizontally to spin in 3D with controlled, smooth sensitivity)
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (
                _: GestureResponderEvent,
                gestureState: PanResponderGestureState
            ) => Math.abs(gestureState.dx) > 12,
            onPanResponderGrant: () => {
                rotateYAnim.stopAnimation();
                dragStartAngle.current = currentAngle.current;
            },
            onPanResponderMove: (
                _: GestureResponderEvent,
                gestureState: PanResponderGestureState
            ) => {
                // Reduced sensitivity: 1px drag = only 0.28 degrees (suave, controlado e preciso)
                const newAngle = dragStartAngle.current - gestureState.dx * 0.28;
                rotateYAnim.setValue(newAngle);
            },
            onPanResponderRelease: (
                _: GestureResponderEvent,
                gestureState: PanResponderGestureState
            ) => {
                const normalized = ((currentAngle.current % 360) + 360) % 360;
                let targetAngle = 0;
                if (normalized > 90 && normalized < 270) {
                    targetAngle = 180;
                } else {
                    targetAngle = normalized >= 270 ? 360 : 0;
                }

                if (Math.abs(gestureState.vx) > 0.8) {
                    if (gestureState.vx < 0) {
                        targetAngle = currentAngle.current < 90 ? 180 : 360;
                    } else {
                        targetAngle = currentAngle.current > 90 ? 0 : -180;
                    }
                }

                Animated.spring(rotateYAnim, {
                    toValue: targetAngle,
                    useNativeDriver: true,
                    friction: 9,
                    tension: 30,
                }).start(() => {
                    const finalNorm = ((targetAngle % 360) + 360) % 360;
                    const finalVal = finalNorm > 90 && finalNorm < 270 ? 180 : 0;
                    rotateYAnim.setValue(finalVal);
                    currentAngle.current = finalVal;
                    if ((finalVal === 180 && viewSide === 'Front') || (finalVal === 0 && viewSide === 'Back')) {
                        onToggleSide?.();
                    }
                });
            },
        })
    ).current;

    const translateY = idleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-3, 3],
    });

    const rotateXIdle = idleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-1.5deg', '1.5deg'],
    });

    const rotateYString = rotateYAnim.interpolate({
        inputRange: [-360, 0, 360],
        outputRange: ['-360deg', '0deg', '360deg'],
    });

    const pedestalPulse = idleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.7],
    });

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    width,
                    height,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transform: [
                        { perspective: 900 },
                        { translateY },
                        { rotateY: rotateYString },
                        { rotateX: rotateXIdle },
                    ],
                }}
            >
                {/* 100% Vector Anatomical Sculptural Muscular Mannequin */}
                <View style={StyleSheet.absoluteFill}>
                    <Svg width="100%" height="100%" viewBox="256 32 512 960">
                        <Defs>
                            {/* Base Silhouette Gradients */}
                            <LinearGradient id="grad-base-mannequin" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor="#1E2B3E" stopOpacity="0.9" />
                                <Stop offset="45%" stopColor="#141D2B" stopOpacity="0.95" />
                                <Stop offset="100%" stopColor="#0B1018" stopOpacity="1" />
                            </LinearGradient>

                            {/* Dynamic Heatmap Gradients for Worked Muscles */}
                            {colors['Peito'] && (
                                <>
                                    <RadialGradient id="grad-chest-left" cx="55%" cy="45%" rx="55%" ry="50%">
                                        <Stop offset="0%" stopColor={colors['Peito']} stopOpacity="0.85" />
                                        <Stop offset="70%" stopColor={colors['Peito']} stopOpacity="0.55" />
                                        <Stop offset="100%" stopColor={colors['Peito']} stopOpacity="0.25" />
                                    </RadialGradient>
                                    <RadialGradient id="grad-chest-right" cx="45%" cy="45%" rx="55%" ry="50%">
                                        <Stop offset="0%" stopColor={colors['Peito']} stopOpacity="0.85" />
                                        <Stop offset="70%" stopColor={colors['Peito']} stopOpacity="0.55" />
                                        <Stop offset="100%" stopColor={colors['Peito']} stopOpacity="0.25" />
                                    </RadialGradient>
                                </>
                            )}

                            {colors['Ombros'] && (
                                <LinearGradient id="grad-delts" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Ombros']} stopOpacity="0.85" />
                                    <Stop offset="100%" stopColor={colors['Ombros']} stopOpacity="0.35" />
                                </LinearGradient>
                            )}

                            {colors['Bíceps'] && (
                                <LinearGradient id="grad-biceps" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Bíceps']} stopOpacity="0.85" />
                                    <Stop offset="100%" stopColor={colors['Bíceps']} stopOpacity="0.35" />
                                </LinearGradient>
                            )}

                            {colors['Abdômen'] && (
                                <RadialGradient id="grad-abs" cx="50%" cy="50%" rx="50%" ry="50%">
                                    <Stop offset="0%" stopColor={colors['Abdômen']} stopOpacity="0.85" />
                                    <Stop offset="80%" stopColor={colors['Abdômen']} stopOpacity="0.5" />
                                    <Stop offset="100%" stopColor={colors['Abdômen']} stopOpacity="0.25" />
                                </RadialGradient>
                            )}

                            {colors['Quadríceps'] && (
                                <LinearGradient id="grad-quads" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Quadríceps']} stopOpacity="0.8" />
                                    <Stop offset="70%" stopColor={colors['Quadríceps']} stopOpacity="0.5" />
                                    <Stop offset="100%" stopColor={colors['Quadríceps']} stopOpacity="0.25" />
                                </LinearGradient>
                            )}

                            {colors['Panturrilhas'] && (
                                <LinearGradient id="grad-calves" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Panturrilhas']} stopOpacity="0.85" />
                                    <Stop offset="100%" stopColor={colors['Panturrilhas']} stopOpacity="0.3" />
                                </LinearGradient>
                            )}

                            {colors['Costas'] && (
                                <LinearGradient id="grad-back" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Costas']} stopOpacity="0.85" />
                                    <Stop offset="100%" stopColor={colors['Costas']} stopOpacity="0.35" />
                                </LinearGradient>
                            )}

                            {colors['Glúteos'] && (
                                <RadialGradient id="grad-glutes" cx="50%" cy="40%" rx="60%" ry="60%">
                                    <Stop offset="0%" stopColor={colors['Glúteos']} stopOpacity="0.85" />
                                    <Stop offset="100%" stopColor={colors['Glúteos']} stopOpacity="0.3" />
                                </RadialGradient>
                            )}

                            {colors['Isquiotibiais'] && (
                                <LinearGradient id="grad-hamstrings" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Isquiotibiais']} stopOpacity="0.85" />
                                    <Stop offset="100%" stopColor={colors['Isquiotibiais']} stopOpacity="0.3" />
                                </LinearGradient>
                            )}

                            {colors['Tríceps'] && (
                                <LinearGradient id="grad-triceps" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor={colors['Tríceps']} stopOpacity="0.85" />
                                    <Stop offset="100%" stopColor={colors['Tríceps']} stopOpacity="0.3" />
                                </LinearGradient>
                            )}
                        </Defs>

                        {displaySide === 'Front' ? (
                            /* ════════════════════════════ FRONT VIEW ════════════════════════════ */
                            <G>
                                {/* 1. Head & Neck */}
                                <Path
                                    d="M512 55 C478 55 464 85 464 125 C464 165 486 182 512 182 C538 182 560 165 560 125 C560 85 546 55 512 55 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.3}
                                />
                                {/* Face & Jawline Athletic Contours */}
                                <Path
                                    d="M480 142 L512 176 L544 142"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.1}
                                    fill="none"
                                />
                                {/* Neck & Sternocleidomastoid */}
                                <Path
                                    d="M488 178 C484 202 480 220 464 235 L560 235 C544 220 540 202 536 178 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />
                                <Path
                                    d="M492 182 L508 232"
                                    stroke={BASE_LINE}
                                    strokeWidth={1}
                                    fill="none"
                                />
                                <Path
                                    d="M532 182 L516 232"
                                    stroke={BASE_LINE}
                                    strokeWidth={1}
                                    fill="none"
                                />

                                {/* 2. Trapezius (Front) */}
                                <Path
                                    d="M488 178 C468 190 435 215 408 226 L430 236 C460 234 480 215 488 178 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.2}
                                />
                                <Path
                                    d="M536 178 C556 190 589 215 616 226 L594 236 C564 234 544 215 536 178 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.2}
                                />

                                {/* 3. Clavicles (Collarbones) */}
                                <Path
                                    d="M410 236 C450 242 490 246 512 248 C534 246 574 242 614 236"
                                    stroke="rgba(148, 163, 184, 0.6)"
                                    strokeWidth={1.4}
                                    fill="none"
                                />

                                {/* 4. Forearms & Hands */}
                                <Path
                                    d="M348 428 C332 446 322 476 324 506 C326 524 336 534 346 532 C356 528 364 500 366 468 C366 448 362 434 348 428 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.2}
                                />
                                <Path
                                    d="M338 450 C336 480 342 506 348 526"
                                    stroke={BASE_LINE}
                                    strokeWidth={0.9}
                                    fill="none"
                                />
                                <Path
                                    d="M334 532 C330 544 332 558 338 564 C342 566 348 562 350 550 C352 542 348 532 334 532 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />
                                <Path
                                    d="M676 428 C692 446 702 476 700 506 C698 524 688 534 678 532 C668 528 660 500 658 468 C658 448 662 434 676 428 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.2}
                                />
                                <Path
                                    d="M686 450 C688 480 682 506 676 526"
                                    stroke={BASE_LINE}
                                    strokeWidth={0.9}
                                    fill="none"
                                />
                                <Path
                                    d="M690 532 C694 544 692 558 686 564 C682 566 676 562 674 550 C672 542 676 532 690 532 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />

                                {/* 5. Obliques & Ribcage / Serratus Anterior */}
                                <Path
                                    d="M420 340 C426 354 436 366 448 372"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.1}
                                    fill="none"
                                />
                                <Path
                                    d="M424 374 C432 386 442 398 452 404"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.1}
                                    fill="none"
                                />
                                <Path
                                    d="M428 406 C436 418 446 428 456 434"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.1}
                                    fill="none"
                                />
                                <Path
                                    d="M604 340 C598 354 588 366 576 372"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.1}
                                    fill="none"
                                />
                                <Path
                                    d="M600 374 C592 386 582 398 572 404"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.1}
                                    fill="none"
                                />
                                <Path
                                    d="M596 406 C588 418 578 428 568 434"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.1}
                                    fill="none"
                                />

                                {/* 6. Waist & Inguinal V-Crest (Adonis Belt & Pelvis) */}
                                <Path
                                    d="M448 432 C438 460 442 492 454 518 L570 518 C582 492 586 460 576 432 Z"
                                    fill={BASE_DEEP}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.2}
                                />
                                <Path
                                    d="M454 516 L512 538 L570 516"
                                    stroke="rgba(148, 163, 184, 0.5)"
                                    strokeWidth={1.2}
                                    fill="none"
                                />

                                {/* 7. Knees & Joints */}
                                <Path
                                    d="M444 734 C434 742 436 756 448 758 C460 758 464 744 454 734 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />
                                <Path
                                    d="M580 734 C570 742 572 756 584 758 C596 758 600 744 590 734 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />

                                {/* 8. Ankles & Feet */}
                                <Path
                                    d="M440 914 L436 942 C436 948 444 950 452 948 L454 914 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />
                                <Path
                                    d="M584 914 L588 942 C588 948 580 950 572 948 L570 914 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />

                                {/* ══════════════ PEITORAL (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Peitoral Esquerdo - Cabeça Clavicular (Superior) */}
                                    <Path
                                        d="M420 240 C445 244 480 248 506 250 L506 278 C480 278 440 270 412 258 C410 250 414 242 420 240 Z"
                                        fill={colors['Peito'] ? 'url(#grad-chest-left)' : BASE_FILL}
                                        stroke={colors['Peito'] || BASE_STROKE}
                                        strokeWidth={colors['Peito'] ? 1.4 : 1.2}
                                    />
                                    {/* Peitoral Esquerdo - Cabeça Esternocostal (Principal) */}
                                    <Path
                                        d="M412 258 C440 270 480 278 506 278 L506 324 C482 332 444 330 416 312 C404 294 404 274 412 258 Z"
                                        fill={colors['Peito'] ? 'url(#grad-chest-left)' : BASE_FILL}
                                        stroke={colors['Peito'] || BASE_STROKE}
                                        strokeWidth={colors['Peito'] ? 1.5 : 1.2}
                                    />
                                    {/* Fibras Musculares do Peito Esquerdo */}
                                    <Path
                                        d="M428 250 C454 256 484 260 504 262"
                                        stroke={colors['Peito'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Peito'] ? 0.85 : 0.4}
                                        fill="none"
                                    />
                                    <Path
                                        d="M420 270 C450 278 480 286 504 288"
                                        stroke={colors['Peito'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Peito'] ? 0.9 : 0.4}
                                        fill="none"
                                    />
                                    <Path
                                        d="M418 288 C446 298 476 304 502 306"
                                        stroke={colors['Peito'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Peito'] ? 0.85 : 0.4}
                                        fill="none"
                                    />

                                    {/* Peitoral Direito - Cabeça Clavicular (Superior) */}
                                    <Path
                                        d="M604 240 C579 244 544 248 518 250 L518 278 C544 278 584 270 612 258 C614 250 610 242 604 240 Z"
                                        fill={colors['Peito'] ? 'url(#grad-chest-right)' : BASE_FILL}
                                        stroke={colors['Peito'] || BASE_STROKE}
                                        strokeWidth={colors['Peito'] ? 1.4 : 1.2}
                                    />
                                    {/* Peitoral Direito - Cabeça Esternocostal (Principal) */}
                                    <Path
                                        d="M612 258 C584 270 544 278 518 278 L518 324 C542 332 580 330 608 312 C620 294 620 274 612 258 Z"
                                        fill={colors['Peito'] ? 'url(#grad-chest-right)' : BASE_FILL}
                                        stroke={colors['Peito'] || BASE_STROKE}
                                        strokeWidth={colors['Peito'] ? 1.5 : 1.2}
                                    />
                                    {/* Fibras Musculares do Peito Direito */}
                                    <Path
                                        d="M596 250 C570 256 540 260 520 262"
                                        stroke={colors['Peito'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Peito'] ? 0.85 : 0.4}
                                        fill="none"
                                    />
                                    <Path
                                        d="M604 270 C574 278 544 286 520 288"
                                        stroke={colors['Peito'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Peito'] ? 0.9 : 0.4}
                                        fill="none"
                                    />
                                    <Path
                                        d="M606 288 C578 298 548 304 522 306"
                                        stroke={colors['Peito'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Peito'] ? 0.85 : 0.4}
                                        fill="none"
                                    />
                                </G>

                                {/* ══════════════ DELTÓIDES / OMBROS (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Deltóide Esquerdo */}
                                    <Path
                                        d="M400 220 C370 230 340 260 334 290 C330 310 344 330 366 324 C378 304 388 266 400 220 Z"
                                        fill={colors['Ombros'] ? 'url(#grad-delts)' : BASE_FILL}
                                        stroke={colors['Ombros'] || BASE_STROKE}
                                        strokeWidth={colors['Ombros'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M370 232 C356 260 354 290 358 316"
                                        stroke={colors['Ombros'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Ombros'] ? 0.8 : 0.4}
                                        fill="none"
                                    />

                                    {/* Deltóide Direito */}
                                    <Path
                                        d="M624 220 C654 230 684 260 690 290 C694 310 680 330 658 324 C646 304 636 266 624 220 Z"
                                        fill={colors['Ombros'] ? 'url(#grad-delts)' : BASE_FILL}
                                        stroke={colors['Ombros'] || BASE_STROKE}
                                        strokeWidth={colors['Ombros'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M654 232 C668 260 670 290 666 316"
                                        stroke={colors['Ombros'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Ombros'] ? 0.8 : 0.4}
                                        fill="none"
                                    />
                                </G>

                                {/* ══════════════ BÍCEPS BRAQUIAL (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Bíceps Esquerdo */}
                                    <Path
                                        d="M360 326 C338 340 326 380 330 420 C336 432 352 434 366 422 C376 394 378 360 360 326 Z"
                                        fill={colors['Bíceps'] ? 'url(#grad-biceps)' : BASE_FILL}
                                        stroke={colors['Bíceps'] || BASE_STROKE}
                                        strokeWidth={colors['Bíceps'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M352 338 C346 368 348 396 354 422"
                                        stroke={colors['Bíceps'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Bíceps'] ? 0.8 : 0.4}
                                        fill="none"
                                    />

                                    {/* Bíceps Direito */}
                                    <Path
                                        d="M664 326 C686 340 698 380 694 420 C688 432 672 434 658 422 C648 394 646 360 664 326 Z"
                                        fill={colors['Bíceps'] ? 'url(#grad-biceps)' : BASE_FILL}
                                        stroke={colors['Bíceps'] || BASE_STROKE}
                                        strokeWidth={colors['Bíceps'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M672 338 C678 368 676 396 670 422"
                                        stroke={colors['Bíceps'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Bíceps'] ? 0.8 : 0.4}
                                        fill="none"
                                    />
                                </G>

                                {/* ══════════════ ABDÔMEN / SIX-PACK (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Upper Abs */}
                                    <Path
                                        d="M466 342 C486 342 506 344 506 372 C506 386 488 388 466 388 C456 376 454 354 466 342 Z"
                                        fill={colors['Abdômen'] ? 'url(#grad-abs)' : BASE_FILL}
                                        stroke={colors['Abdômen'] || BASE_STROKE}
                                        strokeWidth={colors['Abdômen'] ? 1.3 : 1.1}
                                    />
                                    <Path
                                        d="M558 342 C538 342 518 344 518 372 C518 386 536 388 558 388 C568 376 570 354 558 342 Z"
                                        fill={colors['Abdômen'] ? 'url(#grad-abs)' : BASE_FILL}
                                        stroke={colors['Abdômen'] || BASE_STROKE}
                                        strokeWidth={colors['Abdômen'] ? 1.3 : 1.1}
                                    />

                                    {/* Mid Abs */}
                                    <Path
                                        d="M466 394 C486 394 506 396 506 426 C506 440 488 442 466 442 C454 430 454 408 466 394 Z"
                                        fill={colors['Abdômen'] ? 'url(#grad-abs)' : BASE_FILL}
                                        stroke={colors['Abdômen'] || BASE_STROKE}
                                        strokeWidth={colors['Abdômen'] ? 1.3 : 1.1}
                                    />
                                    <Path
                                        d="M558 394 C538 394 518 396 518 426 C518 440 536 442 558 442 C570 430 570 408 558 394 Z"
                                        fill={colors['Abdômen'] ? 'url(#grad-abs)' : BASE_FILL}
                                        stroke={colors['Abdômen'] || BASE_STROKE}
                                        strokeWidth={colors['Abdômen'] ? 1.3 : 1.1}
                                    />

                                    {/* Lower Abs */}
                                    <Path
                                        d="M468 448 C486 448 506 450 506 486 C496 498 478 500 466 492 C456 478 456 462 468 448 Z"
                                        fill={colors['Abdômen'] ? 'url(#grad-abs)' : BASE_FILL}
                                        stroke={colors['Abdômen'] || BASE_STROKE}
                                        strokeWidth={colors['Abdômen'] ? 1.3 : 1.1}
                                    />
                                    <Path
                                        d="M556 448 C538 448 518 450 518 486 C528 498 546 500 558 492 C568 478 568 462 556 448 Z"
                                        fill={colors['Abdômen'] ? 'url(#grad-abs)' : BASE_FILL}
                                        stroke={colors['Abdômen'] || BASE_STROKE}
                                        strokeWidth={colors['Abdômen'] ? 1.3 : 1.1}
                                    />

                                    {/* Linha Alba Central */}
                                    <Path
                                        d="M512 336 L512 494"
                                        stroke={colors['Abdômen'] || 'rgba(100, 116, 139, 0.6)'}
                                        strokeWidth={1.5}
                                        strokeOpacity={colors['Abdômen'] ? 0.95 : 0.5}
                                    />
                                </G>

                                {/* ══════════════ QUADRÍCEPS (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Coxa Esquerda */}
                                    <Path
                                        d="M440 534 C416 550 406 600 404 656 C402 700 418 732 444 734 C474 736 496 706 500 664 C506 612 494 562 468 534 Z"
                                        fill={colors['Quadríceps'] ? 'url(#grad-quads)' : BASE_FILL}
                                        stroke={colors['Quadríceps'] || BASE_STROKE}
                                        strokeWidth={colors['Quadríceps'] ? 1.5 : 1.2}
                                    />
                                    <Path
                                        d="M452 546 C442 590 442 642 450 684"
                                        stroke={colors['Quadríceps'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Quadríceps'] ? 0.85 : 0.4}
                                        fill="none"
                                    />
                                    {/* Vasto Medial ("Gota") */}
                                    <Path
                                        d="M466 654 C482 666 488 686 480 706 C468 708 460 690 466 654 Z"
                                        fill={colors['Quadríceps'] ? 'url(#grad-quads)' : BASE_DEEP}
                                        stroke={colors['Quadríceps'] || BASE_STROKE}
                                        strokeWidth={1}
                                    />

                                    {/* Coxa Direita */}
                                    <Path
                                        d="M584 534 C608 550 618 600 620 656 C622 700 606 732 580 734 C550 736 528 706 524 664 C518 612 530 562 556 534 Z"
                                        fill={colors['Quadríceps'] ? 'url(#grad-quads)' : BASE_FILL}
                                        stroke={colors['Quadríceps'] || BASE_STROKE}
                                        strokeWidth={colors['Quadríceps'] ? 1.5 : 1.2}
                                    />
                                    <Path
                                        d="M572 546 C582 590 582 642 574 684"
                                        stroke={colors['Quadríceps'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Quadríceps'] ? 0.85 : 0.4}
                                        fill="none"
                                    />
                                    {/* Vasto Medial ("Gota") */}
                                    <Path
                                        d="M558 654 C542 666 536 686 544 706 C556 708 564 690 558 654 Z"
                                        fill={colors['Quadríceps'] ? 'url(#grad-quads)' : BASE_DEEP}
                                        stroke={colors['Quadríceps'] || BASE_STROKE}
                                        strokeWidth={1}
                                    />
                                </G>

                                {/* ══════════════ PANTURRILHAS (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Panturrilha Esquerda */}
                                    <Path
                                        d="M438 764 C420 786 416 830 422 870 C428 898 440 916 450 914 C462 910 468 876 468 834 C466 798 456 772 438 764 Z"
                                        fill={colors['Panturrilhas'] ? 'url(#grad-calves)' : BASE_FILL}
                                        stroke={colors['Panturrilhas'] || BASE_STROKE}
                                        strokeWidth={colors['Panturrilhas'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M444 776 C442 814 444 856 448 892"
                                        stroke={colors['Panturrilhas'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Panturrilhas'] ? 0.8 : 0.4}
                                        fill="none"
                                    />

                                    {/* Panturrilha Direita */}
                                    <Path
                                        d="M586 764 C604 786 608 830 602 870 C596 898 584 916 574 914 C562 910 556 876 556 834 C558 798 568 772 586 764 Z"
                                        fill={colors['Panturrilhas'] ? 'url(#grad-calves)' : BASE_FILL}
                                        stroke={colors['Panturrilhas'] || BASE_STROKE}
                                        strokeWidth={colors['Panturrilhas'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M580 776 C582 814 580 856 576 892"
                                        stroke={colors['Panturrilhas'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Panturrilhas'] ? 0.8 : 0.4}
                                        fill="none"
                                    />
                                </G>
                            </G>
                        ) : (
                            /* ════════════════════════════ BACK VIEW ════════════════════════════ */
                            <G>
                                {/* 1. Back of Head & Neck */}
                                <Path
                                    d="M512 55 C478 55 464 85 464 125 C464 165 486 182 512 182 C538 182 560 165 560 125 C560 85 546 55 512 55 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.3}
                                />
                                <Path
                                    d="M488 178 C484 202 480 220 464 235 L560 235 C544 220 540 202 536 178 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />
                                {/* Cervical Spine hint */}
                                <Path
                                    d="M512 182 L512 235"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.2}
                                />

                                {/* 2. Back Forearms & Hands */}
                                <Path
                                    d="M348 428 C332 446 322 476 324 506 C326 524 336 534 346 532 C356 528 364 500 366 468 C366 448 362 434 348 428 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.2}
                                />
                                <Path
                                    d="M334 532 C330 544 332 558 338 564 C342 566 348 562 350 550 C352 542 348 532 334 532 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />
                                <Path
                                    d="M676 428 C692 446 702 476 700 506 C698 524 688 534 678 532 C668 528 660 500 658 468 C658 448 662 434 676 428 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.2}
                                />
                                <Path
                                    d="M690 532 C694 544 692 558 686 564 C682 566 676 562 674 550 C672 542 676 532 690 532 Z"
                                    fill={BASE_FILL}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1.1}
                                />

                                {/* 3. Back of Knees & Achilles Tendons */}
                                <Path
                                    d="M440 736 C434 746 436 756 448 758 C460 758 462 746 456 736 Z"
                                    fill={BASE_DEEP}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1}
                                />
                                <Path
                                    d="M584 736 C578 746 580 756 592 758 C604 758 606 746 600 736 Z"
                                    fill={BASE_DEEP}
                                    stroke={BASE_STROKE}
                                    strokeWidth={1}
                                />
                                <Path
                                    d="M448 890 L448 945"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.5}
                                />
                                <Path
                                    d="M576 890 L576 945"
                                    stroke={BASE_LINE}
                                    strokeWidth={1.5}
                                />

                                {/* ══════════════ COSTAS & TRAPÉZIO (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Trapézio & Costas Superior */}
                                    <Path
                                        d="M512 216 L440 236 L394 286 C396 310 428 358 512 390 C596 358 628 310 630 286 L584 236 Z"
                                        fill={colors['Costas'] ? 'url(#grad-back)' : BASE_FILL}
                                        stroke={colors['Costas'] || BASE_STROKE}
                                        strokeWidth={colors['Costas'] ? 1.5 : 1.2}
                                    />
                                    {/* Estriação do Trapézio Superior */}
                                    <Path
                                        d="M470 238 C484 256 500 270 512 274 C524 270 540 256 554 238"
                                        stroke={colors['Costas'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Costas'] ? 0.85 : 0.45}
                                        fill="none"
                                    />
                                    {/* Coluna Vertebral */}
                                    <Path
                                        d="M512 220 L512 480"
                                        stroke={colors['Costas'] || 'rgba(100, 116, 139, 0.5)'}
                                        strokeWidth={1.4}
                                        strokeOpacity={colors['Costas'] ? 0.9 : 0.4}
                                    />

                                    {/* Grande Dorsal Esquerda (Asa) */}
                                    <Path
                                        d="M394 286 C376 312 372 372 384 424 C396 448 424 466 450 482 L450 390 C420 360 400 320 394 286 Z"
                                        fill={colors['Costas'] ? 'url(#grad-back)' : BASE_FILL}
                                        stroke={colors['Costas'] || BASE_STROKE}
                                        strokeWidth={colors['Costas'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M400 318 C422 344 440 376 448 408"
                                        stroke={colors['Costas'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Costas'] ? 0.8 : 0.4}
                                        fill="none"
                                    />
                                    <Path
                                        d="M394 360 C412 386 430 416 444 444"
                                        stroke={colors['Costas'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Costas'] ? 0.8 : 0.4}
                                        fill="none"
                                    />

                                    {/* Grande Dorsal Direita (Asa) */}
                                    <Path
                                        d="M630 286 C648 312 652 372 640 424 C628 448 600 466 574 482 L574 390 C604 360 624 320 630 286 Z"
                                        fill={colors['Costas'] ? 'url(#grad-back)' : BASE_FILL}
                                        stroke={colors['Costas'] || BASE_STROKE}
                                        strokeWidth={colors['Costas'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M624 318 C602 344 584 376 576 408"
                                        stroke={colors['Costas'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Costas'] ? 0.8 : 0.4}
                                        fill="none"
                                    />
                                    <Path
                                        d="M630 360 C612 386 594 416 580 444"
                                        stroke={colors['Costas'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Costas'] ? 0.8 : 0.4}
                                        fill="none"
                                    />
                                </G>

                                {/* ══════════════ REAR DELTOIDS (OMBROS POSTERIOR) ══════════════ */}
                                <G>
                                    <Path
                                        d="M400 220 C370 230 340 260 334 290 C330 310 344 330 366 324 C378 304 388 266 400 220 Z"
                                        fill={colors['Ombros'] ? 'url(#grad-delts)' : BASE_FILL}
                                        stroke={colors['Ombros'] || BASE_STROKE}
                                        strokeWidth={colors['Ombros'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M624 220 C654 230 684 260 690 290 C694 310 680 330 658 324 C646 304 636 266 624 220 Z"
                                        fill={colors['Ombros'] ? 'url(#grad-delts)' : BASE_FILL}
                                        stroke={colors['Ombros'] || BASE_STROKE}
                                        strokeWidth={colors['Ombros'] ? 1.4 : 1.2}
                                    />
                                </G>

                                {/* ══════════════ TRÍCEPS (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Tríceps Esquerdo */}
                                    <Path
                                        d="M362 328 C342 342 332 384 336 424 C342 436 358 438 372 426 C380 398 382 364 362 328 Z"
                                        fill={colors['Tríceps'] ? 'url(#grad-triceps)' : BASE_FILL}
                                        stroke={colors['Tríceps'] || BASE_STROKE}
                                        strokeWidth={colors['Tríceps'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M352 342 C346 376 350 404 358 424"
                                        stroke={colors['Tríceps'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Tríceps'] ? 0.8 : 0.4}
                                        fill="none"
                                    />

                                    {/* Tríceps Direito */}
                                    <Path
                                        d="M662 328 C682 342 692 384 688 424 C682 436 666 438 652 426 C644 398 642 364 662 328 Z"
                                        fill={colors['Tríceps'] ? 'url(#grad-triceps)' : BASE_FILL}
                                        stroke={colors['Tríceps'] || BASE_STROKE}
                                        strokeWidth={colors['Tríceps'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M672 342 C678 376 674 404 666 424"
                                        stroke={colors['Tríceps'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Tríceps'] ? 0.8 : 0.4}
                                        fill="none"
                                    />
                                </G>

                                {/* ══════════════ GLÚTEOS (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Glúteo Esquerdo */}
                                    <Path
                                        d="M448 518 C420 528 410 564 416 606 C424 634 452 652 494 642 L498 518 Z"
                                        fill={colors['Glúteos'] ? 'url(#grad-glutes)' : BASE_FILL}
                                        stroke={colors['Glúteos'] || BASE_STROKE}
                                        strokeWidth={colors['Glúteos'] ? 1.5 : 1.2}
                                    />
                                    <Path
                                        d="M434 546 C448 568 466 588 488 600"
                                        stroke={colors['Glúteos'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Glúteos'] ? 0.85 : 0.4}
                                        fill="none"
                                    />

                                    {/* Glúteo Direito */}
                                    <Path
                                        d="M576 518 C604 528 614 564 608 606 C600 634 572 652 530 642 L526 518 Z"
                                        fill={colors['Glúteos'] ? 'url(#grad-glutes)' : BASE_FILL}
                                        stroke={colors['Glúteos'] || BASE_STROKE}
                                        strokeWidth={colors['Glúteos'] ? 1.5 : 1.2}
                                    />
                                    <Path
                                        d="M590 546 C576 568 558 588 536 600"
                                        stroke={colors['Glúteos'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Glúteos'] ? 0.85 : 0.4}
                                        fill="none"
                                    />
                                </G>

                                {/* ══════════════ ISQUIOTIBIAIS (HEATMAP OU BASE) ══════════════ */}
                                <G>
                                    {/* Isquiotibial Esquerdo */}
                                    <Path
                                        d="M436 648 C416 670 412 712 420 748 C432 756 456 756 476 746 C492 718 492 682 488 648 Z"
                                        fill={colors['Isquiotibiais'] ? 'url(#grad-hamstrings)' : BASE_FILL}
                                        stroke={colors['Isquiotibiais'] || BASE_STROKE}
                                        strokeWidth={colors['Isquiotibiais'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M454 656 C448 688 448 718 452 748"
                                        stroke={colors['Isquiotibiais'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Isquiotibiais'] ? 0.85 : 0.4}
                                        fill="none"
                                    />

                                    {/* Isquiotibial Direito */}
                                    <Path
                                        d="M588 648 C608 670 612 712 604 748 C592 756 568 756 548 746 C532 718 532 682 536 648 Z"
                                        fill={colors['Isquiotibiais'] ? 'url(#grad-hamstrings)' : BASE_FILL}
                                        stroke={colors['Isquiotibiais'] || BASE_STROKE}
                                        strokeWidth={colors['Isquiotibiais'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M570 656 C576 688 576 718 572 748"
                                        stroke={colors['Isquiotibiais'] || BASE_LINE}
                                        strokeWidth={1}
                                        strokeOpacity={colors['Isquiotibiais'] ? 0.85 : 0.4}
                                        fill="none"
                                    />
                                </G>

                                {/* ══════════════ PANTURRILHAS (POSTERIOR) ══════════════ */}
                                <G>
                                    {/* Panturrilha Esquerda */}
                                    <Path
                                        d="M434 764 C416 786 412 830 418 870 C426 898 438 916 450 914 C464 908 470 876 470 834 C468 798 456 772 434 764 Z"
                                        fill={colors['Panturrilhas'] ? 'url(#grad-calves)' : BASE_FILL}
                                        stroke={colors['Panturrilhas'] || BASE_STROKE}
                                        strokeWidth={colors['Panturrilhas'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M442 774 C440 812 444 850 448 884"
                                        stroke={colors['Panturrilhas'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Panturrilhas'] ? 0.8 : 0.4}
                                        fill="none"
                                    />

                                    {/* Panturrilha Direita */}
                                    <Path
                                        d="M590 764 C608 786 612 830 606 870 C598 898 586 916 574 914 C560 908 554 876 554 834 C556 798 568 772 590 764 Z"
                                        fill={colors['Panturrilhas'] ? 'url(#grad-calves)' : BASE_FILL}
                                        stroke={colors['Panturrilhas'] || BASE_STROKE}
                                        strokeWidth={colors['Panturrilhas'] ? 1.4 : 1.2}
                                    />
                                    <Path
                                        d="M582 774 C584 812 580 850 576 884"
                                        stroke={colors['Panturrilhas'] || BASE_LINE}
                                        strokeWidth={0.9}
                                        strokeOpacity={colors['Panturrilhas'] ? 0.8 : 0.4}
                                        fill="none"
                                    />
                                </G>
                            </G>
                        )}
                    </Svg>
                </View>
            </Animated.View>

            {/* Futuristic 3D Hologram Pedestal Base */}
            <Animated.View
                style={{
                    width: 110,
                    height: 18,
                    borderRadius: 55,
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(56, 189, 248, 0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -6,
                    opacity: pedestalPulse,
                    transform: [{ scaleX: 1.15 }],
                }}
            >
                <View
                    style={{
                        width: 70,
                        height: 8,
                        borderRadius: 35,
                        backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    }}
                />
            </Animated.View>
        </View>
    );
}
