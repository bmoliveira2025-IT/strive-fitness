import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutRecommendation } from '../../utils/recommendationEngine';

interface WorkoutRecommendationCardProps {
    recommendation: WorkoutRecommendation;
}

export function WorkoutRecommendationCard({ recommendation }: WorkoutRecommendationCardProps) {
    const { theme } = useTheme();
    const router = useRouter();

    const { workout, reason, musclesNeedingAttention, priority, daysSinceLastPerformed } = recommendation;

    // Gradient colors based on priority
    const gradientColors = priority === 'high'
        ? (['#6366F1', '#8B5CF6'] as const)
        : priority === 'medium'
            ? (['#3B82F6', '#06B6D4'] as const)
            : (['#10B981', '#059669'] as const);

    const handleStartWorkout = () => {
        router.push({
            pathname: '/workout',
            params: { loadWorkoutId: workout.id, returnTo: '/' }
        });
    };

    return (
        <Animated.View
            entering={FadeInDown.duration(800).springify()}
            className="px-6 mb-8"
            style={{
                // Flat athletic design relies on surface and border
            }}
        >
            <View
                style={{
                    backgroundColor: theme.colors.card,
                    borderRadius: 16,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    overflow: 'hidden',
                }}
            >

                <View className="p-5">
                    {/* Compact Action Header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center flex-1">
                            <View
                                style={{ backgroundColor: theme.colors.primary + '20' }}
                                className="p-2.5 rounded-xl mr-3"
                            >
                                <Ionicons name="barbell" size={16} color={theme.colors.primary} />
                            </View>
                            <View>
                                <Text style={{ color: theme.colors.textMuted }} className="text-[10px] font-black uppercase tracking-widest">
                                    Sugestão de Hoje
                                </Text>
                                <Text style={{ color: theme.colors.text }} className="text-base font-black italic uppercase tracking-tight">
                                    {workout.name}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={handleStartWorkout}
                            style={{ backgroundColor: theme.colors.primary }}
                            className="w-12 h-12 rounded-full items-center justify-center"
                        >
                            <Ionicons name="play" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Compact Info Row */}
                    <View className="flex-row items-center justify-between pt-4 border-t" style={{ borderTopColor: theme.colors.divider }}>
                        <View className="flex-row items-center">
                            <Ionicons name="flash-outline" size={12} color={theme.colors.textMuted} />
                            <Text style={{ color: theme.colors.textMuted }} className="text-[9px] font-black uppercase tracking-widest ml-1">
                                {workout.exercises.length} EXERCÍCIOS • {workout.isAIGenerated ? 'IA' : 'SALVO'}
                            </Text>
                        </View>
                        <View className="flex-row gap-2">
                            {musclesNeedingAttention.slice(0, 2).map((m, i) => (
                                <View key={i} style={{ backgroundColor: theme.colors.primary + '10' }} className="px-1.5 py-0.5 rounded-md">
                                    <Text style={{ color: theme.colors.primary }} className="text-[8px] font-black uppercase">{m}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}
