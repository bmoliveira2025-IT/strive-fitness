import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useExerciseHistory } from '../../context/ExerciseHistoryContext';
import { useTheme } from '../../context/ThemeContext';

// Import exercises catalog to map exercise IDs to titles
const exercisesData = require('../../assets/exercises.json');

export function RecentPRCard() {
    const { theme } = useTheme();
    const router = useRouter();
    const { history } = useExerciseHistory();

    // Find the latest / top PR
    const latestPR = useMemo(() => {
        if (!history || Object.keys(history).length === 0) return null;

        const entries = Object.entries(history).filter(([_, rec]) => parseFloat(rec.bestKg) > 0 || parseInt(rec.bestReps) > 0);
        if (entries.length === 0) return null;

        // Sort by lastDate desc
        entries.sort((a, b) => {
            const dateA = new Date(a[1].lastDate || 0).getTime();
            const dateB = new Date(b[1].lastDate || 0).getTime();
            return dateB - dateA;
        });

        const [exerciseId, record] = entries[0];
        const exercise = exercisesData.find((ex: any) => ex.id?.toString() === exerciseId.toString());

        return {
            name: exercise?.name || 'Exercício Personalizado',
            bodyPart: exercise?.body_parts?.[0] || 'Geral',
            bestKg: record.bestKg || '0',
            bestReps: record.bestReps || '0',
            date: record.lastDate ? new Date(record.lastDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Recente',
        };
    }, [history]);

    return (
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            {/* Section Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text
                    style={{
                        color: theme.colors.textSecondary,
                        fontSize: 12,
                        fontFamily: FontFamily.caption,
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                    }}
                >
                    Recorde Pessoal (PR)
                </Text>
                <TouchableOpacity onPress={() => router.push('/progress')}>
                    <Text
                        style={{
                            color: theme.colors.primary,
                            fontSize: 12,
                            fontFamily: FontFamily.sansSemiBold,
                        }}
                    >
                        Ver todos
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Card */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/progress')}
                style={{
                    borderRadius: Radius.lg,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: theme.mode === 'dark' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(234, 179, 8, 0.2)',
                    backgroundColor: theme.mode === 'dark' ? '#14161C' : '#FFFFFF',
                    shadowColor: '#EAB308',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: theme.mode === 'dark' ? 0.15 : 0.08,
                    shadowRadius: 10,
                    elevation: 3,
                }}
            >
                <LinearGradient
                    colors={
                        theme.mode === 'dark'
                            ? ['rgba(234, 179, 8, 0.08)', 'rgba(0, 0, 0, 0.3)']
                            : ['rgba(254, 240, 138, 0.3)', 'rgba(255, 255, 255, 0.95)']
                    }
                    style={{ padding: 16 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 }}>
                            {/* Golden Trophy Icon Badge */}
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                    borderWidth: 1.5,
                                    borderColor: '#EAB308',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="trophy" size={22} color="#EAB308" />
                            </View>

                            {/* Info */}
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <View
                                        style={{
                                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderRadius: 4,
                                        }}
                                    >
                                        <Text style={{ color: '#EAB308', fontSize: 9, fontFamily: FontFamily.sansBold }}>
                                            NOVO RECORDE
                                        </Text>
                                    </View>
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: FontFamily.sans }}>
                                        {latestPR ? latestPR.date : 'Hoje'}
                                    </Text>
                                </View>

                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: theme.colors.text,
                                        fontSize: 16,
                                        fontFamily: FontFamily.displaySemiBold,
                                        letterSpacing: -0.2,
                                    }}
                                >
                                    {latestPR ? latestPR.name : 'Supino Reto com Barra'}
                                </Text>
                            </View>
                        </View>

                        {/* Weight / Reps Badge */}
                        <View
                            style={{
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: Radius.md,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.colors.primary,
                                    fontSize: 17,
                                    fontFamily: FontFamily.display,
                                    fontWeight: '800',
                                }}
                            >
                                {latestPR ? `${latestPR.bestKg} kg` : '80 kg'}
                            </Text>
                            <Text
                                style={{
                                    color: theme.colors.textMuted,
                                    fontSize: 10,
                                    fontFamily: FontFamily.sansMedium,
                                }}
                            >
                                {latestPR && parseInt(latestPR.bestReps) > 0 ? `${latestPR.bestReps} reps` : 'Máxima'}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}
