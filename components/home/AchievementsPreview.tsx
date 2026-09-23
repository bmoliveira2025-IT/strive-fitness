import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { useUserStore } from '../../store/useUserStore';
import { buildAchievements } from '../../utils/achievements';

export function AchievementsPreview() {
  const { theme } = useTheme();
  const router = useRouter();
  const { history } = useWorkoutHistory();
  const weeklyTarget = useUserStore(state => state.profile?.onboardingData?.daysPerWeek ?? 3);
  const achievements = useMemo(() => buildAchievements(history, weeklyTarget), [history, weeklyTarget]);
  const unlocked = achievements.filter(item => item.unlocked);
  const next = achievements.filter(item => !item.unlocked)
    .sort((a, b) => (b.current / b.target) - (a.current / a.target))[0];

  return <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Suas medalhas</Text>
      <TouchableOpacity onPress={() => router.push('/achievements')} accessibilityLabel="Ver todas as medalhas" style={{ paddingVertical: 8 }}>
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>Ver todas →</Text>
      </TouchableOpacity>
    </View>
    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 10 }}>{unlocked.length} de {achievements.length} conquistadas</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: next ? 12 : 0 }}>
      {unlocked.slice(-3).map(item => <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: theme.colors.primary + '1A' }}>
        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, fontSize: 11, fontWeight: '700' }}>{item.title}</Text>
      </View>)}
      {!unlocked.length && <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Sua primeira medalha começa com um treino.</Text>}
    </View>
    {next && <TouchableOpacity onPress={() => router.push('/achievements')} style={{ paddingVertical: 8 }}>
      <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>Próxima: {next.title}</Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}>{Math.min(next.current, next.target).toLocaleString()} / {next.target.toLocaleString()} · {next.description}</Text>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.colors.backgroundTertiary, marginTop: 8, overflow: 'hidden' }}>
        <View style={{ height: 4, width: `${Math.min(100, (next.current / next.target) * 100)}%`, backgroundColor: theme.colors.primary }} />
      </View>
    </TouchableOpacity>}
  </View>;
}
