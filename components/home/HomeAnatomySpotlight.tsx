import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { getActivatedMuscles, TRACKED_MUSCLES } from '../../services/muscleActivation';
import { AnatomicalMuscleBody, type MuscleColorMap } from '../dashboard/AnatomicalMuscleBody';

/** Lightweight home summary; mount the full analytics widget only on demand. */
export function HomeAnatomySpotlight() {
  const { theme } = useTheme();
  const router = useRouter();
  const { history } = useWorkoutHistory();
  const [side, setSide] = useState<'Front' | 'Back'>('Front');
  const [selected, setSelected] = useState<string | null>(null);

  const { colors, activeCount, sessions } = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recent = history.filter(record => Date.parse(record.date) >= sevenDaysAgo);
    const counts = new Map<string, number>();
    for (const record of recent) for (const exercise of record.exercises || []) {
      for (const muscle of getActivatedMuscles(exercise)) counts.set(muscle, (counts.get(muscle) || 0) + 1);
    }
    const colors: MuscleColorMap = {};
    for (const muscle of TRACKED_MUSCLES) if (counts.has(muscle)) colors[muscle] = theme.colors.primary;
    return { colors, activeCount: counts.size, sessions: recent.length };
  }, [history, theme.colors.primary]);

  return <View style={{ marginBottom: 22 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <View>
        <Text style={{ color: theme.colors.text, fontSize: 19, fontWeight: '700' }}>Seu corpo em evolução</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 }}>Toque no corpo para explorar seus músculos</Text>
      </View>
      <Ionicons name="body-outline" size={22} color={theme.colors.primary} />
    </View>
    <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <AnatomicalMuscleBody viewSide={side} onToggleSide={() => setSide(value => value === 'Front' ? 'Back' : 'Front')}
          onSelectMuscle={setSelected} selectedMuscle={selected} colors={colors} width={190} height={280} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
        <View>
          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }}>{selected || `${activeCount} grupos ativados`}</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}>{sessions} {sessions === 1 ? 'treino' : 'treinos'} nos últimos 7 dias</Text>
        </View>
        <TouchableOpacity onPress={() => setSide(value => value === 'Front' ? 'Back' : 'Front')} accessibilityLabel="Girar corpo anatômico" style={{ padding: 9 }}>
          <Ionicons name="sync-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
    <TouchableOpacity onPress={() => router.push('/muscle-analysis')} style={{ alignSelf: 'flex-start', paddingVertical: 10 }}>
      <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>Ver análise muscular completa →</Text>
    </TouchableOpacity>
  </View>;
}
