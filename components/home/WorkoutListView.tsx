import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SavedWorkout } from '../../context/SavedWorkoutsContext';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutCard } from '../WorkoutCard';
import { FontFamily, Radius } from '../../constants/theme';

interface WorkoutListViewProps {
    workouts: SavedWorkout[];
    onWorkoutPress: (workout: SavedWorkout) => void;
    onDeleteWorkout: (id: string) => void;
    onToggleFavorite: (id: string) => void;
}

export function WorkoutListView({
    workouts,
    onWorkoutPress,
    onDeleteWorkout,
    onToggleFavorite
}: WorkoutListViewProps) {
    const { theme } = useTheme();
    const router = useRouter();

    const handleCreateNewPlan = () => {
        router.push({
            pathname: '/workout',
            params: { isCreatingPlan: 'true' }
        });
    };

    const handleEditPlan = (workout: SavedWorkout) => {
        router.push({
            pathname: '/workout',
            params: { isCreatingPlan: 'true', editPlanId: workout.id }
        });
    };

    if (workouts.length === 0) return null;

    return (
        <View style={{ marginBottom: 20 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                        <Text
                            numberOfLines={1}
                            style={{
                                color: theme.colors.text,
                                fontSize: 18,
                                fontFamily: FontFamily.display,
                                letterSpacing: -0.3,
                            }}
                        >
                            Meus Planos
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{
                                color: theme.colors.textSecondary,
                                fontSize: 12,
                                fontFamily: FontFamily.sans,
                                marginTop: 2,
                            }}
                        >
                            Rotinas e fichas salvas
                        </Text>
                    </View>

                    {/* Quick Create / Edit Routine Button */}
                    <TouchableOpacity
                        onPress={handleCreateNewPlan}
                        activeOpacity={0.8}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: Radius.full,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                        }}
                    >
                        <Ionicons name="add-circle" size={16} color={theme.colors.primary} />
                        <Text
                            style={{
                                color: theme.colors.text,
                                fontSize: 12,
                                fontFamily: FontFamily.sansSemiBold,
                            }}
                        >
                            Criar Ficha
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Workouts List */}
            <View style={{ paddingHorizontal: 20 }}>
                {workouts.slice(0, 3).map((workout, index) => (
                    <WorkoutCard
                        key={workout.id}
                        workout={workout}
                        onPress={() => onWorkoutPress(workout)}
                        onDelete={() => onDeleteWorkout(workout.id)}
                        onToggleFavorite={() => onToggleFavorite(workout.id)}
                        onEdit={() => handleEditPlan(workout)}
                        layout="horizontal"
                        imageIndex={index + 1}
                    />
                ))}

                {/* View All Button */}
                {workouts.length > 3 && (
                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => router.push({ pathname: '/workout', params: { tab: 'library' } })}
                        style={{
                            backgroundColor: theme.colors.backgroundTertiary,
                            paddingVertical: 12,
                            borderRadius: Radius.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            marginTop: 8,
                            borderColor: theme.colors.border,
                            borderWidth: 1,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.colors.text,
                                fontSize: 13,
                                fontFamily: FontFamily.sansSemiBold,
                            }}
                        >
                            Ver todos os {workouts.length} planos
                        </Text>
                        <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
