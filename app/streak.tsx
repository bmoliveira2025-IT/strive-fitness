import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { ScrollView, Share, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const localDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const weekStart = (date: Date) => {
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay());
    result.setHours(0, 0, 0, 0);
    return result;
};

export default function StreakScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const { history } = useWorkoutHistory();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [currentMonth, setCurrentMonth] = useState(() => new Date());

    const streakData = useMemo(() => {
        const activeDays = new Set(history.map(item => localDateKey(new Date(item.date))));
        const activeWeeks = new Set([...activeDays].map(key => weekStart(new Date(`${key}T12:00:00`)).getTime()));
        const weeks = [...activeWeeks].sort((a, b) => a - b);

        let best = 0;
        let running = 0;
        let previous: number | null = null;
        weeks.forEach(week => {
            running = previous !== null && Math.round((week - previous) / 604_800_000) === 1 ? running + 1 : 1;
            best = Math.max(best, running);
            previous = week;
        });

        const thisWeek = weekStart(new Date()).getTime();
        const lastWeek = thisWeek - 604_800_000;
        let cursor = activeWeeks.has(thisWeek) ? thisWeek : activeWeeks.has(lastWeek) ? lastWeek : null;
        let current = 0;
        while (cursor !== null && activeWeeks.has(cursor)) {
            current += 1;
            cursor -= 604_800_000;
        }

        const workoutsThisMonth = history.filter(item => {
            const date = new Date(item.date);
            return date.getFullYear() === currentMonth.getFullYear() && date.getMonth() === currentMonth.getMonth();
        }).length;

        return { activeDays, current, best, workoutsThisMonth };
    }, [history, currentMonth]);

    const calendar = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const days: { day: number | null; trained?: boolean; today?: boolean }[] = Array.from({ length: firstDay }, () => ({ day: null }));
        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, month, day);
            days.push({ day, trained: streakData.activeDays.has(localDateKey(date)), today: localDateKey(date) === localDateKey(new Date()) });
        }
        while (days.length % 7 !== 0) days.push({ day: null });
        const title = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentMonth);
        return { days, title: title.charAt(0).toUpperCase() + title.slice(1) };
    }, [currentMonth, streakData.activeDays]);

    const motivation = streakData.current > 0
        ? `${streakData.current} ${streakData.current === 1 ? 'semana ativa' : 'semanas ativas'}. Continue treinando nesta semana para manter o ritmo.`
        : 'Conclua um treino nesta semana para iniciar uma nova sequência.';

    const changeMonth = (offset: number) => {
        setCurrentMonth(previous => new Date(previous.getFullYear(), previous.getMonth() + offset, 1));
    };

    const handleShare = () => Share.share({
        message: `Minha sequência no Strive: ${streakData.current} ${streakData.current === 1 ? 'semana ativa' : 'semanas ativas'} e melhor marca de ${streakData.best}. 💪`,
    });

    const horizontalPadding = 20;
    const calendarWidth = width - horizontalPadding * 2 - 32;
    const cellWidth = calendarWidth / 7;

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
            <View style={{ paddingTop: insets.top + 10, paddingHorizontal: horizontalPadding, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800' }}>Sequência</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 1 }}>Sua consistência ao longo do tempo</Text>
                </View>
                <TouchableOpacity onPress={handleShare} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="share-outline" size={21} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} removeClippedSubviews contentContainerStyle={{ padding: horizontalPadding, paddingBottom: Math.max(insets.bottom, 20) + 24 }}>
                <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: 22, padding: 20, marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: theme.colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                            <Ionicons name="flame" size={29} color={theme.colors.primaryDark} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Sequência atual</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 38, fontWeight: '800', letterSpacing: -1 }}>{streakData.current}</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600', marginLeft: 7 }}>{streakData.current === 1 ? 'semana' : 'semanas'}</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Melhor marca</Text>
                            <Text style={{ color: theme.colors.primaryDark, fontSize: 19, fontWeight: '800', marginTop: 2 }}>{streakData.best}</Text>
                        </View>
                    </View>
                    <View style={{ height: 1, backgroundColor: theme.colors.divider, marginVertical: 16 }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 }}>{motivation}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View style={{ flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 16, padding: 14 }}>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Treinos no mês</Text>
                        <Text style={{ color: theme.colors.text, fontSize: 23, fontWeight: '800', marginTop: 4 }}>{streakData.workoutsThisMonth}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 16, padding: 14 }}>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Dias registrados</Text>
                        <Text style={{ color: theme.colors.text, fontSize: 23, fontWeight: '800', marginTop: 4 }}>{streakData.activeDays.size}</Text>
                    </View>
                </View>

                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Calendário de treinos</Text>
                <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: 22, padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="chevron-back" size={19} color={theme.colors.text} />
                        </TouchableOpacity>
                        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800' }}>{calendar.title}</Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="chevron-forward" size={19} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                        {DAY_LABELS.map((label, index) => <Text key={`${label}-${index}`} style={{ width: cellWidth, color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' }}>{label}</Text>)}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {calendar.days.map((item, index) => (
                            <View key={index} style={{ width: cellWidth, height: 43, alignItems: 'center', justifyContent: 'center' }}>
                                {item.day !== null && (
                                    <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: item.trained ? theme.colors.primary : 'transparent', borderWidth: item.today && !item.trained ? 1 : 0, borderColor: theme.colors.primaryDark, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ color: item.trained ? '#052E16' : theme.colors.textSecondary, fontSize: 12, fontWeight: item.trained || item.today ? '800' : '600' }}>{item.day}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
