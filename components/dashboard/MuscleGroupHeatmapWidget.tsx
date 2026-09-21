import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory, WorkoutHistoryRecord } from '../../context/WorkoutHistoryContext';
import { AnatomicalMuscleBody, MuscleColorMap } from './AnatomicalMuscleBody';

const exercisesData = require('../../assets/exercises.json');

export type PeriodType = 'ultimo' | 'hoje' | 'semana' | 'mes';
export type ViewMode = 'carga' | 'recuperacao';

interface MuscleData {
    name: string;
    displayName: string;
    sets: number;
    volumeKg: number;
    workoutsCount: number;
    exercises: string[];
    lastTrainedDate: string | null;
    loadPercentage: number;
    recoveryPercentage: number;
    loadColor: string | null;
    recoveryColor: string;
}

const MUSCLE_DISPLAY_NAMES: Record<string, string> = {
    'Peito': 'Peitoral Maior & Superior',
    'Costas': 'Dorsais & Costas',
    'Ombros': 'Deltoides (Ombros)',
    'Bíceps': 'Bíceps & Braquial',
    'Tríceps': 'Tríceps Braquial',
    'Abdômen': 'Reto Abdominal & Core',
    'Quadríceps': 'Quadríceps & Coxas',
    'Isquiotibiais': 'Posterior de Coxa',
    'Panturrilhas': 'Panturrilhas',
    'Glúteos': 'Glúteos',
    'Antebraços': 'Antebraços',
    'Trapézio': 'Trapézio',
};

// 4-5 Tier Heatmap Color Function (Carga)
function getLoadHeatmapColor(pct: number): string | null {
    if (pct <= 0) return null;
    if (pct <= 30) return '#F59E0B'; // Baixa (1-30%)
    if (pct <= 60) return '#0EA5E9'; // Moderada (31-60%)
    if (pct <= 80) return '#8B5CF6'; // Alta (61-80%)
    return '#EF4444'; // Muito Alta (81-100%)
}

// 3-Tier Recovery Color Function (Recuperação)
function getRecoveryColor(pct: number): string {
    if (pct < 40) return '#EF4444'; // Em recuperação intensa (<40%)
    if (pct < 80) return '#F59E0B'; // Recuperando (40-79%)
    return '#10B981'; // Pronto para treinar (80-100%)
}

