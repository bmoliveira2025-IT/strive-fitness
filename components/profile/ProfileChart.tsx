import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Circle, Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutHistoryRecord } from '../../context/WorkoutHistoryContext';

const CHART_HEIGHT = 180;

type ChartType = 'duration' | 'volume' | 'workouts';

interface ProfileChartProps {
    history: WorkoutHistoryRecord[];
}

export function ProfileChart({ history }: ProfileChartProps) {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CHART_WIDTH = SCREEN_WIDTH - 40; // 20px padding each side
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<ChartType>('duration');

    const weekData = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        // 1. Pre-filter history to only this week in one pass
        const weekHistory = history.filter(h => {
            const hDate = new Date(h.date);
            return hDate >= startOfWeek;
        });

        // 2. Group by ISO string for O(1) lookup
        const historyByDay: Record<string, typeof weekHistory> = {};
        weekHistory.forEach(h => {
            const dayStr = h.date.split('T')[0];
            if (!historyByDay[dayStr]) historyByDay[dayStr] = [];
            historyByDay[dayStr].push(h);
        });

        // 3. Build days
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            const dayStr = d.toISOString().split('T')[0];
            const workouts = historyByDay[dayStr] || [];

            return {
                date: d,
                duration: workouts.reduce((acc, w) => acc + w.duration, 0) / 60, // Minutes
                volume: workouts.reduce((acc, w) => acc + w.totalVolume, 0), // Kg
                workouts: workouts.length
            };
        });
    }, [history]);

    const activeData = weekData.map(d => d[activeTab]);
    const totalValue = activeData.reduce((a, b) => a + b, 0);

    // Scaling
    const maxVal = Math.max(...activeData, 1);
    const minVal = 0;

    const points = activeData.map((val, index) => {
        const x = (index / 6) * CHART_WIDTH;
        const y = CHART_HEIGHT - ((val - minVal) / (maxVal - minVal)) * (CHART_HEIGHT * 0.8) - 20; // 20px bottom buffer
        return { x, y, val };
    });

    const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    // Area (close the path)
    const areaData = `${pathData} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

    const formatTotal = () => {
        if (activeTab === 'duration') {
            const h = Math.floor(totalValue / 60);
            const m = Math.floor(totalValue % 60);
            return `${h}h ${m}m`;
        }
        if (activeTab === 'volume') return `${(totalValue / 1000).toFixed(1)}t`;
        return `${totalValue} treinos`;
    };

    return (
        <View className="px-5 mb-8">
            <View className="mb-4">
                <Text style={{ color: theme.mode === 'dark' ? '#94a3b8' : theme.colors.textMuted }} className="font-bold text-sm uppercase tracking-wider">Esta semana</Text>
                <Text style={{ color: theme.colors.text }} className="text-3xl font-black">{formatTotal()}</Text>
            </View>

            {/* Chart */}
            <View style={{ height: CHART_HEIGHT }} className="mb-6 relative">
                {/* Grid Lines */}
                <View className="absolute inset-0 justify-between">
                    {[0, 1, 2].map(i => (
                        <View key={i} style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }} className="w-full h-px opacity-30" />
                    ))}
                </View>

                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                    <Defs>
                        <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    {/* Area */}
                    <Path d={areaData} fill="url(#gradient)" />

                    {/* Line */}
                    <Path d={pathData} fill="none" stroke={theme.colors.primary} strokeWidth="3.5" />

                    {/* Dots */}
                    {points.map((p, i) => (
                        // Show dot only if value > 0 or it's the last point
                        (p.val > 0 || i === 6) && (
                            <Circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill={theme.colors.primary}
                                stroke={theme.colors.background}
                                strokeWidth="2.5"
                            />
                        )
                    ))}
                </Svg>
            </View>

            {/* Tabs */}
            <View className="flex-row gap-2">
                {[
                    { id: 'duration', label: 'Duração', icon: 'time-outline' },
                    { id: 'volume', label: 'Volume', icon: 'bar-chart-outline' },
                    { id: 'workouts', label: 'Treinos', icon: 'fitness-outline' }
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as ChartType)}
                        style={{
                            borderColor: activeTab === tab.id ? theme.colors.primary : theme.colors.cardBorder,
                            backgroundColor: activeTab === tab.id ? theme.colors.primary + '20' : 'transparent',
                            borderWidth: 1
                        }}
                        className="px-4 py-2 rounded-full flex-row items-center"
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={16}
                            color={activeTab === tab.id ? (theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary) : theme.colors.textMuted}
                        />
                        <Text
                            style={{ color: activeTab === tab.id ? (theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary) : theme.colors.textMuted }}
                            className="text-xs font-bold ml-2"
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}
