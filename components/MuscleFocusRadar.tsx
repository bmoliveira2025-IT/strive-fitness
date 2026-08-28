import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Defs, G, Line, LinearGradient, Polygon, Stop, Svg, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';

const exercisesData = require('../assets/exercises.json');

const AXES = [
    { id: 'Chest', label: 'Peito' },
    { id: 'Shoulders', label: 'Ombros' },
    { id: 'Triceps', label: 'Tríceps' },
    { id: 'Biceps', label: 'Bíceps' },
    { id: 'Back', label: 'Costas' },
    { id: 'Glutes', label: 'Glúteos' },
    { id: 'Hamstrings', label: 'Posterior' },
    { id: 'Quadriceps', label: 'Quads' },
    { id: 'Calves', label: 'Pantur.' },
    { id: 'Abs', label: 'Abdômen' },
];

const BODY_PART_MAPPING: Record<string, string> = {
    'peito': 'Chest',
    'costas': 'Back',
    'ombros': 'Shoulders',
    'bíceps': 'Biceps',
    'tríceps': 'Triceps',
    'quadríceps': 'Quadriceps',
    'isquiotibiais': 'Hamstrings',
    'panturrilhas': 'Calves',
    'cintura': 'Abs',
    'abdômen': 'Abs',
    'glúteos': 'Glutes',
    'quadris': 'Glutes',
    'braços': 'Biceps',
    'antebraços': 'Biceps',
    'coxas': 'Quadriceps',
};

export function MuscleFocusRadar() {
    const { theme } = useTheme();
    const { history } = useWorkoutHistory();

    const data = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const recentHistory = history.filter(h => new Date(h.date) >= startOfMonth);

        const volumeMap: Record<string, number> = {};
        AXES.forEach(a => volumeMap[a.id] = 0);

        recentHistory.forEach(workout => {
            workout.exercises.forEach(exResult => {
                const def = exercisesData.find((e: any) => String(e.id) === String(exResult.id));
                if (def && def.body_parts && Array.isArray(def.body_parts)) {
                    const vol = exResult.sets.filter(s => s.reps > 0).length;
                    def.body_parts.forEach((part: string) => {
                        const key = BODY_PART_MAPPING[part.toLowerCase()];
                        if (key && volumeMap[key] !== undefined) volumeMap[key] += vol;
                    });
                }
            });
        });

        const maxVal = Math.max(...Object.values(volumeMap), 1);
        if (Object.values(volumeMap).every(v => v === 0)) {
            return AXES.map(axis => ({ ...axis, value: 0 }));
        }

        return AXES.map(axis => ({
            ...axis,
            value: (volumeMap[axis.id] || 0) / maxVal
        }));
    }, [history]);

    const SVG_SIZE = 350;
    const center = SVG_SIZE / 2;
    const chartRadius = 100;

    const getCoordinates = (value: number, index: number) => {
        const angle = (Math.PI * 2 * index) / AXES.length - Math.PI / 2;
        const x = center + Math.cos(angle) * (chartRadius * value);
        const y = center + Math.sin(angle) * (chartRadius * value);
        return { x, y };
    };

    const gridPoints = (level: number) => {
        return AXES.map((_, i) => {
            const { x, y } = getCoordinates(level, i);
            return `${x},${y}`;
        }).join(' ');
    };

    const dataPoints = data.map((d, i) => getCoordinates(d.value, i));
    const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <View style={{ backgroundColor: 'transparent', width: '100%', alignItems: 'center' }}>
            <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
                <Defs>
                    <LinearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.6" />
                        <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0.2" />
                    </LinearGradient>
                </Defs>
                <G>
                    {/* Concentric Grid Rings */}
                    {[0.25, 0.5, 0.75, 1].map((level, i) => (
                        <Polygon
                            key={i}
                            points={gridPoints(level)}
                            stroke={theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                            strokeWidth="1"
                            fill="none"
                        />
                    ))}

                    {/* Radial Axis Lines */}
                    {AXES.map((_, i) => {
                        const start = getCoordinates(0, i);
                        const end = getCoordinates(1, i);
                        return (
                            <Line
                                key={i}
                                x1={start.x} y1={start.y}
                                x2={end.x} y2={end.y}
                                stroke={theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Data Glow Background */}
                    <Polygon
                        points={dataPolygon}
                        fill={theme.colors.primary}
                        fillOpacity="0.1"
                        stroke={theme.colors.primary}
                        strokeWidth="8"
                        strokeOpacity="0.05"
                    />

                    {/* Main Data Polygon */}
                    <Polygon
                        points={dataPolygon}
                        fill="url(#radarGradient)"
                        stroke={theme.colors.primary}
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />

                    {/* Labels */}
                    {AXES.map((axis, i) => {
                        const { x, y } = getCoordinates(1.28, i);

                        let textAnchor: "start" | "middle" | "end" = "middle";
                        let dx = 0;
                        let dy = 0;

                        if (x > center + 20) {
                            textAnchor = "start";
                            dx = 5;
                        } else if (x < center - 20) {
                            textAnchor = "end";
                            dx = -5;
                        }

                        if (y < center - 40) dy = -5;
                        else if (y > center + 40) dy = 5;

                        return (
                            <SvgText
                                key={i}
                                x={x + dx}
                                y={y + dy}
                                fill={theme.colors.text}
                                fontSize="10"
                                fontWeight="800"
                                textAnchor={textAnchor}
                                alignmentBaseline="middle"
                                opacity={0.6}
                            >
                                {axis.label.toUpperCase()}
                            </SvgText>
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
}
