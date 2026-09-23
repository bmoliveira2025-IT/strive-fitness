import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PROGRAMS } from '../../constants/programs';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';

export function PlanMotivationPreview() {
  const { theme } = useTheme();
  const router = useRouter();
  const profile = useUserStore(state => state.profile);
  const suggestions = useMemo(() => {
    const audience = profile?.gender === 'feminino' ? 'Mulheres' : profile?.gender === 'masculino' ? 'Homens' : 'Todos';
    const goal = profile?.objective === 'cutting' ? 'weight_loss' : profile?.objective === 'força' ? 'strength' : 'hypertrophy';
    return PROGRAMS.filter(program => program.audience === audience || program.audience === 'Todos')
      .sort((a, b) => Number(b.request.goal === goal) - Number(a.request.goal === goal)).slice(0, 2);
  }, [profile?.gender, profile?.objective]);

  return <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Planos para seguir evoluindo</Text>
      <TouchableOpacity onPress={() => router.push({ pathname: '/explore', params: { tab: 'Programas' } })} style={{ paddingVertical: 8 }}>
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>Explorar →</Text>
      </TouchableOpacity>
    </View>
    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8 }}>Modelos prontos; adapte frequência e exercícios ao seu ritmo.</Text>
    {suggestions.map(program => <TouchableOpacity key={program.id} onPress={() => router.push({ pathname: '/preview', params: { id: program.id, type: 'program' } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: program.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={program.icon} size={19} color={program.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{program.title}</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}>{program.days.length} treinos/semana · {program.request.split}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.textMuted} />
    </TouchableOpacity>)}
  </View>;
}
