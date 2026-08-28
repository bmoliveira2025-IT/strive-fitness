import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MUSCLE_IMAGES } from '../constants/muscleImages';
import { PROGRAMS } from '../constants/programs';
import { useSavedWorkouts } from '../context/SavedWorkoutsContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { GradientButton } from '../components/ui/GradientButton';

const exercisesData = require('../assets/exercises.json');

export default function WorkoutPreviewScreen() {
    const params = useLocalSearchParams<{ id: string, type: 'program' | 'saved', dayIndex?: string }>();
    const router = useRouter();
    const { savedWorkouts, updateWorkout, setIsCreatingPlan } = useSavedWorkouts();
    const { loadWorkout, isWorkoutActive, clearWorkout } = useWorkoutStore();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const bottomActionClearance = Math.max(insets.bottom, 24) + 28;

    // Helper to get muscle image with consistent mapping
    const getMuscleImage = (part: string) => {
        if (!part) return null;
        const key = part.toLowerCase().trim();

        const map: Record<string, string> = {
            'chest': 'Peito', 'peito': 'Peito',
            'back': 'Costas', 'costas': 'Costas',
            'shoulders': 'Ombros', 'ombros': 'Ombros',
            'biceps': 'Bíceps', 'bíceps': 'Bíceps',
            'triceps': 'Tríceps', 'tríceps': 'Tríceps',
            'forearms': 'Bíceps', 'antebraços': 'Bíceps',
            'abs': 'Abdômen', 'abdominais': 'Abdômen', 'waist': 'Abdômen', 'abdomen': 'Abdômen', 'core': 'Abdômen',
            'quadriceps': 'Quadríceps', 'quadríceps': 'Quadríceps', 'legs': 'Quadríceps', 'thighs': 'Quadríceps', 'pernas': 'Quadríceps',
            'hamstrings': 'Isquiotibiais', 'isquiotibiais': 'Isquiotibiais',
            'calves': 'Panturrilhas', 'panturrilhas': 'Panturrilhas',
            'hips': 'Glúteos', 'quadris': 'Glúteos', 'glutes': 'Glúteos',
            'neck': 'Costas', 'pescoço': 'Costas'
        };

        const displayName = map[key] || part.charAt(0).toUpperCase() + part.slice(1);
        return (MUSCLE_IMAGES as any)[displayName] || null;
    };

    // Resolve Workout Data
    const workout = React.useMemo(() => {
        if (params.type === 'program') {
            const program = PROGRAMS.find(p => p.id === params.id);
            if (!program) return null;

            const dayIndex = params.dayIndex ? parseInt(params.dayIndex) : 0;
            const day = program.days[dayIndex];

            const exercises = day.exerciseIds.map(id => {
                const ex = exercisesData.find((e: any) => e.id.toString() === id);
                return ex ? { ...ex, sets: [{ reps: '10', kg: '0', completed: false }] } : null;
            }).filter(Boolean);

            return {
                id: program.id,
                name: `${program.title} - ${day.name}`,
                lastDone: 'Never',
                createdAt: new Date().toISOString(),
                exercises: exercises
            };
        } else {
            return savedWorkouts.find(w => w.id === params.id);
        }
    }, [params.id, params.type, params.dayIndex, savedWorkouts]);

    if (!workout) {
        return (
            <View style={{ backgroundColor: theme.colors.background }} className="flex-1 justify-center items-center">
                <Text style={{ color: theme.colors.text }}>Treino não encontrado</Text>
            </View>
        );
    }

    const handleOpenVideo = (exercise: any) => {
        router.push({ pathname: '/exercise/[id]', params: { id: exercise.id, source: 'preview' } });
    };

    const handleStartWorkout = () => {
        if (!workout) return;

        loadWorkout(workout.name, workout.exercises);

        const returnTo = `/preview?id=${params.id}&type=${params.type}&dayIndex=${params.dayIndex || 0}`;

        router.replace({
            pathname: '/(tabs)/workout',
            params: { returnTo }
        });
    };

    return (
        <View style={{ backgroundColor: theme.colors.background }} className="flex-1">
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={{ backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }} className="pt-12 pb-4 px-4 border-b flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View className="flex-1 ml-4">
                    <Text style={{ color: theme.colors.text }} className="text-xl font-bold" numberOfLines={1}>
                        {workout.name}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted }} className="text-sm">
                        {workout.exercises.length} Exercícios
                    </Text>
                </View>
                {params.type === 'saved' && (
                    <TouchableOpacity
                        onPress={() => {
                            setIsCreatingPlan(true);
                            router.push({
                                pathname: '/workout',
                                params: { editPlanId: workout.id }
                            });
                        }}
                        className="p-2"
                    >
                        <Ionicons name="pencil" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Exercise List */}
            <FlatList
                style={{ flex: 1 }}
                data={workout.exercises}
                keyExtractor={(exercise: any, index) => `${exercise.id}-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 + bottomActionClearance }}
                initialNumToRender={5}
                maxToRenderPerBatch={4}
                updateCellsBatchingPeriod={50}
                windowSize={5}
                removeClippedSubviews
                renderItem={({ item: exercise }: { item: any }) => (
                    <View className="bg-transparent mb-5">
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={() => {
                                    handleOpenVideo(exercise);
                                }}
                                style={{ backgroundColor: theme.colors.card }}
                                className="rounded-xl overflow-hidden w-20 h-20 justify-center items-center"
                            >
                                {exercise.image_url ? (
                                    <View>
                                        <Image
                                            source={{ uri: exercise.image_url }}
                                            style={{ width: 80, height: 80 }}
                                            contentFit="cover"
                                            cachePolicy="memory-disk"
                                        />
                                        {exercise.video_url && (
                                            <View className="absolute inset-0 items-center justify-center bg-black/20">
                                                <Ionicons name="play" size={20} color="white" />
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View className="w-20 h-20 items-center justify-center">
                                        <Ionicons name="barbell" size={28} color={theme.colors.textMuted} />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 ml-4"
                                onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: exercise.id, source: 'preview' } })}
                            >
                                <View>
                                    <Text style={{ color: theme.colors.text }} className="font-bold text-xl mb-1" numberOfLines={2}>
                                        {exercise.name}
                                    </Text>
                                    <Text style={{ color: theme.colors.textSecondary }} className="text-lg">
                                        {exercise.sets ? exercise.sets.length : 3} Séries • {exercise.sets && exercise.sets[0] ? exercise.sets[0].reps : '10'} reps
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Bottom Actions */}
            {!isWorkoutActive ? (
                <View
                    style={{
                        backgroundColor: theme.colors.background,
                        borderTopColor: theme.colors.border,
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        paddingBottom: bottomActionClearance,
                    }}
                    className="border-t absolute bottom-0 left-0 right-0"
                >
                    <GradientButton
                        onPress={handleStartWorkout}
                        style={{
                            borderRadius: 24,
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: theme.mode === 'light' ? 0.2 : 0.1,
                            shadowRadius: 10,
                            elevation: 4
                        }}
                        gradientStyle={{
                            paddingVertical: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="play" size={20} color={theme.colors.onPrimary} />
                        <Text style={{ color: theme.colors.onPrimary }} className="font-bold text-xl ml-2">
                            Iniciar Treino
                        </Text>
                    </GradientButton>
                </View>
            ) : (
                // Active Workout Footer
                <View
                    style={{ bottom: bottomActionClearance }}
                    className="absolute left-4 right-4 z-50"
                >
                    <View
                        style={{
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.border,
                            shadowColor: theme.colors.shadow,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 10,
                        }}
                        className="border p-4 rounded-xl shadow-lg"
                    >
                        <Text style={{ color: theme.colors.text }} className="text-center font-medium mb-3">Treino em Andamento</Text>

                        <View className="flex-row justify-between items-center px-4">
                            <TouchableOpacity
                                onPress={() => {
                                    router.push({
                                        pathname: '/workout',
                                        params: { returnTo: `/preview?id=${params.id}&type=${params.type}&dayIndex=${params.dayIndex || 0}` }
                                    });
                                }}
                                style={{ backgroundColor: theme.colors.primary }}
                                className="px-4 py-2 rounded-lg"
                            >
                                <Text style={{ color: theme.colors.onPrimary }} className="font-bold">Retornar ao Treino</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    clearWorkout();
                                }}
                                className="bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/30"
                            >
                                <Text className="text-red-500 font-bold">Descartar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}
