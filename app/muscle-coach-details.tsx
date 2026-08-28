import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMuscleTracker } from '../context/MuscleTrackerContext';
import { useTheme } from '../context/ThemeContext';

export default function MuscleCoachDetails() {
    const { theme } = useTheme();
    const router = useRouter();
    const { muscleStats } = useMuscleTracker();

    const getPriorityScore = (status: string) => {
        switch (status) {
            case 'undertrained': return 10;
            case 'overreaching': return 8;
            case 'accumulating': return 5;
            case 'recovered': return 1;
            default: return 0;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22C55E';
        if (score >= 50) return '#EAB308';
        return '#EF4444';
    };

    const sortedMuscles = useMemo(() => {
        if (!muscleStats) return [];
        return Object.values(muscleStats).sort((a, b) => {
            const scoreA = getPriorityScore(a.status);
            const scoreB = getPriorityScore(b.status);
            return scoreB - scoreA;
        });
    }, [muscleStats]);

    const StatusBadge = ({ status }: { status: string }) => {
        let color = theme.colors.primary;
        let text = 'Neutro';
        let bg = 'bg-blue-500/10';

        switch (status) {
            case 'undertrained':
                color = theme.mode === 'light' ? '#92400E' : '#EAB308';
                text = 'Subtreinado';
                bg = theme.mode === 'light' ? 'bg-amber-100' : 'bg-yellow-500/20';
                break;
            case 'overreaching':
                color = '#EF4444';
                text = 'Sobrecarga';
                bg = 'bg-red-500/20';
                break;
            case 'recovered':
                color = '#22C55E';
                text = 'Volume Ideal';
                bg = 'bg-green-500/20';
                break;
            case 'accumulating':
                color = theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary;
                text = 'Em Progresso';
                bg = theme.mode === 'light' ? 'bg-primary/20' : 'bg-primary/20';
                break;
        }

        return (
            <View className={`px-2 py-0.5 rounded-md ${bg} self-start`}>
                <Text style={{ color }} className="text-[9px] font-black uppercase tracking-wider">{text}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
            <View className="flex-row items-center px-6 py-4 border-b" style={{ borderColor: theme.colors.cardBorder }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ backgroundColor: theme.colors.card, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View className="ml-4">
                    <Text style={{ color: theme.colors.text }} className="text-xl font-black italic uppercase italic">Strive Coach</Text>
                    <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase tracking-widest">Análise Completa de Grupos</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 20 }}>
                {/* Intro Card */}
                <View style={{ backgroundColor: theme.colors.primary + '05', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.primary + '10' }}>
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="sparkles" size={20} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                        <Text style={{ color: theme.colors.text }} className="text-lg font-bold ml-2">Visão Geral de Performance</Text>
                    </View>
                    <Text style={{ color: theme.colors.textSecondary }} className="text-sm leading-6">
                        Aqui você encontra o status detalhado de cada grupamento muscular baseado no seu histórico recente de treinos, volume semanal e tempo de recuperação.
                    </Text>
                </View>

                {sortedMuscles.map((muscle) => (
                    <View
                        key={muscle.id}
                        style={{
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.cardBorder,
                            width: '100%',
                            borderRadius: 24,
                            marginBottom: 16,
                            padding: 20,
                            borderWidth: 1
                        }}
                    >
                        <View className="flex-row justify-between items-start mb-4">
                            <View className="flex-1">
                                <Text style={{ color: theme.colors.text }} className="text-xl font-black italic uppercase mb-1">{muscle.name}</Text>
                                <StatusBadge status={muscle.status} />
                            </View>
                            <View className="items-center">
                                <Text style={{ color: getScoreColor(muscle.score) }} className="text-3xl font-black">{muscle.score}</Text>
                                <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase">Score</Text>
                            </View>
                        </View>

                        <View className="flex-row flex-wrap gap-y-4 mb-4">
                            <View className="w-[50%]">
                                <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-0.5 tracking-wider">Séries Semanais</Text>
                                <Text style={{ color: theme.colors.text }} className="text-base font-bold">
                                    {muscle.setsThisWeek} <Text className="text-sm font-normal opacity-40">/ {muscle.weeklyTarget}</Text>
                                </Text>
                            </View>
                            <View className="w-[50%]">
                                <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-0.5 tracking-wider">Carga Média</Text>
                                <Text style={{ color: theme.colors.text }} className="text-base font-bold">{muscle.avgLoad}kg</Text>
                            </View>
                            <View className="w-[50%]">
                                <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-0.5 tracking-wider">Frequência</Text>
                                <Text style={{ color: theme.colors.text }} className="text-base font-bold">{muscle.frequency}x / sem</Text>
                            </View>
                            <View className="w-[50%]">
                                <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-bold uppercase mb-0.5 tracking-wider">Recuperação</Text>
                                <Text style={{ color: theme.colors.text }} className="text-base font-bold">{muscle.recoveryPercentage}%</Text>
                            </View>
                        </View>

                        <View style={{ backgroundColor: theme.mode === 'light' ? '#F4F4F5' : '#18181B' }} className="p-4 rounded-2xl">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="bulb" size={14} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                                <Text style={{ color: theme.mode === 'light' ? theme.colors.text : theme.colors.textMuted }} className="text-[11px] font-black uppercase ml-1.5 tracking-wider">Análise do Coach</Text>
                            </View>
                            <Text style={{ color: theme.colors.text }} className="text-[13px] leading-5 font-medium italic">
                                “{muscle.recommendation}”
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
