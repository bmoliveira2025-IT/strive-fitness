import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { useWindowDimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUserStore } from '../store/useUserStore';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { useAIAdvisor } from '../hooks/useAIAdvisor';
import { AIInsightCard } from './ai-advisor/AIInsightCard';
import { MuscleFocusRadar } from './MuscleFocusRadar';

const RANGE_LABELS = {
    'W': 'Semana',
    'M': 'Mês',
    'T': 'Total'
};

interface ProgressOverviewProps {
    setShowWeightModal: (show: boolean) => void;
    selectedRange: 'W' | 'M' | 'T';
    setSelectedRange: (range: 'W' | 'M' | 'T') => void;
    summaryStats: {
        count: number;
        duration: string;
        frequency: string;
        volume: number;
        label: string;
    };
    consistency: {
        currentMonthCount: number;
        percentage: number;
    };
}

export function ProgressOverviewView({
    setShowWeightModal,
    selectedRange,
    setSelectedRange,
    summaryStats,
    consistency
}: ProgressOverviewProps) {
    const { width: screenWidth } = useWindowDimensions();
    const { theme } = useTheme();
    const { history } = useWorkoutHistory();
    const { profile } = useUserStore();
    const { strengthInsights, weeklyAssessment, healthInsights } = useAIAdvisor();

    const [showAllEvolution, setShowAllEvolution] = useState(false);

    // ─── Real weekly volume (last 7 weeks) ───
    const weeklyVolumeData = useMemo(() => {
        const now = new Date();
        const weeks = [];

        for (let i = 6; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - i * 7);
            weekEnd.setHours(23, 59, 59, 999);
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekEnd.getDate() - 6);
            weekStart.setHours(0, 0, 0, 0);

            const weekHistory = history.filter(h => {
                const d = new Date(h.date);
                return d >= weekStart && d <= weekEnd;
            });

            const vol = weekHistory.reduce((acc, h) => acc + (h.totalVolume || 0), 0);

            weeks.push({
                volume: Math.round(vol / 1000 * 10) / 10,
                workoutCount: weekHistory.length,
                label: i === 0 ? 'Agora' : `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
                isCurrent: i === 0,
            });
        }

        return weeks;
    }, [history]);

    // ─── Weekly volume stats ───
    const weeklyVolumeStats = useMemo(() => {
        const vols = weeklyVolumeData.map(w => w.volume);
        const maxVol = Math.max(...vols, 0.1);
        const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
        const bestIdx = vols.reduce((best, v, i) => v > vols[best] ? i : best, 0);
        const current = weeklyVolumeData[weeklyVolumeData.length - 1];
        const prev = weeklyVolumeData[weeklyVolumeData.length - 2];
        const changeRaw = (prev && prev.volume > 0)
            ? ((current.volume - prev.volume) / prev.volume) * 100
            : 0;
        const changePct = Math.round(changeRaw);
        return { maxVol, avgVol, bestIdx, current, prev, changePct };
    }, [weeklyVolumeData]);

    // ─── Load Evolution for top exercises ───
    const loadEvolution = useMemo(() => {
        const exerciseHistory: Record<string, number[]> = {};

        [...history].reverse().forEach(workout => {
            workout.exercises.forEach(ex => {
                const maxWeight = Math.max(...ex.sets.map(s => s.kg));
                if (maxWeight > 0) {
                    if (!exerciseHistory[ex.name]) exerciseHistory[ex.name] = [];
                    exerciseHistory[ex.name].push(maxWeight);
                }
            });
        });

        return Object.entries(exerciseHistory)
            .map(([name, weights]) => {
                if (weights.length < 2) return null;
                const latest = weights[weights.length - 1];
                const previous = weights[weights.length - 2];
                const diff = latest - previous;

                return {
                    name,
                    latest,
                    previous,
                    diff,
                    isUp: diff > 0,
                    history: weights
                };
            })
            .filter(e => e !== null)
            .sort((a, b) => (b!.latest || 0) - (a!.latest || 0));
    }, [history]);

    // ─── Weight Trend ───
    const weightTrend = useMemo(() => {
        if (!profile?.weightHistory || profile.weightHistory.length < 2) return null;

        const historySorted = [...profile.weightHistory].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const latest = historySorted[0].value;
        const previous = historySorted[1].value;
        const diff = latest - previous;

        return {
            diff: Math.abs(diff).toFixed(1),
            isDown: diff < 0
        };
    }, [profile?.weightHistory]);

    // ─── Weight Chart Data (real data from weightHistory) ───
    const weightChartData = useMemo(() => {
        if (!profile?.weightHistory || profile.weightHistory.length < 2) return null;

        const sorted = [...profile.weightHistory].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const recent = sorted.slice(-8); // Last 8 entries
        const labels = recent.map(w => {
            const d = new Date(w.date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        });
        const data = recent.map(w => w.value);

        return { labels, data };
    }, [profile?.weightHistory]);

    // ─── Training Heatmap: days trained this month ───
    const heatmapData = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get the day of week for the 1st (0=Sun, 6=Sat)
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const trainedDays = new Set(
            history
                .filter(h => {
                    const d = new Date(h.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                })
                .map(h => new Date(h.date).getDate())
        );

        return { daysInMonth, firstDayOfWeek, trainedDays, today: today.getDate() };
    }, [history]);

    // ─── Personal Records (top weight per exercise) ───
    const personalRecords = useMemo(() => {
        const maxWeights: Record<string, number> = {};

        history.forEach(workout => {
            workout.exercises.forEach(ex => {
                const maxW = Math.max(...ex.sets.map(s => s.kg));
                if (maxW > 0) {
                    if (!maxWeights[ex.name] || maxW > maxWeights[ex.name]) {
                        maxWeights[ex.name] = maxW;
                    }
                }
            });
        });

        return Object.entries(maxWeights)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, weight]) => ({ name, weight }));
    }, [history]);

    // ─── Achievements ───
    const achievements = useMemo(() => {
        const list: { title: string; value: string; icon: string; color: string; unlocked: boolean }[] = [];

        // Streak-based
        let streak = 0;
        const sortedDates = [...new Set(history.map(h => new Date(h.date).toISOString().split('T')[0]))].sort().reverse();
        if (sortedDates.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let checkDate = new Date(today);
            const lastTrainDate = new Date(sortedDates[0]);
            lastTrainDate.setHours(0, 0, 0, 0);

            // If last training was today or yesterday, start counting
            const diffDays = Math.floor((today.getTime() - lastTrainDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 1) {
                for (const dateStr of sortedDates) {
                    const d = new Date(dateStr);
                    d.setHours(0, 0, 0, 0);
                    if (d.getTime() === checkDate.getTime()) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else if (d.getTime() < checkDate.getTime()) {
                        break;
                    }
                }
            }
        }

        list.push({
            title: 'Sequência Atual',
            value: `${streak} dias`,
            icon: 'flame',
            color: '#FF9500',
            unlocked: streak >= 3
        });

        // Total workouts milestones
        const total = history.length;
        const milestones = [10, 25, 50, 100, 200, 500];
        const reached = milestones.filter(m => total >= m);
        const currentMilestone = reached.length > 0 ? reached[reached.length - 1] : 0;
        const nextMilestone = milestones.find(m => total < m) || milestones[milestones.length - 1];

        list.push({
            title: 'Treinos Concluídos',
            value: `${total}/${nextMilestone}`,
            icon: 'trophy',
            color: '#8B5CF6',
            unlocked: total >= 10
        });

        // Monthly consistency
        list.push({
            title: 'Consistência Mensal',
            value: `${consistency.percentage}%`,
            icon: 'calendar',
            color: '#10B981',
            unlocked: consistency.percentage >= 50
        });

        return list;
    }, [history, consistency]);

    // ─── Highlights ───
    const highlights = useMemo(() => {
        const list: { title: string, message: string, icon: string, color: string }[] = [];

        if (history.length > 1) {
            const lastWorkout = history[0];
            const increaseCount = loadEvolution.filter(e => e && e.isUp && lastWorkout.exercises.some(ex => ex.name === e.name)).length;
            if (increaseCount > 0) {
                list.push({
                    title: 'Força em Ascensão! 🚀',
                    message: `Você aumentou a carga em ${increaseCount} exercícios recentemente.`,
                    icon: 'barbell',
                    color: '#8B5CF6'
                });
            }
        }

        if (summaryStats.count >= 3 && selectedRange === 'W') {
            list.push({
                title: 'Consistência de Ferro 🔥',
                message: `Você completou ${summaryStats.count} treinos esta semana. Mantenha o foco!`,
                icon: 'flame',
                color: '#F59E0B'
            });
        }

        if (list.length === 0) {
            list.push({
                title: 'Continue Focado 🎯',
                message: 'Cada treino conta. A consistência é a chave para o resultado.',
                icon: 'paper-plane',
                color: '#10B981'
            });
        }

        return list;
    }, [history, summaryStats, selectedRange, loadEvolution]);

    // ─── Today Status ───
    const todayStatus = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const trainedToday = history.some(h => {
            const d = new Date(h.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });

        // Count workouts this week (Mon–Sun)
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        const workoutsThisWeek = new Set(
            history
                .filter(h => {
                    const d = new Date(h.date);
                    d.setHours(0, 0, 0, 0);
                    return d >= startOfWeek && d <= today;
                })
                .map(h => {
                    const d = new Date(h.date);
                    d.setHours(0, 0, 0, 0);
                    return d.toDateString();
                })
        ).size;

        const targetDays = profile?.onboardingData?.daysPerWeek ?? 3;
        const goalMet = workoutsThisWeek >= targetDays;

        // Days since last workout (excluding today)
        let daysSinceLast = 0;
        if (!trainedToday && history.length > 0) {
            const last = new Date(history[0].date);
            last.setHours(0, 0, 0, 0);
            daysSinceLast = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        }

        const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const now = new Date();
        const dateLabel = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]}`;

        return { trainedToday, workoutsThisWeek, targetDays, goalMet, daysSinceLast, dateLabel };
    }, [history, profile]);

    // ─── Summary card data ───
    const summaryCards = [
        { label: 'Treinos', value: String(summaryStats.count), sub: 'Concluídos', icon: 'flash', color: '#4F46E5' },
        { label: 'Tempo', value: summaryStats.duration, sub: 'Dedicados', icon: 'stopwatch', color: '#8B5CF6' },
        { label: 'Volume', value: `${(summaryStats.volume / 1000).toFixed(1)}T`, sub: 'Levantados', icon: 'barbell', color: '#10B981' },
        { label: 'Consistência', value: `${consistency.currentMonthCount}`, sub: `/${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} dias`, icon: 'flame', color: '#F59E0B' },
    ];

    // ─── Day names for heatmap ───
    const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
        <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            contentContainerStyle={{ paddingBottom: 160 }}
        >

            {/* ─── Today at a Glance ─── */}
            <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
                <View style={{
                    backgroundColor: theme.colors.card,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: todayStatus.trainedToday ? '#22C55E40' : theme.colors.cardBorder,
                    padding: 18,
                }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                                    Hoje
                                </Text>
                                <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', marginTop: 2 }}>
                                    {todayStatus.dateLabel}
                                </Text>
                            </View>

                            <View style={{
                                    backgroundColor: todayStatus.trainedToday ? '#22C55E18' : theme.colors.primary + '18',
                                    borderRadius: 12,
                                    paddingHorizontal: 12,
                                    paddingVertical: 7,
                                borderWidth: 1,
                                borderColor: todayStatus.trainedToday ? '#22C55E40' : theme.colors.primary + '40',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                            }}>
                                <Ionicons
                                    name={todayStatus.trainedToday ? 'checkmark-circle' : 'barbell-outline'}
                                    size={16}
                                    color={todayStatus.trainedToday ? '#168044' : (theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary)}
                                />
                                <Text style={{
                                    color: todayStatus.trainedToday ? '#168044' : (theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary),
                                    fontSize: 12,
                                    fontWeight: '900',
                                }}>
                                    {todayStatus.trainedToday ? 'Treino feito!' : 'Treinar hoje'}
                                </Text>
                            </View>
                        </View>

                        {/* Weekly goal progress */}
                        <View style={{ marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                                    Meta semanal
                                </Text>
                                <Text style={{
                                    color: todayStatus.goalMet ? '#22C55E' : theme.colors.text,
                                    fontSize: 13,
                                    fontWeight: '900',
                                }}>
                                    {todayStatus.workoutsThisWeek}/{todayStatus.targetDays} treinos
                                    {todayStatus.goalMet ? ' ✓' : ''}
                                </Text>
                            </View>
                            <View style={{ height: 6, backgroundColor: theme.colors.backgroundTertiary, borderRadius: 3, overflow: 'hidden' }}>
                                <View style={{
                                    height: '100%',
                                    width: `${Math.min(100, (todayStatus.workoutsThisWeek / todayStatus.targetDays) * 100)}%`,
                                    backgroundColor: todayStatus.goalMet ? '#22C55E' : theme.colors.primary,
                                    borderRadius: 3,
                                }} />
                            </View>
                        </View>

                        {/* Status message */}
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500', lineHeight: 18 }}>
                            {todayStatus.trainedToday
                                ? 'Excelente! Você já garantiu o treino de hoje. Continue assim!'
                                : todayStatus.daysSinceLast === 0
                                    ? 'Comece seu primeiro treino e inicie sua jornada!'
                                    : todayStatus.daysSinceLast === 1
                                        ? 'Você treinou ontem. Hora de mais um!'
                                        : `${todayStatus.daysSinceLast} dias sem treinar. Volte hoje e mantenha o ritmo!`
                            }
                        </Text>
                </View>
            </View>

            {/* ─── Range Selector ─── */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                <View
                    style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 16
                    }}
                    className="flex-row p-1.5"
                >
                    {(['W', 'M', 'T'] as const).map((r) => (
                        <TouchableOpacity
                            key={r}
                            onPress={() => setSelectedRange(r)}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: selectedRange === r ? theme.colors.primary : 'transparent',
                            }}
                            className="flex-1 py-3 rounded-2xl items-center justify-center"
                        >
                            <Text
                                style={{
                                    color: selectedRange === r ? theme.colors.onPrimary : theme.colors.textSecondary,
                                    fontWeight: selectedRange === r ? '800' : '600'
                                }}
                                className="text-[10px] uppercase tracking-widest"
                            >
                                {RANGE_LABELS[r]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* ─── 2×2 Summary Cards Grid ─── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {summaryCards.map((card, idx) => (
                        <View
                            key={idx}
                            style={{
                                width: (screenWidth - 52) / 2,
                                backgroundColor: theme.colors.card,
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor: theme.colors.cardBorder,
                                padding: 16,
                            }}
                        >
                            <View style={{
                                backgroundColor: card.color + '18',
                                width: 36, height: 36, borderRadius: 11,
                                alignItems: 'center', justifyContent: 'center',
                                marginBottom: 12
                            }}>
                                <Ionicons name={card.icon as any} size={19} color={card.color} />
                            </View>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700' }}>{card.label}</Text>
                            <Text style={{ color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.7, marginTop: 3 }}>{card.value}</Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '500', marginTop: 2 }}>{card.sub}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* ─── AI Coach Insights ─── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }}>Insights do treinador</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 2 }}>Análises objetivas da sua performance</Text>
                </View>
                {strengthInsights.map((insight, idx) => (
                    <AIInsightCard
                        key={idx}
                        index={idx}
                        type="pr"
                        title={`Novo recorde: ${insight.exerciseName}`}
                        description={`Peso subiu de ${insight.previousWeight}kg para ${insight.currentWeight}kg (+${insight.improvement}kg).`}
                        icon="trophy"
                        color={theme.colors.primary}
                    />
                ))}
                {weeklyAssessment.comparison.frequencyChange !== 0 && (
                    <AIInsightCard
                        type="tip"
                        title="Análise de Consistência"
                        description={weeklyAssessment.insight}
                        icon="pulse"
                        color="#4F8FF7"
                        index={strengthInsights.length}
                    />
                )}
            </View>

            {/* ─── Health & Vitality Insights ─── */}
            {healthInsights.length > 0 && (
                <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>Monitoramento de Saúde</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Biometria & Bem-estar</Text>
                    </View>
                    {healthInsights.map((insight, idx) => (
                        <AIInsightCard
                            key={idx}
                            index={idx}
                            type={insight.type === 'sleep' ? 'tip' : 'alert'}
                            title={insight.type === 'sleep' ? 'Qualidade do Sono' : 'Nível de Energia'}
                            description={insight.message}
                            icon={insight.icon}
                            color={insight.color}
                            badge={insight.value}
                        />
                    ))}
                </View>
            )}

            {/* ─── Weight Evolution Chart ─── */}
            {weightChartData && (
                <Animated.View entering={FadeInDown.delay(400).springify()} className="px-6 mb-8">
                    {/* Título fora do overflow:hidden */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={{ color: theme.colors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest">Evolução</Text>
                            <Text style={{ color: theme.colors.text }} className="text-lg font-black italic uppercase tracking-tighter">Peso Corporal</Text>
                        </View>
                        {weightTrend && (
                                <View style={{
                                    backgroundColor: weightTrend.isDown ? '#22C55E15' : '#F43F5E15',
                                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
                                    borderWidth: 1, borderColor: weightTrend.isDown ? '#22C55E30' : '#F43F5E30',
                                    flexDirection: 'row', alignItems: 'center'
                                }}>
                                    <Ionicons
                                        name={weightTrend.isDown ? 'trending-down' : 'trending-up'}
                                        size={14}
                                        color={weightTrend.isDown ? '#22C55E' : '#F43F5E'}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={{ color: weightTrend.isDown ? '#22C55E' : '#F43F5E', fontSize: 11, fontWeight: '900' }}>
                                        {weightTrend.isDown ? '-' : '+'}{weightTrend.diff}kg
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, borderRadius: 22, padding: 20, overflow: 'hidden' }}>
                        <LineChart
                            data={{
                                labels: weightChartData.labels,
                                datasets: [{ data: weightChartData.data, color: () => '#10B981', strokeWidth: 3 }]
                            }}
                            width={screenWidth - 88}
                            height={180}
                            yAxisSuffix="kg"
                            yAxisLabel=""
                            chartConfig={{
                                backgroundColor: theme.colors.card,
                                backgroundGradientFrom: theme.colors.card,
                                backgroundGradientTo: theme.colors.card,
                                decimalPlaces: 1,
                                color: () => '#10B981',
                                labelColor: () => theme.colors.textSecondary,
                                style: { borderRadius: 16 },
                                propsForDots: { r: '5', strokeWidth: '2', stroke: theme.colors.background },
                                propsForLabels: { fontSize: 9, fontWeight: '700' },
                                fillShadowGradient: '#10B981',
                                fillShadowGradientOpacity: 0.12
                            }}
                            bezier
                            withInnerLines={false}
                            withOuterLines={false}
                            style={{ borderRadius: 16, marginLeft: -8 }}
                        />
                        </View>
                </Animated.View>
            )}

            {/* ─── Training Heatmap Calendar ─── */}
            <Animated.View entering={FadeInDown.delay(500).springify()} className="px-6 mb-8">
                {/* Header fora do overflow:hidden para não cortar o título */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ color: theme.colors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest">
                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][new Date().getMonth()]} {new Date().getFullYear()}
                        </Text>
                        <Text style={{ color: theme.colors.text }} className="text-lg font-black italic uppercase tracking-tighter">Mapa de Treinos</Text>
                    </View>
                    <View style={{ backgroundColor: '#10B98115', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                        <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '900' }}>
                            {heatmapData.trainedDays.size} DIAS
                        </Text>
                    </View>
                </View>
                <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, borderRadius: 22, padding: 16, overflow: 'hidden' }}>

                    {/* Day headers */}
                    <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 2 }}>
                        {dayNames.map((d, i) => (
                            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '800' }}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 2 }}>
                        {/* Empty cells for offset */}
                        {Array.from({ length: heatmapData.firstDayOfWeek }).map((_, i) => (
                            <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }} />
                        ))}
                        {/* Day cells */}
                        {Array.from({ length: heatmapData.daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const trained = heatmapData.trainedDays.has(day);
                            const isToday = day === heatmapData.today;
                            const isPast = day < heatmapData.today;

                            return (
                                <View key={day} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                                    <View style={{
                                        flex: 1,
                                        borderRadius: 8,
                                        backgroundColor: trained
                                            ? '#10B981'
                                            : isPast
                                                ? theme.colors.backgroundTertiary
                                                : 'transparent',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: isToday ? 2 : 0,
                                        borderColor: isToday ? theme.colors.primary : 'transparent',
                                        opacity: trained ? 1 : isPast ? 0.4 : 0.2,
                                    }}>
                                        <Text style={{
                                            color: trained ? '#FFFFFF' : theme.colors.textSecondary,
                                            fontSize: 10,
                                            fontWeight: trained ? '900' : '600'
                                        }}>
                                            {day}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </Animated.View>

            {/* ─── Personal Records ─── */}
            {personalRecords.length > 0 && (
                <Animated.View entering={FadeInDown.delay(600).springify()} className="px-6 mb-8">
                    <Text style={{ color: theme.colors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest mb-1">Seus Melhores</Text>
                    <Text style={{ color: theme.colors.text, paddingRight: 6 }} className="text-lg font-black italic uppercase tracking-tighter mb-4">Recordes Pessoais</Text>

                    <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, borderRadius: 22, overflow: 'hidden' }}>
                        {personalRecords.map((rec, index) => {
                            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                            const isLast = index === personalRecords.length - 1;
                            return (
                                <View
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 16,
                                        paddingHorizontal: 20,
                                        borderBottomWidth: isLast ? 0 : 1,
                                        borderBottomColor: theme.colors.cardBorder,
                                    }}
                                >
                                    <Text style={{ fontSize: 20, marginRight: 14 }}>{medals[index]}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{rec.name}</Text>
                                    </View>
                                    <View style={{
                                        backgroundColor: theme.colors.primary + '15',
                                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
                                    }}>
                                        <Text style={{
                                            color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary,
                                            fontSize: 14, fontWeight: '900'
                                        }}>{rec.weight}kg</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Animated.View>
            )}

            {/* ─── Volume Semanal — Custom Bar Chart ─── */}
            <Animated.View entering={FadeInDown.delay(700).springify()} style={{ paddingHorizontal: 24, marginBottom: 32 }}>

                {/* Header + trend pill */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                            Evolução
                        </Text>
                        <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 }}>
                            Volume Semanal
                        </Text>
                    </View>
                    <View style={{
                        backgroundColor: weeklyVolumeStats.changePct >= 0 ? '#22C55E18' : '#F43F5E18',
                        borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
                        borderWidth: 1, borderColor: weeklyVolumeStats.changePct >= 0 ? '#22C55E35' : '#F43F5E35',
                        flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
                    }}>
                        <Ionicons
                            name={weeklyVolumeStats.changePct >= 0 ? 'trending-up' : 'trending-down'}
                            size={16}
                            color={weeklyVolumeStats.changePct >= 0 ? '#22C55E' : '#F43F5E'}
                        />
                        <Text style={{
                            color: weeklyVolumeStats.changePct >= 0 ? '#22C55E' : '#F43F5E',
                            fontSize: 15, fontWeight: '900',
                        }}>
                            {weeklyVolumeStats.changePct >= 0 ? '+' : ''}{weeklyVolumeStats.changePct}%
                        </Text>
                    </View>
                </View>

                {/* Metrics strip — 3 chips */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    {/* Esta Semana */}
                    <View style={{
                        flex: 1, backgroundColor: theme.colors.card, borderRadius: 18,
                        padding: 14, borderWidth: 1.5, borderColor: theme.colors.primary + '30',
                    }}>
                        <View style={{
                            backgroundColor: theme.colors.primary + '20', width: 32, height: 32,
                            borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                        }}>
                            <Ionicons name="barbell" size={16} color={theme.colors.primary} />
                        </View>
                        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>
                            {weeklyVolumeStats.current.volume}
                            <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '700' }}>t</Text>
                        </Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 }}>
                            Esta Semana
                        </Text>
                    </View>

                    {/* Variação */}
                    <View style={{
                        flex: 1, backgroundColor: theme.colors.card, borderRadius: 18,
                        padding: 14, borderWidth: 1.5,
                        borderColor: weeklyVolumeStats.changePct >= 0 ? '#22C55E30' : '#F43F5E30',
                    }}>
                        <View style={{
                            backgroundColor: weeklyVolumeStats.changePct >= 0 ? '#22C55E20' : '#F43F5E20',
                            width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                        }}>
                            <Ionicons
                                name={weeklyVolumeStats.changePct >= 0 ? 'arrow-up' : 'arrow-down'}
                                size={16}
                                color={weeklyVolumeStats.changePct >= 0 ? '#22C55E' : '#F43F5E'}
                            />
                        </View>
                        <Text style={{
                            color: weeklyVolumeStats.changePct >= 0 ? '#22C55E' : '#F43F5E',
                            fontSize: 20, fontWeight: '900', letterSpacing: -0.5
                        }}>
                            {weeklyVolumeStats.changePct >= 0 ? '+' : ''}{weeklyVolumeStats.changePct}
                            <Text style={{ fontSize: 11, fontWeight: '700' }}>%</Text>
                        </Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 }}>
                            vs Sem. Ant.
                        </Text>
                    </View>

                    {/* Melhor Semana */}
                    <View style={{
                        flex: 1, backgroundColor: theme.colors.card, borderRadius: 18,
                        padding: 14, borderWidth: 1.5, borderColor: '#F59E0B30',
                    }}>
                        <View style={{
                            backgroundColor: '#F59E0B20', width: 32, height: 32,
                            borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                        }}>
                            <Ionicons name="trophy" size={16} color="#F59E0B" />
                        </View>
                        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>
                            {Math.max(...weeklyVolumeData.map(w => w.volume))}
                            <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '700' }}>t</Text>
                        </Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 }}>
                            Recorde
                        </Text>
                    </View>
                </View>

                {/* Bar chart card */}
                <View style={{
                    backgroundColor: theme.colors.card, borderRadius: 22,
                    borderWidth: 1.5, borderColor: theme.colors.cardBorder, padding: 20,
                }}>
                    <View style={{ position: 'relative' }}>
                        {/* Average reference line */}
                        {weeklyVolumeStats.maxVol > 0.1 && (
                            <View style={{
                                position: 'absolute', left: 0, right: 0, zIndex: 1,
                                bottom: 28 + (weeklyVolumeStats.avgVol / weeklyVolumeStats.maxVol) * 110,
                            }}>
                                <View style={{ height: 1, backgroundColor: theme.colors.textSecondary + '35', borderStyle: 'dashed' }} />
                                <View style={{
                                    position: 'absolute', right: 0, top: -8,
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
                                }}>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 7, fontWeight: '900', textTransform: 'uppercase' }}>
                                        MÉD
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Bars */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 5 }}>
                            {weeklyVolumeData.map((week, i) => {
                                const barH = Math.max(4, (week.volume / weeklyVolumeStats.maxVol) * 110);
                                const isBest = i === weeklyVolumeStats.bestIdx && week.volume > 0;
                                const barColor = week.isCurrent
                                    ? theme.colors.primary
                                    : isBest
                                        ? '#F59E0B'
                                        : theme.colors.primary + '38';

                                return (
                                    <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                                        {/* Crown for best week (when not current) */}
                                        {isBest && !week.isCurrent && (
                                            <Text style={{ fontSize: 10, marginBottom: 1 }}>👑</Text>
                                        )}
                                        {/* Value */}
                                        <Text style={{
                                            color: week.isCurrent
                                                ? theme.colors.primary
                                                : isBest ? '#F59E0B' : theme.colors.textMuted,
                                            fontSize: 7,
                                            fontWeight: '900',
                                            marginBottom: 4,
                                        }}>
                                            {week.volume > 0 ? `${week.volume}t` : ''}
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
                                            marginBottom: 6,
                                        }} />
                                        {/* Label */}
                                        <Text style={{
                                            color: week.isCurrent ? theme.colors.primary : theme.colors.textMuted,
                                            fontSize: week.isCurrent ? 8 : 7,
                                            fontWeight: week.isCurrent ? '900' : '700',
                                            textAlign: 'center',
                                        }}>
                                            {week.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Legend */}
                    <View style={{
                        marginTop: 16, paddingTop: 14,
                        borderTopWidth: 1, borderTopColor: theme.colors.border + '30',
                        flexDirection: 'row', justifyContent: 'center', gap: 20,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: theme.colors.primary }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700' }}>Semana atual</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#F59E0B' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700' }}>Melhor semana</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 18, height: 1, backgroundColor: theme.colors.textSecondary + '50' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700' }}>Média</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* ─── Load Evolution Cards ─── */}
            <View className="px-6 mb-8">
                <View className="flex-row items-center justify-between mb-4">
                    <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ color: theme.colors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest">Progressão</Text>
                        <Text style={{ color: theme.colors.text }} className="text-lg font-black italic uppercase tracking-tighter">Evolução de Cargas</Text>
                    </View>
                    {loadEvolution.length > 3 && (
                        <TouchableOpacity
                            onPress={() => setShowAllEvolution(!showAllEvolution)}
                            style={{ backgroundColor: theme.colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.cardBorder }}
                        >
                            <Text style={{ color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary }} className="text-[10px] font-black uppercase tracking-widest">
                                {showAllEvolution ? 'Recolher' : 'Ver Tudo'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ gap: 10 }}>
                    {loadEvolution.slice(0, showAllEvolution ? undefined : 3).map((ex, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(800 + index * 80).springify()}
                            style={{
                                backgroundColor: theme.colors.card,
                                borderColor: theme.colors.cardBorder,
                                borderWidth: 1.5,
                                borderRadius: 20,
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                overflow: 'hidden'
                            }}
                        >
                            <LinearGradient
                                colors={[`${theme.colors.primary}08`, 'transparent']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            />
                            <View className="flex-row items-center flex-1">
                                <View style={{ backgroundColor: theme.colors.primary + '15', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Ionicons name="barbell" size={20} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{ex!.name}</Text>
                                    <View className="flex-row items-center mt-0.5">
                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Recorde: </Text>
                                        <Text style={{ color: theme.colors.text, fontSize: 11, fontWeight: '900' }}>{ex!.latest}kg</Text>
                                    </View>
                                </View>
                            </View>
                            <View className="items-end">
                                <View
                                    style={{
                                        backgroundColor: ex!.isUp ? '#22C55E15' : theme.colors.backgroundTertiary,
                                        borderColor: ex!.isUp ? '#22C55E40' : theme.colors.cardBorder,
                                        borderWidth: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 12,
                                    }}
                                >
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' }}>{ex!.previous}kg</Text>
                                    <Ionicons name="arrow-forward" size={10} color={theme.colors.textMuted} style={{ marginHorizontal: 5 }} />
                                    <Text style={{ color: ex!.isUp ? '#22C55E' : theme.colors.text, fontSize: 14, fontWeight: '900' }}>
                                        {ex!.latest}kg
                                    </Text>
                                </View>
                                {ex!.isUp && (
                                    <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 }} />
                                        <Text style={{ color: '#22C55E', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>+{ex!.diff}kg</Text>
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    ))}
                    {loadEvolution.length === 0 && (
                        <View style={{ backgroundColor: theme.colors.card + '50', borderRadius: 20, padding: 32, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: theme.colors.cardBorder }}>
                            <Ionicons name="flash-off" size={28} color={theme.colors.textMuted} />
                            <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 12, fontSize: 11, fontWeight: '700', fontStyle: 'italic' }}>
                                Continue treinando para gerar dados de evolução
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* ─── Achievements / Conquistas ─── */}
            <Animated.View entering={FadeInDown.delay(900).springify()} className="px-6 mb-8">
                <Text style={{ color: theme.colors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest mb-1">Motivação</Text>
                <Text style={{ color: theme.colors.text, paddingRight: 6 }} className="text-lg font-black italic uppercase tracking-tighter mb-4">Conquistas</Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {achievements.map((ach, idx) => (
                        <View
                            key={idx}
                            style={{
                                flex: 1,
                                backgroundColor: theme.colors.card,
                                borderColor: ach.unlocked ? ach.color + '40' : theme.colors.cardBorder,
                                borderWidth: 1.5,
                                borderRadius: 20,
                                padding: 16,
                                alignItems: 'center',
                                overflow: 'hidden',
                                opacity: ach.unlocked ? 1 : 0.5,
                            }}
                        >
                            {ach.unlocked && (
                                <LinearGradient
                                    colors={[ach.color + '15', 'transparent']}
                                    start={{ x: 0.5, y: 0 }}
                                    end={{ x: 0.5, y: 1 }}
                                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                />
                            )}
                            <View style={{
                                backgroundColor: ach.color + '20',
                                width: 40, height: 40, borderRadius: 14,
                                alignItems: 'center', justifyContent: 'center',
                                marginBottom: 10
                            }}>
                                <Ionicons name={ach.icon as any} size={20} color={ach.color} />
                            </View>
                            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900', marginBottom: 2 }}>{ach.value}</Text>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>{ach.title}</Text>
                        </View>
                    ))}
                </View>
            </Animated.View>

            {/* ─── Muscle Focus Radar ─── */}
            <Animated.View entering={FadeInDown.delay(1000).springify()} className="px-6 mb-8">
                <View
                    style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5 }}
                    className="rounded-[22px] p-6 overflow-hidden items-center"
                >
                    <View className="w-full mb-6">
                        <Text style={{ color: theme.colors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest mb-1">Análise</Text>
                        <Text style={{ color: theme.colors.text, paddingRight: 6 }} className="text-lg font-black italic uppercase tracking-tighter">Equilíbrio Muscular</Text>
                    </View>
                    <MuscleFocusRadar />
                </View>
            </Animated.View>

            {/* ─── Consistency + Weight Boxes ─── */}
            <View className="px-6 mb-12 flex-row" style={{ gap: 12 }}>
                {/* Consistency Box */}
                <Animated.View
                    entering={FadeInDown.delay(1100).springify()}
                    style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, height: 180, flex: 1, borderRadius: 22, overflow: 'hidden' }}
                >
                    <View style={{ padding: 20, flex: 1, justifyContent: 'space-between' }}>
                        <LinearGradient
                            colors={['#F59E0B10', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View>
                            <View style={{ backgroundColor: '#F59E0B20', width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <Ionicons name="flame" size={20} color="#F59E0B" />
                            </View>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Consistência</Text>
                            <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -1, marginTop: 2 }}>
                                {consistency.currentMonthCount}<Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>/30</Text>
                            </Text>
                        </View>
                        <View style={{ backgroundColor: theme.colors.backgroundTertiary, height: 5, borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{ backgroundColor: '#F59E0B', width: `${consistency.percentage}%`, height: '100%', borderRadius: 3 }} />
                        </View>
                    </View>
                </Animated.View>

                {/* Weight Box */}
                <Animated.View
                    entering={FadeInDown.delay(1150).springify()}
                    style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1.5, height: 180, flex: 1, borderRadius: 22, overflow: 'hidden' }}
                >
                    <TouchableOpacity
                        onPress={() => setShowWeightModal(true)}
                        activeOpacity={0.8}
                        style={{ padding: 20, flex: 1, justifyContent: 'space-between' }}
                    >
                        <LinearGradient
                            colors={['#10B98110', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ backgroundColor: '#10B98120', width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Ionicons name="scale" size={20} color="#10B981" />
                                </View>
                                {weightTrend && (
                                    <View style={{ backgroundColor: weightTrend.isDown ? '#22C55E15' : '#F43F5E15', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: weightTrend.isDown ? '#22C55E30' : '#F43F5E30' }}>
                                        <Text style={{ color: weightTrend.isDown ? '#22C55E' : '#F43F5E', fontSize: 9, fontWeight: '900' }}>
                                            {weightTrend.isDown ? '-' : '+'}{weightTrend.diff}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Peso Atual</Text>
                            <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -1, marginTop: 2 }}>
                                {profile?.weight || '--'}<Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>kg</Text>
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end' }}>
                            <Text style={{ color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 }}>Atualizar</Text>
                            <Ionicons name="chevron-forward" size={10} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </View>

        </ScrollView>
    );
}
