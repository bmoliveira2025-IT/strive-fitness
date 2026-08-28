import React, { useMemo, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const RING_SIZE = 100;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const HEIGHT = RADIUS + STROKE;

function SemiCircle({ progress, color, trackColor }: { progress: number, color: string, trackColor: string }) {
    const anim = useSharedValue(0);

    useEffect(() => {
        anim.value = withTiming(Math.min(Math.max(progress, 0), 1), { duration: 1000 });
    }, [anim, progress]);

    const arcLength = Math.PI * RADIUS;

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: arcLength * (1 - anim.value),
    }));

    const pathD = `M ${STROKE/2} ${HEIGHT - STROKE/2} A ${RADIUS} ${RADIUS} 0 0 1 ${RING_SIZE - STROKE/2} ${HEIGHT - STROKE/2}`;

    return (
        <View style={{ width: RING_SIZE, height: HEIGHT }}>
            <Svg width={RING_SIZE} height={HEIGHT} viewBox={`0 0 ${RING_SIZE} ${HEIGHT}`}>
                {/* Track */}
                <Path
                    d={pathD}
                    stroke={trackColor}
                    strokeWidth={STROKE}
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Progress */}
                <AnimatedPath
                    d={pathD}
                    stroke={color}
                    strokeWidth={STROKE}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${arcLength} ${arcLength}`}
                    animatedProps={animatedProps}
                />
            </Svg>
        </View>
    );
}

export function CardioSummaryWidget() {
    const { theme } = useTheme();
    const { history } = useWorkoutHistory();

    // Internal Stats calculation
    const internalStats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toDateString();
        
        // This Week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        let todayDist = 0, todayTime = 0;
        let weekDist = 0, weekTime = 0;

        history.forEach(workout => {
            const d = new Date(workout.date);
            
            // Apenas exercícios com a categoria 'cardio' definida explicitamente
            const cardioExercises = workout.exercises.filter(ex => 
                ex.body_parts && Array.isArray(ex.body_parts) && ex.body_parts.some((p: string) => p.toLowerCase() === 'cardio')
            );

            if (cardioExercises.length > 0) {
                let sessionDist = 0;
                let sessionTime = 0;

                cardioExercises.forEach(ex => {
                    ex.sets.forEach(set => {
                        // set.reps is used for distance, set.kg is used for time
                        sessionDist += (parseFloat(String(set.reps)) || 0);
                        
                        let timeStr = String(set.kg || "0");
                        let timeNum = 0;
                        if (timeStr.includes(':')) {
                            const parts = timeStr.split(':').map(Number);
                            if (parts.length === 2) {
                                timeNum = parts[0] + parts[1] / 60; // MM:SS -> minutos
                            } else if (parts.length === 3) {
                                timeNum = parts[0] * 60 + parts[1] + parts[2] / 60; // HH:MM:SS -> minutos
                            }
                        } else {
                            timeNum = parseFloat(timeStr) || 0;
                        }
                        sessionTime += timeNum;
                    });
                });

                // Week
                if (d.getTime() >= startOfWeek.getTime()) {
                    weekDist += sessionDist;
                    weekTime += sessionTime;
                }

                // Today
                if (d.toDateString() === todayStr) {
                    todayDist += sessionDist;
                    todayTime += sessionTime;
                }
            }
        });

        return {
            today: { dist: todayDist, time: todayTime },
            week: { dist: weekDist, time: weekTime },
        };
    }, [history]);

    // Target: 150 min por semana
    const WEEKLY_GOAL_MINS = 150;
    const progressValue = internalStats.week.time / WEEKLY_GOAL_MINS;

    const trackColor = theme.mode === 'dark' ? '#3B82F6' : theme.colors.border;

    return (
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
            <View style={{ 
                backgroundColor: theme.colors.card, 
                borderRadius: 24, 
                padding: 24, 
                borderWidth: 1, 
                borderColor: theme.colors.cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: theme.mode === 'dark' ? 0 : 0.05,
                shadowRadius: 12,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>Cardio</Text>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }} />
                        </View>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 16 }}>
                            Tempo de cardio na semana
                        </Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>
                                {internalStats.week.time.toFixed(0)}
                            </Text>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: '700' }}>min</Text>
                        </View>
                    </View>
                    
                    <View style={{ alignItems: 'center' }}>
                        <SemiCircle progress={progressValue} color={theme.colors.primary} trackColor={trackColor} />
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '800', marginTop: 4 }}>
                            {Math.min(Math.round(progressValue * 100), 100)}% da Meta
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
