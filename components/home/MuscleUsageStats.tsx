import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MUSCLE_IMAGES } from '../../constants/muscleImages';
import { MUSCLE_INFO } from '../../constants/muscleInfo';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';

const exercisesData = require('../../assets/exercises.json');

interface MuscleUsageStatsProps {
    onOpenInfo?: (muscleName: string) => void;
}

export function MuscleUsageStats({ onOpenInfo }: MuscleUsageStatsProps = {}) {
    const { theme } = useTheme();
    const router = useRouter();
    const { history } = useWorkoutHistory();

    const topBodyParts = useMemo(() => {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);

        const filtered = history.filter(h => new Date(h.date) >= start);

        const counts: Record<string, number> = {};
        Object.keys(MUSCLE_INFO).forEach(m => { counts[m] = 0; });

        filtered.forEach(record => {
            record.exercises.forEach(ex => {
                const setsCount = (ex.sets && ex.sets.length > 0) ? ex.sets.length : 1;
                if (setsCount === 0) return;

                let parts: string[] = (ex as any).body_parts || [];
                if (parts.length === 0) {
                    const details = exercisesData.find((d: any) => d.id?.toString() === ex.id?.toString());
                    if (details?.body_parts) parts = details.body_parts;
                }

                const rawParts = parts.map(p => p.toLowerCase().trim());
                const uniqueParts = new Set<string>();
                rawParts.forEach(norm => {
                    if (norm === 'thighs' || norm === 'thigh' || norm === 'legs') norm = 'quadriceps';
                    if (norm === 'upper arms' || norm === 'arms') norm = 'biceps';
                    uniqueParts.add(norm);
                });

                uniqueParts.forEach(normalizedPart => {
                    const map: Record<string, string> = {
                        'chest': 'Peito', 'peito': 'Peito',
                        'back': 'Costas', 'costas': 'Costas',
                        'shoulders': 'Ombros', 'ombros': 'Ombros',
                        'biceps': 'Bíceps', 'bíceps': 'Bíceps',
                        'triceps': 'Tríceps', 'tríceps': 'Tríceps',
                        'abs': 'Abdômen', 'waist': 'Abdômen', 'abdomen': 'Abdômen',
                        'quadriceps': 'Quadríceps', 'quadríceps': 'Quadríceps',
                        'isquiotibiais': 'Isquiotibiais', 'hamstrings': 'Isquiotibiais',
                        'calves': 'Panturrilhas', 'panturrilhas': 'Panturrilhas',
                        'glutes': 'Glúteos', 'glúteos': 'Glúteos', 'hips': 'Glúteos'
                    };
                    const muscleKey = map[normalizedPart] || normalizedPart;
                    if (counts[muscleKey] !== undefined) counts[muscleKey] += setsCount;
                });
            });
        });

        const sortedEntries = Object.entries(counts)
            .map(([name, count]) => ({
                name,
                count,
                image: (MUSCLE_IMAGES as any)[name]
            }))
            .filter(p => p.count > 0)
            .sort((a, b) => b.count - a.count);

        const maxCount = sortedEntries.length > 0 ? sortedEntries[0].count : 1;

        // Limit to Top 4 for a compact vertical preview
        return sortedEntries.slice(0, 4).map(item => ({
            ...item,
            intensity: item.count / maxCount
        }));
    }, [history]);

    if (topBodyParts.length === 0) return null;

    return (
        <View className="mb-10 px-6">
            <Animated.View
                entering={FadeInDown.duration(800).springify()}
                className="flex-row items-center justify-between mb-5"
            >
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text numberOfLines={1} style={{ color: theme.colors.text }} className="text-xl font-black tracking-tighter italic uppercase">Foco Muscular</Text>
                    <View className="flex-row items-center mt-0.5">
                        <View style={{ backgroundColor: theme.colors.primary, width: 2, height: 10, borderRadius: 1, marginRight: 6, opacity: 0.5 }} />
                        <Text numberOfLines={1} style={{ color: theme.colors.textMuted }} className="text-[10px] font-black uppercase tracking-widest leading-none">Distribuição Semanal</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/muscle-coach-details')}
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{
                        backgroundColor: theme.mode === 'light' ? '#FFFFFF' : theme.colors.card,
                        borderWidth: 1.5,
                        borderColor: theme.colors.cardBorder,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                    }}
                >
                    <Ionicons name="stats-chart" size={18} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                </TouchableOpacity>
            </Animated.View>

            <View
                style={{
                    backgroundColor: theme.mode === 'light' ? '#FFFFFF' : theme.colors.card,
                    borderRadius: 32,
                    padding: 20,
                    borderWidth: 1.5,
                    borderColor: theme.colors.cardBorder,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: theme.mode === 'light' ? 0.04 : 0.1,
                    shadowRadius: 25,
                    elevation: 5,
                }}
            >
                {topBodyParts.map((part, index) => (
                    <Animated.View
                        key={part.name}
                        entering={FadeInDown.delay(index * 100).duration(800).springify()}
                        style={{
                            borderBottomWidth: index === topBodyParts.length - 1 ? 0 : 1,
                            borderBottomColor: theme.colors.cardBorder,
                            paddingBottom: index === topBodyParts.length - 1 ? 0 : 16,
                            marginBottom: index === topBodyParts.length - 1 ? 0 : 16,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => onOpenInfo ? onOpenInfo(part.name) : router.push('/muscle-coach-details')}
                            activeOpacity={0.7}
                            className="flex-row items-center"
                        >
                            {/* Muscle Thumbnail */}
                            <View
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    borderWidth: 1,
                                    borderColor: theme.colors.cardBorder,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}
                            >
                                {part.image ? (
                                    <Image
                                        source={part.image}
                                        style={{ width: 40, height: 50, opacity: 0.8 }}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Ionicons name="body" size={20} color={theme.colors.textMuted} />
                                )}
                            </View>

                            {/* Info & Progress */}
                            <View className="flex-1 ml-4 justify-center">
                                <View className="flex-row justify-between items-center mb-1.5">
                                    <View className="flex-row items-baseline">
                                        <Text style={{ color: theme.colors.text }} className="font-black text-sm italic uppercase tracking-tight">{part.name}</Text>
                                        <Text style={{ color: theme.colors.textMuted }} className="ml-2 text-[10px] font-bold">{part.count} SÉRIES</Text>
                                    </View>
                                    <View style={{
                                        backgroundColor: theme.mode === 'light' ? theme.colors.primary + '15' : 'transparent',
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 6
                                    }}>
                                        <Text style={{ color: theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary }} className="text-[11px] font-black italic">{Math.round(part.intensity * 100)}%</Text>
                                    </View>
                                </View>

                                {/* Modern Minimal Progress Bar */}
                                <View
                                    style={{
                                        height: 5,
                                        backgroundColor: theme.colors.backgroundTertiary,
                                        borderRadius: 10,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <LinearGradient
                                        colors={[theme.colors.primary, theme.mode === 'light' ? '#6366F1' : '#818CF8']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            width: `${part.intensity * 100}%`,
                                            height: '100%',
                                            borderRadius: 10
                                        }}
                                    />
                                </View>
                            </View>

                            <Ionicons name="chevron-forward" size={14} color={theme.colors.cardBorder} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}
