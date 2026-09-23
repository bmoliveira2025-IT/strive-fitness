import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MuscleGroupHeatmapWidget } from '../components/dashboard/MuscleGroupHeatmapWidget';
import { useTheme } from '../context/ThemeContext';

export default function MuscleAnalysisScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar para o início"
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="arrow-back" size={23} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700' }}>Análise muscular</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Carga, recuperação e grupos ativados</Text>
      </View>
    </View>
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
      <MuscleGroupHeatmapWidget />
    </ScrollView>
  </View>;
}
