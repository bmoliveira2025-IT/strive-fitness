import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';

const DAY_LABELS  = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DAY_SHORT   = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const BAR_MAX_H   = 72;
const BAR_MIN_H   = 4;

interface WeeklySummaryProps {
    stats: {
        current: {
            count: number;
            durationFormatted: string;
            volumeFormatted: string;
        };
        diff: {
            count: number;
            durationFormatted: string;
            volumeFormatted: string;
            isCountDown: boolean;
            isDurationDown: boolean;
            isVolumeDown: boolean;
        };
    };
    history: any[];
}

export function WeeklySummary({ stats, history }: WeeklySummaryProps) {
    const { theme } = useTheme();
    const { profile } = useUserStore();
    const router = useRouter();

    // ─── Daily data for the current week (Mon → Sun) ───
    const dailyData = useMemo(() => {
        const today = new Date();
        const dow = today.getDay();
        const daysFromMon = dow === 0 ? 6 : dow - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysFromMon);
        monday.setHours(0, 0, 0, 0);

        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            const dateStr = day.toDateString();
            const todayStr = new Date().toDateString();
            const workout = history.find(h => new Date(h.date).toDateString() === dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = day > new Date() && !isToday;
            return {
                label: DAY_SHORT[i],
                fullLabel: DAY_LABELS[i],
                dayNum: day.getDate(),
                workout,
                isToday,
                isFuture,
                volume: workout?.totalVolume || 0,
                duration: workout?.duration || 0,
            };
        });
    }, [history]);

    const maxVolume = useMemo(
        () => Math.max(...dailyData.map(d => d.volume), 1),
        [dailyData]
    );

    const trainedDays  = dailyData.filter(d => d.workout).length;
    const targetDays   = profile?.onboardingData?.daysPerWeek ?? 4;
    const goalProgress = Math.min(1, trainedDays / targetDays);
    const goalMet      = trainedDays >= targetDays;

    const formatVolDisplay = (v: number) => {
        if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
        return `${Math.round(v)}kg`;
    };

    const metrics = [
        {
            icon: 'barbell-outline' as const,
            label: 'Treinos',
            value: String(stats.current.count),
            subValue: stats.diff.count === 0 ? '=' : `${stats.diff.count > 0 ? '+' : ''}${stats.diff.count}`,
            isDown: stats.diff.isCountDown,
            color: theme.colors.primary,
        },
        {
            icon: 'time-outline' as const,
            label: 'Tempo',
            value: stats.current.durationFormatted,
            subValue: stats.diff.isDurationDown ? `-${stats.diff.durationFormatted}` : `+${stats.diff.durationFormatted}`,
            isDown: stats.diff.isDurationDown,
            color: '#4F8FF7',
        },
        {
            icon: 'trending-up-outline' as const,
            label: 'Volume',
            value: stats.current.volumeFormatted,
            subValue: stats.diff.isVolumeDown ? `-${stats.diff.volumeFormatted}` : `+${stats.diff.volumeFormatted}`,
            isDown: stats.diff.isVolumeDown,
            color: '#10B981',
        },
    ];

    return (
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>

            {/* ── Header ── */}
            <Animated.View
                entering={FadeInDown.delay(60).springify()}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}
            >
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{
                        color: theme.colors.text,
                        fontSize: 22,
                        fontWeight: '900',
                        letterSpacing: -0.5,
                    }}>
                        Evolução Semanal
                    </Text>
                    <Text style={{
                        color: theme.colors.textSecondary,
                        fontSize: 10,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 1.2,
                        marginTop: 2,
                    }}>
                        Performance desta semana
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/progress')}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: theme.colors.primary + '18',
                        borderWidth: 1,
                        borderColor: theme.colors.primary + '35',
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                    }}
                >
                    <Ionicons name="analytics-outline" size={15} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                    <Text style={{
                        color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary,
                        fontSize: 10,
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                    }}>
                        Ver mais
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Main Card ── */}
            <Animated.View
                entering={FadeInDown.delay(120).springify()}
                style={{
                    backgroundColor: theme.colors.card,
                    borderRadius: 28,
                    borderWidth: 1.5,
                    borderColor: theme.colors.cardBorder,
                    overflow: 'hidden',
                }}
            >
                {/* Weekly goal progress bar at top */}
                <View style={{ height: 3, backgroundColor: theme.colors.backgroundTertiary }}>
                    <View style={{
                        height: '100%',
                        width: `${goalProgress * 100}%`,
                        backgroundColor: goalMet ? '#22C55E' : theme.colors.primary,
                    }} />
                </View>

                <View style={{ padding: 20 }}>

                    {/* Goal label */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Frequência Semanal
                        </Text>
                        <View style={{
                            backgroundColor: goalMet ? '#22C55E18' : theme.colors.primary + '18',
                            paddingHorizontal: 10, paddingVertical: 4,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: goalMet ? '#22C55E35' : theme.colors.primary + '35',
                        }}>
                            <Text style={{
                                color: goalMet ? '#22C55E' : theme.colors.primary,
                                fontSize: 11, fontWeight: '900',
                            }}>
                                {trainedDays}/{targetDays} dias {goalMet ? '✓' : ''}
                            </Text>
                        </View>
                    </View>

                    {/* ── Daily Bar Chart ── */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_MAX_H + 50, gap: 4, marginBottom: 8 }}>
                        {dailyData.map((day, i) => {
                            const hasWorkout = !!day.workout;
                            const barH = hasWorkout
                                ? Math.max(BAR_MIN_H + 8, (day.volume / maxVolume) * BAR_MAX_H)
                                : BAR_MIN_H;

                            const barColor = day.isToday
                                ? theme.colors.primary
                                : hasWorkout
                                    ? theme.colors.primary + 'CC'
                                    : 'transparent';
                            const borderColor = day.isToday && !hasWorkout
                                ? theme.colors.primary
                                : day.isFuture
                                    ? theme.colors.border + '60'
                                    : 'transparent';

                            return (
                                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {/* Volume label above bar */}
                                    <Text style={{
                                        color: hasWorkout
                                            ? (day.isToday ? theme.colors.primary : theme.colors.textSecondary)
                                            : 'transparent',
                                        fontSize: 7,
                                        fontWeight: '900',
                                        marginBottom: 3,
                                        textAlign: 'center',
                                    }}>
                                        {hasWorkout ? formatVolDisplay(day.volume) : ' '}
                                    </Text>

                                    {/* Bar */}
                                    <View style={{
                                        width: '100%',
                                        height: barH,
                                        backgroundColor: barColor,
                                        borderTopLeftRadius: 6,
                                        borderTopRightRadius: 6,
                                        borderBottomLeftRadius: 2,
                                        borderBottomRightRadius: 2,
                                        borderWidth: (day.isToday && !hasWorkout) || day.isFuture ? 1.5 : 0,
                                        borderColor,
                                        borderStyle: day.isFuture ? 'dashed' : 'solid',
                                        marginBottom: 8,
                                        opacity: day.isFuture ? 0.4 : 1,
                                    }} />

                                    {/* Checkmark or day label */}
                                    {hasWorkout ? (
                                        <View style={{
                                            width: 20, height: 20, borderRadius: 10,
                                            backgroundColor: day.isToday ? theme.colors.primary : theme.colors.primary + '25',
                                            alignItems: 'center', justifyContent: 'center',
                                            marginBottom: 4,
                                        }}>
                                            <Ionicons name="checkmark" size={12} color={day.isToday ? '#000' : theme.colors.primary} />
                                        </View>
                                    ) : (
                                        <View style={{
                                            width: 20, height: 20,
                                            alignItems: 'center', justifyContent: 'center',
                                            marginBottom: 4,
                                        }}>
                                            {day.isToday && (
                                                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.primary }} />
                                            )}
                                        </View>
                                    )}

                                    {/* Day letter */}
                                    <Text style={{
                                        color: day.isToday
                                            ? theme.colors.primary
                                            : hasWorkout
                                                ? theme.colors.textSecondary
                                                : theme.colors.textMuted,
                                        fontSize: 9,
                                        fontWeight: day.isToday ? '900' : '700',
                                        textAlign: 'center',
                                    }}>
                                        {day.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* ── Divider ── */}
                    <View style={{ height: 1, backgroundColor: theme.colors.border + '30', marginBottom: 16 }} />

                    {/* ── Metric chips ── */}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {metrics.map((m, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeInUp.delay(200 + i * 80).springify()}
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 18,
                                    padding: 12,
                                    borderWidth: 1,
                                    borderColor: theme.colors.cardBorder,
                                    alignItems: 'flex-start',
                                }}
                            >
                                {/* Icon */}
                                <View style={{
                                    backgroundColor: m.color + '18',
                                    width: 28, height: 28, borderRadius: 9,
                                    alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 8,
                                }}>
                                    <Ionicons name={m.icon} size={14} color={m.color} />
                                </View>

                                {/* Value */}
                                <Text
                                    style={{
                                        color: theme.colors.text,
                                        fontSize: 16,
                                        fontWeight: '900',
                                        letterSpacing: -0.3,
                                    }}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {m.value}
                                </Text>

                                {/* Label */}
                                <Text style={{
                                    color: theme.colors.textMuted,
                                    fontSize: 9,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.4,
                                    marginTop: 2,
                                }}>
                                    {m.label}
                                </Text>

                                {/* Trend vs last week */}
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 2,
                                    marginTop: 6,
                                    backgroundColor: (m.isDown ? '#EF444415' : '#22C55E15'),
                                    borderRadius: 7,
                                    paddingHorizontal: 5, paddingVertical: 2,
                                }}>
                                    <Ionicons
                                        name={m.isDown ? 'trending-down' : 'trending-up'}
                                        size={9}
                                        color={m.isDown ? '#EF4444' : '#22C55E'}
                                    />
                                    <Text style={{
                                        color: m.isDown ? '#EF4444' : '#22C55E',
                                        fontSize: 8,
                                        fontWeight: '800',
                                    }}>
                                        {m.subValue}
                                    </Text>
                                </View>
                            </Animated.View>
                        ))}
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}
