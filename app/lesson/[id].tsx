import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COACHES } from '../../constants/coaches';
import { useTheme } from '../../context/ThemeContext';

export default function LessonScreen() {
  const { id, coachId } = useLocalSearchParams<{ id: string; coachId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const coach = COACHES.find(item => item.id === coachId);
  const lesson = coach?.lessons.find(item => item.id === id);

  if (!coach || !lesson) return <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: theme.colors.text }}>Guia não encontrado.</Text>
    <TouchableOpacity onPress={() => router.back()} style={{ padding: 16 }}><Text style={{ color: theme.colors.primary }}>Voltar</Text></TouchableOpacity>
  </View>;

  return <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
    <Stack.Screen options={{ headerShown: false }} />
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar aos guias" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Guia prático · {lesson.level}</Text>
      <Text style={{ color: theme.colors.text, fontSize: 27, fontWeight: '700', marginTop: 8, lineHeight: 33 }}>{lesson.title}</Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 12 }}>{lesson.summary}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
        <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{lesson.duration} · {coach.specialty}</Text>
      </View>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 26, marginBottom: 14 }}>Como aplicar</Text>
      {lesson.steps.map((step, index) => <View key={index} style={{ flexDirection: 'row', gap: 13, alignItems: 'flex-start', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: theme.colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}>{index + 1}</Text>
        </View>
        <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 21, flex: 1 }}>{step}</Text>
      </View>)}
      <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 20 }}>Conteúdo educativo geral. Ajuste o treino às suas condições e procure orientação profissional se sentir dor ou tiver restrições de saúde.</Text>
      <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 32, marginBottom: 10 }}>Continue aprendendo</Text>
      {coach.lessons.filter(item => item.id !== id).map(item => <TouchableOpacity key={item.id} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: item.id, coachId: coach.id } })}
        style={{ minHeight: 58, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: theme.colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center', marginRight: 11 }}><Ionicons name="book-outline" size={17} color={theme.colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>{item.title}</Text><Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>{item.level}</Text></View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </TouchableOpacity>)}
    </ScrollView>
  </View>;
}
