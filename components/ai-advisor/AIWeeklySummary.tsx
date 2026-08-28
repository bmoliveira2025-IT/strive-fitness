import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAIAdvisor } from '../../hooks/useAIAdvisor';

export function AIWeeklySummary() {
    const { theme } = useTheme();
    const { weeklyAssessment, fitnessScore } = useAIAdvisor();

    // Formatting numbers
    const formatVolume = (val: number) => {
        if (val >= 1000) return (val / 1000).toFixed(1) + 't';
        return val + 'kg';
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={{
                marginHorizontal: 20,
                marginBottom: 24,
                backgroundColor: theme.colors.card,
                borderRadius: 24,
                padding: 18,
                borderWidth: 1.5,
                borderColor: theme.colors.cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: theme.mode === 'light' ? 0.05 : 0.2,
                shadowRadius: 20,
                elevation: 4
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ backgroundColor: theme.colors.primary + '20', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
                    </View>
                    <View>
                        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Strive AI Coach</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Resumo da Semana</Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900' }}>{fitnessScore}</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>Fitness Score</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 18, alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{weeklyAssessment.workoutsCount}</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Treinos</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 18, alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '900' }}>{formatVolume(weeklyAssessment.totalVolume)}</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Volume</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 18, alignItems: 'center' }}>
                    <Text style={{
                        color: weeklyAssessment.comparison.volumeChange >= 0 ? theme.colors.primary : '#ef4444',
                        fontSize: 14, fontWeight: '900'
                    }}>
                        {weeklyAssessment.comparison.volumeChange >= 0 ? '+' : ''}{weeklyAssessment.comparison.volumeChange.toFixed(0)}%
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Evolução</Text>
                </View>
            </View>

            <View style={{ backgroundColor: theme.colors.primary + '10', padding: 14, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: theme.colors.primary }}>
                <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
                    {weeklyAssessment.insight}
                </Text>
            </View>
        </Animated.View>
    );
}
