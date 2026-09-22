import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

            {/* Workouts Horizontal Carousel */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6 }}
            >
                {workouts.map((workout, index) => (
                    <WorkoutCard
                        key={workout.id}
                        workout={workout}
                        onPress={() => onWorkoutPress(workout)}
                        onDelete={() => onDeleteWorkout(workout.id)}
                        onToggleFavorite={() => onToggleFavorite(workout.id)}
                        onEdit={() => handleEditPlan(workout)}
                        layout="vertical"
                        imageIndex={index + 1}
                        style={{
                            width: 220,
                            minWidth: 220,
                            maxWidth: 220,
                            marginRight: 12,
                        }}
                    />
                ))}

                {/* Add New Plan Card at the end */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleCreateNewPlan}
                    style={{
                        width: 140,
                        minWidth: 140,
                        borderRadius: Radius.lg,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: theme.colors.border,
                        backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                        marginRight: 8,
                    }}
                >
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                        }}
                    >
                        <Ionicons name="add" size={22} color={theme.colors.primary} />
                    </View>
                    <Text style={{ color: theme.colors.text, fontSize: 13, fontFamily: FontFamily.sansBold, textAlign: 'center' }}>
                        Nova Ficha
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: FontFamily.sans, textAlign: 'center', marginTop: 2 }}>
                        Montar treino
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
