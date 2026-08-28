import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAIAdvisor } from '../../hooks/useAIAdvisor';

type TabType = 'daily' | 'weekly' | 'monthly';

export function AIPerformanceReport() {
    const { theme } = useTheme();
    const { dailyReport, weeklyAssessment, monthlyReport, fitnessScore } = useAIAdvisor();
    const [selectedTab, setSelectedTab] = useState<TabType>('daily');

    const handleTabChange = (tab: TabType) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedTab(tab);
    };

    const StatusBadge = ({ value, label, color }: { value: string | number, label: string, color?: string }) => (
        <View style={{ flex: 1, backgroundColor: theme.colors.backgroundTertiary, padding: 12, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: color || theme.colors.text, fontSize: 16, fontWeight: '900' }}>{value}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>{label}</Text>
        </View>
    );

    const renderDaily = () => (
        <Animated.View entering={FadeInDown.duration(400)} className="gap-4">
            <View style={{ backgroundColor: theme.colors.primary + '10', padding: 16, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
                    {dailyReport.insight}
                </Text>
            </View>

            <View className="flex-row gap-3">
                <StatusBadge value={`${dailyReport.readinessScore}%`} label="PRONTIDÃO" color={dailyReport.readinessScore > 70 ? theme.colors.primary : theme.colors.error} />
                <StatusBadge value={dailyReport.lastWorkout ? 'CONCLUÍDO' : 'PENDENTE'} label="ÚLTIMO TREINO" />
            </View>

            <View className="gap-2">
                <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>DICAS DE PERFORMANCE</Text>
                {dailyReport.tips.map((tip, i) => (
                    <View key={i} className="flex-row items-center gap-3">
                        <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '500' }}>{tip}</Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );

    const renderWeekly = () => (
        <Animated.View entering={FadeInDown.duration(400)} className="gap-4">
            <View style={{ backgroundColor: theme.colors.primary + '10', padding: 16, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
                    {weeklyAssessment.insight}
                </Text>
            </View>

            <View className="flex-row gap-3">
                <StatusBadge value={weeklyAssessment.workoutsCount} label="TREINOS" />
                <StatusBadge
                    value={`${weeklyAssessment.comparison.volumeChange >= 0 ? '+' : ''}${weeklyAssessment.comparison.volumeChange.toFixed(0)}%`}
                    label="VOLUME"
                    color={weeklyAssessment.comparison.volumeChange >= 0 ? theme.colors.primary : theme.colors.error}
                />
                <StatusBadge value={fitnessScore} label="FITNESS SCORE" color={theme.colors.primary} />
            </View>
        </Animated.View>
    );

    const renderMonthly = () => (
        <Animated.View entering={FadeInDown.duration(400)} className="gap-4">
            <View style={{ backgroundColor: theme.colors.primary + '10', padding: 16, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
                    {monthlyReport.summaryInsight}
                </Text>
            </View>

            <View className="flex-row gap-3">
                <StatusBadge value={`${monthlyReport.consistencyScore}%`} label="CONSISTÊNCIA" color={theme.colors.primary} />
                <StatusBadge value={`${monthlyReport.volumeTrend}%`} label="TENDÊNCIA VOL" color={theme.colors.primary} />
            </View>

            <View className="gap-2">
                <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>DESTAQUES DO MÊS</Text>
                {monthlyReport.topStrengths.map((strength, i) => (
                    <View key={i} className="flex-row items-center gap-3">
                        <Ionicons name="trophy" size={14} color="#FFD700" />
                        <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '500' }}>{strength}</Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );

    return (
        <Animated.View
            entering={FadeInUp.delay(200).duration(800)}
            style={{
                marginHorizontal: 20,
                marginBottom: 32,
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 32,
                padding: 24,
                borderWidth: 1,
                borderColor: theme.colors.border,
            }}
        >
            <View className="flex-row items-center justify-between mb-8">
                <View className="flex-row items-center gap-3">
                    <View style={{ backgroundColor: theme.colors.primary + '20', width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
                    </View>
                    <View>
                        <Text style={{ color: theme.colors.text }} className="text-xl font-black italic uppercase tracking-tighter">Strive AI Advisor</Text>
                        <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-black uppercase tracking-[2px]">Análise Inteligente</Text>
                    </View>
                </View>
            </View>

            {/* Elite Toggle */}
            <View style={{ backgroundColor: theme.colors.backgroundTertiary, borderRadius: 20, padding: 6, flexDirection: 'row', marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border }}>
                {(['daily', 'weekly', 'monthly'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => handleTabChange(tab)}
                        activeOpacity={0.8}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 14,
                            backgroundColor: selectedTab === tab ? theme.colors.backgroundSecondary : 'transparent',
                            alignItems: 'center',
                            borderWidth: selectedTab === tab ? 1 : 0,
                            borderColor: theme.colors.border,
                        }}
                    >
                        <Text style={{
                            color: selectedTab === tab ? theme.colors.primary : theme.colors.textMuted,
                            fontSize: 10,
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}>
                            {tab === 'daily' ? 'Diário' : tab === 'weekly' ? 'Semanal' : 'Mensal'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {selectedTab === 'daily' && renderDaily()}
            {selectedTab === 'weekly' && renderWeekly()}
            {selectedTab === 'monthly' && renderMonthly()}
        </Animated.View>
    );
}