// Format relative date for muscle card
function formatRelativeTime(dateIso: string | null): string {
    if (!dateIso) return 'Sem treino registrado recente';
    try {
        const diffMs = Date.now() - new Date(dateIso).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) return 'Hoje há poucos minutos';
        if (diffHours < 24) return `Hoje há ${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Ontem';
        return `Há ${diffDays} dias`;
    } catch {
        return 'Recentemente';
    }
}

// Robust anatomical muscle detector for exercises (checks body_parts, catalog, and names/keywords)
function detectMuscleGroupsForExercise(ex: { id?: string | number; name?: string; body_parts?: string[] }): string[] {
    const matched = new Set<string>();
    let parts: string[] = (ex.body_parts || []).slice();

    // Fallback to library catalog if body_parts is empty
    if (parts.length === 0) {
        const details = exercisesData.find(
            (d: any) =>
                (ex.id && d.id?.toString() === ex.id.toString()) ||
                (ex.name && d.name?.toLowerCase().trim() === ex.name.toLowerCase().trim())
        );
        if (details?.body_parts) {
            parts = details.body_parts;
        }
    }

    const rawParts = parts.map((p) => p.toLowerCase().trim());
    const exName = (ex.name || '').toLowerCase().trim();

    const has = (terms: string[]) => terms.some((t) => rawParts.some((p) => p.includes(t)) || exName.includes(t));

    if (has(['peito', 'chest', 'supino', 'crucifixo', 'crossover', 'peck deck', 'voador', 'flexão'])) {
        matched.add('Peito');
    }
    if (has(['costas', 'back', 'dorsal', 'puxada', 'remada', 'pulldown', 'barra fixa', 'serrote', 'lat pulldown', 'chin-up'])) {
        matched.add('Costas');
    }
    if (has(['ombro', 'shoulder', 'deltoid', 'deltoide', 'desenvolvimento', 'elevação lateral', 'elevação frontal', 'arnold', 'militar'])) {
        matched.add('Ombros');
    }
    if (has(['bíceps', 'biceps', 'bicep', 'rosca', 'scott'])) {
        matched.add('Bíceps');
    }
    if (has(['tríceps', 'triceps', 'tricep', 'testa', 'pulley', 'corda', 'coice', 'francês', 'mergulho', 'paralela'])) {
        matched.add('Tríceps');
    }
    if (has(['abdômen', 'abdomen', 'abs', 'core', 'cintura', 'waist', 'abdominal', 'prancha', 'infra', 'supra', 'crunch'])) {
        matched.add('Abdômen');
    }
    if (has(['quadríceps', 'quadriceps', 'quad', 'coxa', 'thigh', 'agachamento', 'leg press', 'extensora', 'hack', 'afundo', 'passada', 'sissy', 'avanço', 'squat'])) {
        matched.add('Quadríceps');
    }
    if (has(['isquiotibiais', 'isquio', 'hamstring', 'posterior de coxa', 'flexora', 'stiff', 'mesa flexora', 'cadeira flexora', 'rdl'])) {
        matched.add('Isquiotibiais');
    }
    if (has(['glúteo', 'gluteo', 'glute', 'glutes', 'hip', 'elevação pélvica', 'abdução', 'coice glúteo', 'bumbum'])) {
        matched.add('Glúteos');
    }
    if (has(['panturrilha', 'calf', 'calves', 'gêmeos', 'solear', 'panturrilhas'])) {
        matched.add('Panturrilhas');
    }
    if (has(['trapézio', 'trapezio', 'trap', 'traps', 'encolhimento', 'remada alta'])) {
        matched.add('Trapézio');
    }
    if (has(['antebraço', 'antebraco', 'forearm', 'forearms', 'punho', 'rosca inversa', 'rosca punho'])) {
        matched.add('Antebraços');
    }

    return Array.from(matched);
}

export function MuscleGroupHeatmapWidget() {
    const { theme } = useTheme();
    const isDark = theme.mode === 'dark';
    const router = useRouter();
    const { history } = useWorkoutHistory();
    const { width: windowWidth } = useWindowDimensions();
    // The dashboard itself is constrained on tablets/desktop. Only split the
    // anatomy and insights when there is enough real viewport for both panes.
    const isDesktop = windowWidth >= 1100;

    const [period, setPeriod] = useState<PeriodType>('semana');
    const [mode, setMode] = useState<ViewMode>('carga');
    const [viewSide, setViewSide] = useState<'Front' | 'Back'>('Front');
    const [resetTrigger, setResetTrigger] = useState(0);
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // 1. Filter history according to selected period
    const filteredHistory = useMemo(() => {
        if (!history || history.length === 0) return [];

        const now = new Date();
        if (period === 'ultimo') {
            return history.slice(0, 1);
        } else if (period === 'hoje') {
            const todayStr = now.toISOString().split('T')[0];
            return history.filter((h) => h.date && h.date.split('T')[0] === todayStr);
        } else if (period === 'semana') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return history.filter((h) => new Date(h.date) >= sevenDaysAgo);
        } else if (period === 'mes') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return history.filter((h) => new Date(h.date) >= thirtyDaysAgo);
        }
        return history;
    }, [history, period]);

    // 2. Aggregate muscle volume, exercises, and recovery
    const muscleMap = useMemo<Record<string, MuscleData>>(() => {
        const baseGroups = [
            'Peito',
            'Costas',
            'Ombros',
            'Bíceps',
            'Tríceps',
            'Abdômen',
            'Quadríceps',
            'Isquiotibiais',
            'Panturrilhas',
            'Glúteos',
            'Antebraços',
            'Trapézio',
        ];

        const data: Record<string, {
            sets: number;
            volumeKg: number;
            workoutsCount: number;
            exercises: Set<string>;
            lastTrainedDate: string | null;
        }> = {};

        baseGroups.forEach((g) => {
            data[g] = {
                sets: 0,
                volumeKg: 0,
                workoutsCount: 0,
                exercises: new Set(),
                lastTrainedDate: null,
            };
        });

        // Search in ALL history for lastTrainedDate to compute accurate recovery
        (history || []).forEach((record) => {
            (record.exercises || []).forEach((ex) => {
                const detected = detectMuscleGroupsForExercise(ex);
                detected.forEach((group) => {
                    if (data[group]) {
                        if (!data[group].lastTrainedDate || new Date(record.date) > new Date(data[group].lastTrainedDate!)) {
                            data[group].lastTrainedDate = record.date;
                        }
                    }
                });
            });
        });

        // Compute volume and sets in filteredHistory
        filteredHistory.forEach((record) => {
            const groupsTrainedInThisWorkout = new Set<string>();

            (record.exercises || []).forEach((ex) => {
                const setsCount = ex.sets && ex.sets.length > 0 ? ex.sets.length : 1;
                const exVolume = (ex.sets || []).reduce((acc, s) => acc + (s.kg || 0) * (s.reps || 1), 0);
                const detected = detectMuscleGroupsForExercise(ex);

                detected.forEach((group) => {
                    if (data[group]) {
                        data[group].sets += setsCount;
                        data[group].volumeKg += exVolume;
                        data[group].exercises.add(ex.name);
                        groupsTrainedInThisWorkout.add(group);
                    }
                });
            });

            groupsTrainedInThisWorkout.forEach((group) => {
                if (data[group]) {
                    data[group].workoutsCount += 1;
                }
            });
        });

        const maxSets = Math.max(...Object.values(data).map((d) => d.sets), 1);
        const result: Record<string, MuscleData> = {};

        baseGroups.forEach((g) => {
            const item = data[g];
            const loadPct = item.sets > 0 ? Math.min(100, Math.round((item.sets / maxSets) * 100)) : 0;

            // Compute biological recovery estimation (48-72h supercompensation window)
            let recoveryPct = 100;
            if (item.lastTrainedDate) {
                const elapsedHours = (Date.now() - new Date(item.lastTrainedDate).getTime()) / (1000 * 60 * 60);
                if (elapsedHours < 0) {
                    recoveryPct = 25;
                } else if (elapsedHours < 24) {
                    recoveryPct = Math.round(25 + (elapsedHours / 24) * 20); // 25-45% (Fadiga aguda)
                } else if (elapsedHours < 48) {
                    recoveryPct = Math.round(45 + ((elapsedHours - 24) / 24) * 35); // 45-80% (Em recuperação)
                } else if (elapsedHours < 72) {
                    recoveryPct = Math.round(80 + ((elapsedHours - 48) / 24) * 18); // 80-98% (Quase pronto)
                } else {
                    recoveryPct = 100; // Totalmente recuperado
                }
            }

            result[g] = {
                name: g,
                displayName: MUSCLE_DISPLAY_NAMES[g] || g,
                sets: item.sets,
                volumeKg: Math.round(item.volumeKg),
                workoutsCount: item.workoutsCount,
                exercises: Array.from(item.exercises),
                lastTrainedDate: item.lastTrainedDate,
                loadPercentage: loadPct,
                recoveryPercentage: recoveryPct,
                loadColor: getLoadHeatmapColor(loadPct),
                recoveryColor: getRecoveryColor(recoveryPct),
            };
        });

        return result;
    }, [history, filteredHistory]);

    // Color map for the 3D Body based on current mode (Carga vs. Recuperação)
    const bodyColorMap = useMemo<MuscleColorMap>(() => {
        const map: MuscleColorMap = {};
        Object.entries(muscleMap).forEach(([muscle, item]) => {
            if (mode === 'carga') {
                if (item.loadPercentage > 0 && item.loadColor) {
                    map[muscle as keyof MuscleColorMap] = item.loadColor;
                }
            } else if (item.lastTrainedDate) {
                // In recovery mode, color muscles that have been trained with their recovery status
                map[muscle as keyof MuscleColorMap] = item.recoveryColor;
            }
        });
        return map;
    }, [muscleMap, mode]);

    // Recovery muscles list (ranked by recovery percentage ascending - lowest recovery first)
    const recoveryList = useMemo(() => {
        return Object.values(muscleMap)
            .filter((m) => m.lastTrainedDate !== null)
            .sort((a, b) => a.recoveryPercentage - b.recoveryPercentage);
    }, [muscleMap]);

    // Top 3 most trained muscles
    const topMuscles = useMemo(() => {
        return Object.values(muscleMap)
            .filter((m) => m.sets > 0)
            .sort((a, b) => b.sets - a.sets)
            .slice(0, 3);
    }, [muscleMap]);

    // Muscle balance (Anterior vs. Posterior / Upper vs. Lower)
    const balanceStats = useMemo(() => {
        const anteriorSets = (muscleMap['Peito']?.sets || 0) + (muscleMap['Quadríceps']?.sets || 0) + (muscleMap['Abdômen']?.sets || 0) + (muscleMap['Bíceps']?.sets || 0);
        const posteriorSets = (muscleMap['Costas']?.sets || 0) + (muscleMap['Isquiotibiais']?.sets || 0) + (muscleMap['Glúteos']?.sets || 0) + (muscleMap['Tríceps']?.sets || 0);
        const total = anteriorSets + posteriorSets;
        if (total === 0) return { antPct: 50, postPct: 50, balanceScore: 100 };
        const antPct = Math.round((anteriorSets / total) * 100);
        const postPct = 100 - antPct;
        const balanceScore = 100 - Math.abs(antPct - postPct);
        return { antPct, postPct, balanceScore };
    }, [muscleMap]);

    const activeDetail = selectedMuscle ? muscleMap[selectedMuscle] : null;

    return (
        <View
            style={{
                backgroundColor: theme.colors.card,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                padding: isDesktop ? 22 : 16,
                marginBottom: 16,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: isDark ? 0.38 : 0.1,
                shadowRadius: 28,
                overflow: 'hidden',
            }}
        >
            {/* Ambient accents create depth without competing with the heatmap. */}
            <View pointerEvents="none" style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -95, top: -115, backgroundColor: isDark ? 'rgba(56,189,248,0.09)' : 'rgba(14,165,233,0.07)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, left: -95, bottom: 70, backgroundColor: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)' }} />
            {/* ══════════════ 1. CABEÇALHO COM TÍTULO E AJUDA ══════════════ */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text
                            style={{
                                color: theme.colors.text,
                                fontSize: 18,
                                fontFamily: FontFamily.display,
                                fontWeight: '700',
                                letterSpacing: -0.4,
                            }}
                        >
                            Mapa Muscular
                        </Text>
                        <View
                            style={{
                                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                                paddingHorizontal: 7,
                                paddingVertical: 2,
                                borderRadius: 6,
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.colors.primary,
                                    fontSize: 9,
                                    fontFamily: FontFamily.sansBold,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                }}
                            >
                                Interativo
                            </Text>
                        </View>
                    </View>
                    <Text
                        style={{
                            color: theme.colors.textSecondary,
                            fontSize: 12,
                            fontFamily: FontFamily.sans,
                            lineHeight: 16,
                        }}
                    >
                        Carga e recuperação por região anatômica.
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => setShowInfoModal(true)}
                    activeOpacity={0.7}
                    accessibilityLabel="Informações do mapa muscular"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        backgroundColor: theme.colors.backgroundSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}
                >
                    <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* ══════════════ 2. CONTROLES: FILTRO TEMPORAL & MODO ══════════════ */}
            <View style={{ gap: 10, marginBottom: 16 }}>
                {/* Filtro Temporal: [ Último treino | Hoje | Semana | Mês ] */}
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderRadius: 14,
                        padding: 3,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}
                >
                    {[
                        { key: 'ultimo', label: 'Último' },
                        { key: 'hoje', label: 'Hoje' },
                        { key: 'semana', label: 'Semana' },
                        { key: 'mes', label: 'Mês' },
                    ].map((item) => {
                        const isActive = period === item.key;
                        return (
                            <TouchableOpacity
                                key={item.key}
                                onPress={() => setPeriod(item.key as PeriodType)}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    paddingVertical: 7,
                                    borderRadius: 11,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isActive ? theme.colors.primary : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        color: isActive ? theme.colors.onPrimary : theme.colors.textSecondary,
                                        fontSize: 12,
                                        fontFamily: isActive ? FontFamily.sansBold : FontFamily.sansMedium,
                                    }}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Seletor de Modo: [ 🔥 Carga de Treino | ⚡ Recuperação Estimada ] */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => setMode('carga')}
                        activeOpacity={0.8}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 8,
                            borderRadius: 12,
                            backgroundColor: mode === 'carga' ? (isDark ? '#1E293B' : '#F1F5F9') : 'transparent',
                            borderWidth: 1.5,
                            borderColor: mode === 'carga' ? theme.colors.primary : 'transparent',
                        }}
                    >
                        <Ionicons
                            name="flame"
                            size={14}
                            color={mode === 'carga' ? theme.colors.primary : theme.colors.textMuted}
                        />
                        <Text
                            style={{
                                color: mode === 'carga' ? theme.colors.text : theme.colors.textSecondary,
                                fontSize: 11,
                                fontFamily: FontFamily.sansBold,
                            }}
                        >
                            Carga de Volume
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setMode('recuperacao')}
                        activeOpacity={0.8}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 8,
                            borderRadius: 12,
                            backgroundColor: mode === 'recuperacao' ? (isDark ? '#1E293B' : '#F1F5F9') : 'transparent',
                            borderWidth: 1.5,
                            borderColor: mode === 'recuperacao' ? '#10B981' : 'transparent',
                        }}
                    >
                        <Ionicons
                            name="pulse"
                            size={14}
                            color={mode === 'recuperacao' ? '#10B981' : theme.colors.textMuted}
                        />
                        <Text
                            style={{
                                color: mode === 'recuperacao' ? theme.colors.text : theme.colors.textSecondary,
                                fontSize: 11,
                                fontFamily: FontFamily.sansBold,
                            }}
                        >
                            Recuperação
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ══════════════ 3. CORPO ANATÔMICO 3D ESCULTURAL ══════════════ */}
            <View
                style={{
                    flexDirection: isDesktop ? 'row' : 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isDesktop ? 24 : 10,
                }}
            >
                {/* Anatomical model stage */}
                <View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        width: isDesktop ? 286 : '100%',
                        paddingTop: 12,
                        paddingHorizontal: 12,
                        borderRadius: 24,
                        backgroundColor: isDark ? 'rgba(9, 15, 28, 0.72)' : 'rgba(248, 250, 252, 0.88)',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.24)',
                        shadowColor: isDark ? '#020617' : '#64748B',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: isDark ? 0.35 : 0.12,
                        shadowRadius: 22,
                    }}
                >
                    {/* 3D Omnidirectional Controls Header */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            paddingHorizontal: 4,
                            marginBottom: 8,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setViewSide((prev) => (prev === 'Front' ? 'Back' : 'Front'))}
                            activeOpacity={0.75}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.95)',
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.28)',
                            }}
                        >
                            <Ionicons name="sync-outline" size={13} color={theme.colors.primary} />
                            <Text
                                style={{
                                    color: theme.colors.text,
                                    fontSize: 11,
                                    fontFamily: FontFamily.sansBold,
                                    letterSpacing: 0.2,
                                }}
                            >
                                Giro 360° Livre {viewSide === 'Front' ? '(Frente)' : '(Costas)'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setViewSide('Front');
                                setResetTrigger((prev) => prev + 1);
                            }}
                            activeOpacity={0.75}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: theme.colors.backgroundSecondary,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}
                        >
                            <Ionicons name="refresh" size={12} color={theme.colors.textSecondary} />
                            <Text
                                style={{
                                    color: theme.colors.textSecondary,
                                    fontSize: 11,
                                    fontFamily: FontFamily.sansMedium,
                                }}
                            >
                                Centralizar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Corpo anatômico realista com mapa de calor 360° */}
                    <View
                        style={{
                            height: 355,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 4,
                            marginBottom: 2,
                        }}
                    >
                        <AnatomicalMuscleBody
                            viewSide={viewSide}
                            colors={bodyColorMap}
                            intensities={Object.fromEntries(Object.entries(muscleMap).map(([name, item]) => [name, mode === 'carga' ? item.loadPercentage : item.recoveryPercentage]))}
                            mode={mode}
                            selectedMuscle={selectedMuscle}
                            onSelectMuscle={(m) => setSelectedMuscle(m)}
                            onToggleSide={() => setViewSide((prev) => (prev === 'Front' ? 'Back' : 'Front'))}
                            resetTrigger={resetTrigger}
                            width={250}
                            height={345}
                        />
                    </View>
                </View>

                {/* Desktop Side Column: Top Músculos & Recuperação */}
                {isDesktop && (
                    <View style={{ flex: 1, minWidth: 260, gap: 14 }}>
                        <Text
                            style={{
                                color: theme.colors.text,
                                fontSize: 14,
                                fontFamily: FontFamily.sansBold,
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                            }}
                        >
                            {mode === 'carga' ? 'Destaques de Volume' : 'Status de Recuperação'}
                        </Text>

                        {mode === 'carga' ? (
                            topMuscles.length > 0 ? (
                                <View style={{ gap: 8 }}>
                                    {topMuscles.map((m, idx) => (
                                        <TouchableOpacity
                                            key={m.name}
                                            onPress={() => setSelectedMuscle(m.name)}
                                            activeOpacity={0.8}
                                            style={{
                                                backgroundColor: theme.colors.backgroundSecondary,
                                                padding: 12,
                                                borderRadius: 14,
                                                borderWidth: 1,
                                                borderColor: selectedMuscle === m.name ? theme.colors.primary : theme.colors.border,
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                                    #{idx + 1} {m.displayName}
                                                </Text>
                                                <Text style={{ color: theme.colors.primary, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                                    {m.loadPercentage}%
                                                </Text>
                                            </View>
                                            <View style={{ height: 6, backgroundColor: theme.colors.cardBorder, borderRadius: 3, overflow: 'hidden' }}>
                                                <View style={{ width: `${m.loadPercentage}%`, height: '100%', backgroundColor: m.loadColor || theme.colors.primary, borderRadius: 3 }} />
                                            </View>
                                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 5 }}>
                                                {m.sets} séries • {m.volumeKg} kg levantados
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>
                                    Nenhum treino registrado neste período.
                                </Text>
                            )
                        ) : (
                            recoveryList.length > 0 ? (
                                <View style={{ gap: 8 }}>
                                    {recoveryList.map((m) => (
                                        <TouchableOpacity
                                            key={m.name}
                                            onPress={() => setSelectedMuscle(m.name)}
                                            activeOpacity={0.8}
                                            style={{
                                                backgroundColor: theme.colors.backgroundSecondary,
                                                padding: 12,
                                                borderRadius: 14,
                                                borderWidth: 1,
                                                borderColor: selectedMuscle === m.name ? m.recoveryColor : theme.colors.border,
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                                    {m.displayName}
                                                </Text>
                                                <Text style={{ color: m.recoveryColor, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                                    {m.recoveryPercentage}%
                                                </Text>
                                            </View>
                                            <View style={{ height: 6, backgroundColor: theme.colors.cardBorder, borderRadius: 3, overflow: 'hidden' }}>
                                                <View style={{ width: `${m.recoveryPercentage}%`, height: '100%', backgroundColor: m.recoveryColor, borderRadius: 3 }} />
                                            </View>
                                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 5 }}>
                                                {formatRelativeTime(m.lastTrainedDate)} • {m.recoveryPercentage < 40 ? 'Descanso recomendado' : m.recoveryPercentage < 80 ? 'Em recuperação' : 'Pronto para treinar'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>
                                    Todos os grupos musculares estão totalmente recuperados.
                                </Text>
                            )
                        )}
                    </View>
                )}
            </View>

            {/* ══════════════ 4. LEGENDA MINIMALISTA ══════════════ */}
            <View
                style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    rowGap: 8,
                    columnGap: 14,
                    paddingTop: 12,
                    paddingHorizontal: 12,
                    marginTop: 6,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                }}
            >
                {mode === 'carga' ? (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                                Baixa (1-30%)
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0EA5E9' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                                Moderada (31-60%)
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                                Alta (61-80%)
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                                Máxima (81%+)
                            </Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                                Descanso (&lt;40%)
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                                Recuperando (40-79%)
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: FontFamily.sansSemiBold }}>
                                Pronto (80-100%)
                            </Text>
                        </View>
                    </>
                )}
            </View>

            {/* ══════════════ 5. DESTAQUES NO MOBILE (CARGA OU RECUPERAÇÃO) ══════════════ */}
            {!isDesktop && (
                <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                    <Text
                        style={{
                            color: theme.colors.textSecondary,
                            fontSize: 11,
                            fontFamily: FontFamily.sansBold,
                            textTransform: 'uppercase',
                            letterSpacing: 0.6,
                            marginBottom: 8,
                        }}
                    >
                        {mode === 'carga'
                            ? `Músculos Mais Trabalhados (${period === 'ultimo' ? 'Último Treino' : period === 'hoje' ? 'Hoje' : period === 'semana' ? 'Esta Semana' : 'Este Mês'})`
                            : 'Status de Recuperação Muscular'}
                    </Text>

                    {mode === 'carga' ? (
                        topMuscles.length > 0 ? (
                            <View style={{ gap: 8 }}>
                                {topMuscles.map((m, idx) => (
                                    <TouchableOpacity
                                        key={m.name}
                                        onPress={() => setSelectedMuscle(m.name)}
                                        activeOpacity={0.8}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            backgroundColor: theme.colors.backgroundSecondary,
                                            paddingHorizontal: 12,
                                            paddingVertical: 9,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: selectedMuscle === m.name ? theme.colors.primary : theme.colors.border,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: m.loadColor || theme.colors.primary,
                                                }}
                                            />
                                            <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                                {m.displayName}
                                            </Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                                                {m.sets} séries • {m.volumeKg} kg
                                            </Text>
                                            <View
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.1)',
                                                    paddingHorizontal: 7,
                                                    paddingVertical: 2,
                                                    borderRadius: 6,
                                                }}
                                            >
                                                <Text style={{ color: theme.colors.primary, fontSize: 11, fontFamily: FontFamily.sansBold }}>
                                                    {m.loadPercentage}%
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontStyle: 'italic', paddingVertical: 4 }}>
                                Nenhum treino registrado neste período.
                            </Text>
                        )
                    ) : (
                        recoveryList.length > 0 ? (
                            <View style={{ gap: 8 }}>
                                {recoveryList.map((m) => (
                                    <TouchableOpacity
                                        key={m.name}
                                        onPress={() => setSelectedMuscle(m.name)}
                                        activeOpacity={0.8}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            backgroundColor: theme.colors.backgroundSecondary,
                                            paddingHorizontal: 12,
                                            paddingVertical: 9,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: selectedMuscle === m.name ? m.recoveryColor : theme.colors.border,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: m.recoveryColor,
                                                }}
                                            />
                                            <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                                {m.displayName}
                                            </Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: FontFamily.sansMedium }}>
                                                {formatRelativeTime(m.lastTrainedDate)}
                                            </Text>
                                            <View
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.95)',
                                                    paddingHorizontal: 7,
                                                    paddingVertical: 2,
                                                    borderRadius: 6,
                                                    borderWidth: 1,
                                                    borderColor: m.recoveryColor,
                                                }}
                                            >
                                                <Text style={{ color: m.recoveryColor, fontSize: 11, fontFamily: FontFamily.sansBold }}>
                                                    {m.recoveryPercentage}%
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontStyle: 'italic', paddingVertical: 4 }}>
                                Todos os grupos musculares estão totalmente recuperados.
                            </Text>
                        )
                    )}
                </View>
            )}

            {/* ══════════════ 6. MODAL CONTEXTUAL DO MÚSCULO ══════════════ */}
            <Modal
                visible={!!selectedMuscle}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedMuscle(null)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        justifyContent: 'flex-end',
                    }}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setSelectedMuscle(null)}
                    />

                    {activeDetail && (
                        <View
                            style={{
                                backgroundColor: theme.colors.card,
                                borderTopLeftRadius: 28,
                                borderTopRightRadius: 28,
                                borderWidth: 1,
                                borderColor: theme.colors.cardBorder,
                                paddingHorizontal: 20,
                                paddingTop: 16,
                                paddingBottom: 36,
                                maxHeight: '75%',
                            }}
                        >
                            {/* Handle Bar */}
                            <View
                                style={{
                                    width: 44,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: theme.colors.border,
                                    alignSelf: 'center',
                                    marginBottom: 16,
                                }}
                            />

                            {/* Header */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: FontFamily.sansBold, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                        Análise Muscular
                                    </Text>
                                    <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: FontFamily.display, fontWeight: '700' }}>
                                        {activeDetail.displayName}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setSelectedMuscle(null)}
                                    activeOpacity={0.7}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: theme.colors.backgroundSecondary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Grid de Métricas do Músculo */}
                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                                    <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border }}>
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.sansBold, textTransform: 'uppercase' }}>
                                            Séries Feitas
                                        </Text>
                                        <Text style={{ color: theme.colors.text, fontSize: 22, fontFamily: FontFamily.sansBold, marginTop: 4 }}>
                                            {activeDetail.sets}
                                        </Text>
                                    </View>

                                    <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border }}>
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.sansBold, textTransform: 'uppercase' }}>
                                            Volume Total
                                        </Text>
                                        <Text style={{ color: theme.colors.text, fontSize: 22, fontFamily: FontFamily.sansBold, marginTop: 4 }}>
                                            {activeDetail.volumeKg} <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>kg</Text>
                                        </Text>
                                    </View>

                                    <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border }}>
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.sansBold, textTransform: 'uppercase' }}>
                                            Recuperação
                                        </Text>
                                        <Text style={{ color: activeDetail.recoveryColor, fontSize: 22, fontFamily: FontFamily.sansBold, marginTop: 4 }}>
                                            {activeDetail.recoveryPercentage}%
                                        </Text>
                                    </View>
                                </View>

                                {/* Data do Último Estímulo */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        backgroundColor: theme.colors.backgroundSecondary,
                                        padding: 12,
                                        borderRadius: 14,
                                        marginBottom: 16,
                                    }}
                                >
                                    <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: FontFamily.sansBold, textTransform: 'uppercase' }}>
                                            Último treino realizado
                                        </Text>
                                        <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansSemiBold, marginTop: 1 }}>
                                            {formatRelativeTime(activeDetail.lastTrainedDate)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Lista de Exercícios que Ativaram o Músculo */}
                                <View style={{ marginBottom: 10 }}>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: FontFamily.sansBold, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                                        Exercícios Executados no Período ({activeDetail.exercises.length})
                                    </Text>
                                    {activeDetail.exercises.length > 0 ? (
                                        <View style={{ gap: 6 }}>
                                            {activeDetail.exercises.map((exName) => (
                                                <View
                                                    key={exName}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        backgroundColor: theme.colors.backgroundSecondary,
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 9,
                                                        borderRadius: 10,
                                                    }}
                                                >
                                                    <Ionicons name="barbell-outline" size={16} color={theme.colors.primary} />
                                                    <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansMedium }}>
                                                        {exName}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>
                                            Nenhum exercício registrado para este músculo no período selecionado.
                                        </Text>
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            </Modal>

            {/* ══════════════ 7. MODAL EXPLICATIVO DO MAPA MUSCULAR ══════════════ */}
            <Modal
                visible={showInfoModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInfoModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View
                        style={{
                            backgroundColor: theme.colors.card,
                            borderRadius: 22,
                            padding: 22,
                            maxWidth: 420,
                            width: '100%',
                            borderWidth: 1.5,
                            borderColor: theme.colors.cardBorder,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: FontFamily.display, fontWeight: '700' }}>
                                Como funciona o Mapa 3D?
                            </Text>
                            <TouchableOpacity onPress={() => setShowInfoModal(false)} hitSlop={10}>
                                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 12, fontFamily: FontFamily.sans }}>
                            O **Mapa Muscular 3D** é um espelho visual e tecnológico da distribuição de estímulos dos seus treinos:
                        </Text>

                        <View style={{ gap: 8, marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Ionicons name="flame" size={16} color={theme.colors.primary} style={{ marginTop: 2 }} />
                                <Text style={{ flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17 }}>
                                    <Text style={{ fontFamily: FontFamily.sansBold }}>Carga de Treino:</Text> Baseia-se no volume de séries e carga (kg) acumuladas em cada grupo muscular no período selecionado.
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Ionicons name="pulse" size={16} color="#10B981" style={{ marginTop: 2 }} />
                                <Text style={{ flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17 }}>
                                    <Text style={{ fontFamily: FontFamily.sansBold }}>Recuperação Estimada:</Text> Calcula a supercompensação biológica em horas (24h a 72h) para indicar quando o músculo está pronto para receber nova carga.
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Ionicons name="hand-left" size={16} color={theme.colors.warning} style={{ marginTop: 2 }} />
                                <Text style={{ flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17 }}>
                                    <Text style={{ fontFamily: FontFamily.sansBold }}>Interação 360°:</Text> Arraste o corpo para girar e toque em qualquer músculo para abrir os detalhes e exercícios.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowInfoModal(false)}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: theme.colors.primary,
                                paddingVertical: 11,
                                borderRadius: Radius.md,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ color: theme.colors.onPrimary, fontSize: 13, fontFamily: FontFamily.sansBold }}>
                                Entendi
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
