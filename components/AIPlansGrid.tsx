import Palette from '../constants/palette.json';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSavedWorkouts } from '../context/SavedWorkoutsContext';
import { generatePersonalizedWorkout } from '../services/aiWorkoutService';
import { Skeleton } from './ui/Skeleton';

interface AIPlansGridProps {
    onPlanStart: (planId: string) => void;
}

export function AIPlansGrid({ onPlanStart }: AIPlansGridProps) {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { saveWorkout } = useSavedWorkouts();

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const focuses = ['full_body', 'upper', 'legs', 'pull'] as const;
            const generatedPlans = await Promise.all(focuses.map(async (focus, index) => {
                const workout = await generatePersonalizedWorkout({
                    focus, goal: 'hypertrophy', level: 'intermediate', gender: 'unspecified',
                    equipment: [], glute_priority: false,
                }, { useModel: false });
                return { ...workout, id: `catalog-plan-${index}`, description: 'Plano montado com exercícios do catálogo Strive', duration: '45 min', difficulty: 'Intermediário' };
            }));
            setPlans(generatedPlans);
        } catch (error) {
            console.error('Error loading AI plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPlans();
        setRefreshing(false);
    };

    const handleSavePlan = (plan: any) => {
        saveWorkout(plan.name, plan.exercises, undefined, true);
    };

    if (loading) {
        return (
            <View>
                <View className="flex-row justify-between items-center mb-3">
                    <Skeleton width={120} height={24} borderRadius={6} />
                </View>
                <View className="flex-row flex-wrap -mx-1.5">
                    {[1, 2, 3, 4].map((key) => (
                        <View key={key} className="w-1/2 px-1.5 mb-3">
                            <View className="bg-surface rounded-xl p-3 border border-surfaceHighlight">
                                <View className="flex-row items-start justify-between mb-2">
                                    <Skeleton width={80} height={16} borderRadius={4} />
                                    <Skeleton width={24} height={16} borderRadius={4} />
                                </View>
                                <Skeleton width="100%" height={80} borderRadius={8} className="mb-2" />
                                <Skeleton width="100%" height={12} borderRadius={4} className="mb-1" />
                                <Skeleton width="80%" height={12} borderRadius={4} className="mb-2" />
                                <View className="flex-row gap-2 mt-3">
                                    <Skeleton width="48%" height={32} borderRadius={8} />
                                    <Skeleton width="48%" height={32} borderRadius={8} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View>
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-text text-lg font-bold">Encontrar Planos</Text>
                <TouchableOpacity
                    onPress={handleRefresh}
                    disabled={refreshing}
                    className="flex-row items-center"
                >
                    <Ionicons
                        name="refresh"
                        size={18}
                        color={refreshing ? Palette.dark.textMuted : Palette.dark.info}
                    />
                    <Text className="text-primary text-sm ml-1">
                        {refreshing ? 'Atualizando...' : 'Atualizar'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap -mx-1.5">
                {plans.map((plan, index) => (
                    <View key={plan.id} className="w-1/2 px-1.5 mb-3">
                        <TouchableOpacity
                            onPress={() => onPlanStart(plan.id)}
                            className="bg-surface rounded-xl p-3 border border-surfaceHighlight"
                            activeOpacity={0.8}
                        >
                            {/* Plan Header with AI Badge */}
                            <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-1 mr-2">
                                    <Text className="text-text font-bold text-sm" numberOfLines={2}>
                                        {plan.name}
                                    </Text>
                                </View>
                                <View className="bg-primary rounded-full px-2 py-0.5">
                                    <Text className="text-white text-xs font-bold">Strive</Text>
                                </View>
                            </View>

                            {/* Image or Icon */}
                            {plan.exercises[0]?.image_url ? (
                                <Image
                                    source={{ uri: plan.exercises[0].image_url }}
                                    className="w-full h-20 rounded-lg mb-2"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-20 rounded-lg mb-2 bg-surfaceHighlight items-center justify-center">
                                    <Ionicons name="barbell" size={32} color={Palette.dark.textMuted} />
                                </View>
                            )}

                            {/* Plan Info */}
                            <Text className="text-text-muted text-xs mb-1" numberOfLines={2}>
                                {plan.description}
                            </Text>

                            <View className="flex-row items-center justify-between mt-1">
                                <View className="flex-row items-center">
                                    <Ionicons name="time-outline" size={12} color={Palette.dark.textMuted} />
                                    <Text className="text-text-muted text-xs ml-1">{plan.duration}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Ionicons name="fitness" size={12} color={Palette.dark.textMuted} />
                                    <Text className="text-text-muted text-xs ml-1">
                                        {plan.exercises.length} ex
                                    </Text>
                                </View>
                            </View>

                            {/* Difficulty Badge */}
                            <View className="mt-2">
                                <View
                                    className={`self-start px-2 py-0.5 rounded-full ${plan.difficulty === 'Iniciante'
                                        ? 'bg-green-500/20'
                                        : plan.difficulty === 'Intermediário'
                                            ? 'bg-yellow-500/20'
                                            : 'bg-red-500/20'
                                        }`}
                                >
                                    <Text
                                        className={`text-xs font-semibold ${plan.difficulty === 'Iniciante'
                                            ? 'text-green-400'
                                            : plan.difficulty === 'Intermediário'
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                            }`}
                                    >
                                        {plan.difficulty}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-2 mt-3">
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleSavePlan(plan);
                                    }}
                                    className="flex-1 bg-surfaceHighlight rounded-lg py-2 items-center"
                                >
                                    <Text className="text-text-muted text-xs font-semibold">Salvar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => onPlanStart(plan.id)}
                                    className="flex-1 bg-primary rounded-lg py-2 items-center"
                                >
                                    <Text className="text-white text-xs font-semibold">Iniciar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );
}
