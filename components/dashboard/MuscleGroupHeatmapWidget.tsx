import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { AnatomicalMuscleBody } from './AnatomicalMuscleBody';

const exercisesData = require('../../assets/exercises.json');

type PeriodType = 'ultimo' | 'semana' | 'mes' | 'geral';

interface MuscleIntensity {
    muscle: string;
    percentage: number;
    color: string;
}

// Percentages & Colors matching the user's reference:
// 🟠 1–19%   (#F59E0B)
// 🔵 20–49%  (#38BDF8)
// 🟣 50–79%  (#A855F7)
// 🔴 80–100% (#EF4444)
function getHeatmapColor(percentage: number): string | null {
    if (percentage <= 0) return null;
    if (percentage < 20) return '#F59E0B'; // 1-19% Laranja
    if (percentage < 50) return '#38BDF8'; // 20-49% Azul
    if (percentage < 80) return '#A855F7'; // 50-79% Roxo
    return '#EF4444'; // 80-100% Vermelho
}

export function MuscleGroupHeatmapWidget() {
    const { theme } = useTheme();
    const router = useRouter();
    const { history } = useWorkoutHistory();
    const [period, setPeriod] = useState<PeriodType>('semana');
    const [viewSide, setViewSide] = useState<'Front' | 'Back'>('Front');

    // 1. Filter history according to selected period
    const filteredHistory = useMemo(() => {
        if (!history || history.length === 0) return [];

        const now = new Date();
        if (period === 'ultimo') {
            return history.slice(0, 1);
        } else if (period === 'semana') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return history.filter(h => new Date(h.date) >= sevenDaysAgo);
        } else if (period === 'mes') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return history.filter(h => new Date(h.date) >= thirtyDaysAgo);
        } else {
            return history; // Geral
        }
    }, [history, period]);

    // 2. Aggregate muscle volume in the period
    const muscleIntensities = useMemo<Record<string, MuscleIntensity>>(() => {
        const counts: Record<string, number> = {
            'Peito': 0,
            'Costas': 0,
            'Ombros': 0,
            'Bíceps': 0,
            'Tríceps': 0,
            'Abdômen': 0,
            'Quadríceps': 0,
            'Isquiotibiais': 0,
            'Panturrilhas': 0,
            'Glúteos': 0,
        };

        filteredHistory.forEach(record => {
            (record.exercises || []).forEach(ex => {
                const setsCount = (ex.sets && ex.sets.length > 0) ? ex.sets.length : 1;
                let parts: string[] = (ex as any).body_parts || [];
                if (parts.length === 0) {
                    const details = exercisesData.find((d: any) => d.id?.toString() === ex.id?.toString());
                    if (details?.body_parts) parts = details.body_parts;
                }

                const rawParts = parts.map(p => p.toLowerCase().trim());
                rawParts.forEach(norm => {
                    if (norm.includes('chest') || norm.includes('peito')) counts['Peito'] += setsCount;
                    if (norm.includes('back') || norm.includes('costas')) counts['Costas'] += setsCount;
                    if (norm.includes('shoulder') || norm.includes('ombro')) counts['Ombros'] += setsCount;
                    if (norm.includes('bicep') || norm.includes('bícep')) counts['Bíceps'] += setsCount;
                    if (norm.includes('tricep') || norm.includes('trícep')) counts['Tríceps'] += setsCount;
                    if (norm.includes('abs') || norm.includes('abdômen') || norm.includes('abdomen') || norm.includes('waist')) counts['Abdômen'] += setsCount;
                    if (norm.includes('quad') || norm.includes('perna') || norm.includes('thigh')) counts['Quadríceps'] += setsCount;
                    if (norm.includes('hamstring') || norm.includes('isquio')) counts['Isquiotibiais'] += setsCount;
                    if (norm.includes('calf') || norm.includes('panturrilha')) counts['Panturrilhas'] += setsCount;
                    if (norm.includes('glute') || norm.includes('glúteo') || norm.includes('hip')) counts['Glúteos'] += setsCount;
                });
            });
        });

        const maxSets = Math.max(...Object.values(counts), 1);
        const result: Record<string, MuscleIntensity> = {};

        Object.entries(counts).forEach(([m, count]) => {
            const pct = count > 0 ? Math.round((count / maxSets) * 100) : 0;
            const color = getHeatmapColor(pct) || '#f4f4f5';
            result[m] = {
                muscle: m,
                percentage: pct,
                color,
            };
        });

        return result;
    }, [filteredHistory]);

    return (
        <View style={{
            backgroundColor: theme.colors.card,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 14,
            marginBottom: 16,
        }}>
            {/* Header: Title + 'Mais' */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{
                    color: theme.colors.text,
                    fontSize: 16,
                    fontFamily: FontFamily.display,
                    letterSpacing: -0.3,
                }}>
                    Exercícios de grupos musculares
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/muscle-tracking')}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                >
                    <Text style={{ color: theme.colors.primary, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                        Mais
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Period Pills: [ Último ] [ Semana ] [ Mês ] [ Geral ] */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                {[
                    { key: 'ultimo', label: 'Último' },
                    { key: 'semana', label: 'Semana' },
                    { key: 'mes', label: 'Mês' },
                    { key: 'geral', label: 'Geral' },
                ].map((item) => {
                    const isActive = period === item.key;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() => setPeriod(item.key as PeriodType)}
                            activeOpacity={0.75}
                            style={{
                                flex: 1,
                                paddingVertical: 5,
                                borderRadius: Radius.full,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isActive ? theme.colors.primary : theme.colors.backgroundSecondary,
                                borderWidth: 1,
                                borderColor: isActive ? theme.colors.primary : theme.colors.border,
                            }}
                        >
                            <Text style={{
                                color: isActive ? theme.colors.onPrimary : theme.colors.textSecondary,
                                fontSize: 11,
                                fontFamily: isActive ? FontFamily.sansBold : FontFamily.sansMedium,
                            }}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Toggle Front / Back View Button & 3D Hint */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                <TouchableOpacity
                    onPress={() => setViewSide(prev => prev === 'Front' ? 'Back' : 'Front')}
                    activeOpacity={0.8}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        backgroundColor: theme.colors.backgroundSecondary,
                        paddingHorizontal: 11,
                        paddingVertical: 4,
                        borderRadius: Radius.full,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}
                >
                    <Ionicons name="sync-outline" size={13} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.text, fontSize: 11, fontFamily: FontFamily.sansSemiBold }}>
                        {viewSide === 'Front' ? 'Ver Costas (3D)' : 'Ver Frente (3D)'}
                    </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="move-outline" size={12} color={theme.colors.textSecondary} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansMedium }}>
                        Arraste para girar 3D
                    </Text>
                </View>
            </View>

            {/* Compact 3D Sculptural Muscle Body */}
            <View style={{
                height: 255,
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 4,
            }}>
                <AnatomicalMuscleBody
                    viewSide={viewSide}
                    onToggleSide={() => setViewSide(prev => prev === 'Front' ? 'Back' : 'Front')}
                    colors={{
                        'Peito': muscleIntensities['Peito']?.percentage > 0 ? muscleIntensities['Peito'].color : undefined,
                        'Costas': muscleIntensities['Costas']?.percentage > 0 ? muscleIntensities['Costas'].color : undefined,
                        'Ombros': muscleIntensities['Ombros']?.percentage > 0 ? muscleIntensities['Ombros'].color : undefined,
                        'Bíceps': muscleIntensities['Bíceps']?.percentage > 0 ? muscleIntensities['Bíceps'].color : undefined,
                        'Tríceps': muscleIntensities['Tríceps']?.percentage > 0 ? muscleIntensities['Tríceps'].color : undefined,
                        'Abdômen': muscleIntensities['Abdômen']?.percentage > 0 ? muscleIntensities['Abdômen'].color : undefined,
                        'Quadríceps': muscleIntensities['Quadríceps']?.percentage > 0 ? muscleIntensities['Quadríceps'].color : undefined,
                        'Isquiotibiais': muscleIntensities['Isquiotibiais']?.percentage > 0 ? muscleIntensities['Isquiotibiais'].color : undefined,
                        'Panturrilhas': muscleIntensities['Panturrilhas']?.percentage > 0 ? muscleIntensities['Panturrilhas'].color : undefined,
                        'Glúteos': muscleIntensities['Glúteos']?.percentage > 0 ? muscleIntensities['Glúteos'].color : undefined,
                    }}
                    width={130}
                    height={245}
                />
            </View>

            {/* Heatmap Percentage Legend (Compacta) */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                        – 1–19%
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#38BDF8' }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                        – 20–49%
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#A855F7' }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                        – 50–79%
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                        – 80–100%
                    </Text>
                </View>
            </View>
        </View>
    );
}
