import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { memo, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AchievementBadge } from '../components/profile/AchievementBadge';
import { useTheme } from '../context/ThemeContext';
import { useUserStore } from '../store/useUserStore';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { Achievement, buildAchievements, getGoalMotivation } from '../utils/achievements';

type Filter = 'all' | 'unlocked' | 'locked';

const AchievementCard = memo(function AchievementCard({ achievement, width }: { achievement: Achievement; width: number }) {
    const { theme } = useTheme();
    const percentage = Math.min(100, Math.round((achievement.current / achievement.target) * 100));

    return (
        <View style={{ width, backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 }}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <AchievementBadge icon={achievement.icon} type={achievement.tier} size={66} locked={!achievement.unlocked} />
            </View>
            <Text style={{ color: achievement.unlocked ? theme.colors.text : theme.colors.textSecondary, fontSize: 14, fontWeight: '800', textAlign: 'center' }} numberOfLines={1}>
                {achievement.title}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: 4, minHeight: 30 }} numberOfLines={2}>
                {achievement.description}
            </Text>
            <View style={{ height: 5, backgroundColor: theme.colors.backgroundTertiary, borderRadius: 3, overflow: 'hidden', marginTop: 12 }}>
                <View style={{ height: '100%', width: `${percentage}%`, backgroundColor: achievement.unlocked ? theme.colors.success : theme.colors.primary, borderRadius: 3 }} />
            </View>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 6 }}>
                {achievement.unlocked ? 'Conquistada' : `${Math.min(achievement.current, achievement.target).toLocaleString()} / ${achievement.target.toLocaleString()}`}
            </Text>
        </View>
    );
});

export default function AchievementsScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { history } = useWorkoutHistory();
    const { profile } = useUserStore();
    const [filter, setFilter] = useState<Filter>('all');
    const weeklyTarget = profile?.onboardingData?.daysPerWeek ?? 3;

    const achievements = useMemo(() => buildAchievements(history, weeklyTarget), [history, weeklyTarget]);
    const motivation = useMemo(() => getGoalMotivation(history, weeklyTarget), [history, weeklyTarget]);
    const filtered = useMemo(() => achievements.filter(item => {
        if (filter === 'unlocked') return item.unlocked;
        if (filter === 'locked') return !item.unlocked;
        return true;
    }), [achievements, filter]);
    const unlocked = achievements.filter(item => item.unlocked).length;
    const cardWidth = (width - 52) / 2;

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
            <FlashList
                data={filtered}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 20) + 24 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <AchievementCard achievement={item} width={cardWidth} />}
                ListHeaderComponent={
                    <View style={{ paddingTop: insets.top + 12, paddingBottom: 18 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
                            </TouchableOpacity>
                            <View style={{ marginLeft: 14 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>Conquistas</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>Metas e marcos da sua jornada</Text>
                            </View>
                        </View>

                        <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>Seu progresso</Text>
                                <Text style={{ color: theme.colors.primaryDark, fontSize: 14, fontWeight: '800' }}>{unlocked}/{achievements.length}</Text>
                            </View>
                            <View style={{ height: 7, backgroundColor: theme.colors.backgroundTertiary, borderRadius: 4, overflow: 'hidden' }}>
                                <View style={{ height: '100%', width: `${(unlocked / achievements.length) * 100}%`, backgroundColor: theme.colors.primary, borderRadius: 4 }} />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary + '14', borderColor: theme.colors.primary + '40', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16 }}>
                            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.primary + '25', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <Ionicons name={motivation.icon as any} size={20} color={theme.colors.primaryDark} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800' }}>{motivation.title}</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 2 }}>{motivation.message}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 4 }}>
                            {([{ id: 'all', label: 'Todas' }, { id: 'unlocked', label: 'Obtidas' }, { id: 'locked', label: 'Em progresso' }] as { id: Filter; label: string }[]).map(tab => (
                                <TouchableOpacity key={tab.id} onPress={() => setFilter(tab.id)} style={{ flex: 1, paddingVertical: 10, borderRadius: 11, backgroundColor: filter === tab.id ? theme.colors.primary : 'transparent', alignItems: 'center' }}>
                                    <Text style={{ color: filter === tab.id ? '#052E16' : theme.colors.textMuted, fontSize: 11, fontWeight: '800' }}>{tab.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>{filtered.length} medalhas</Text>
                    </View>
                }
            />
        </View>
    );
}
