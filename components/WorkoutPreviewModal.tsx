import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SavedWorkout, useSavedWorkouts } from '../context/SavedWorkoutsContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { ActiveWorkoutBanner } from './ActiveWorkoutBanner';
import { GradientButton } from './ui/GradientButton';

interface WorkoutPreviewModalProps {
    visible: boolean;
    workout: SavedWorkout | null;
    onClose: () => void;
    onStart: () => void;
    onToggleFavorite?: () => void;
    children?: React.ReactNode;
}

export function WorkoutPreviewModal({
    visible,
    workout,
    onClose,
    onStart,
    onToggleFavorite,
    children
}: WorkoutPreviewModalProps) {
    const { isWorkoutActive, clearWorkout } = useWorkoutStore();
    const { updateWorkout } = useSavedWorkouts();
    const router = useRouter();
    const pathname = usePathname();
    const params = useLocalSearchParams();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState<any>(null);
    const [editSets, setEditSets] = useState('');
    const [editReps, setEditReps] = useState('');

    // Helper to construct current return path
    const getReturnPath = () => {
        const queryString = Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        return queryString ? `${pathname}?${queryString}` : pathname;
    };

    const handleEditExercise = (exercise: any) => {
        setEditingExercise(exercise);
        setEditSets(exercise.sets?.length?.toString() || '3');
        setEditReps(exercise.sets?.[0]?.reps || '10');
        setShowEditModal(true);
    };

    const saveExerciseEdit = () => {
        if (!workout || !editingExercise) return;

        const setsCount = parseInt(editSets) || 3;
        const repsCount = editReps || '10';

        // Create new sets array
        const newSets = Array(setsCount).fill({
            reps: repsCount,
            kg: '',
            completed: false
        });

        const updatedExercises = workout.exercises.map(ex =>
            ex.id === editingExercise.id
                ? { ...ex, sets: newSets }
                : ex
        );

        updateWorkout(workout.id, { exercises: updatedExercises });
        setShowEditModal(false);
    };

    if (!workout) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

                {/* Header - Compact Premium Style */}
                <View style={{ paddingTop: insets.top + 10, paddingBottom: 16, paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                backgroundColor: theme.colors.card,
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: theme.colors.border
                            }}
                        >
                            <Ionicons name="close" size={20} color={theme.colors.text} />
                        </TouchableOpacity>

                        {/* Modern Edit Plan Button */}
                        <TouchableOpacity
                            onPress={() => {
                                onClose();
                                router.push({ pathname: '/workout', params: { editPlanId: workout.id, isCreatingPlan: 'true' } });
                            }}
                            activeOpacity={0.75}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 14,
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}
                        >
                            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }}>
                                Editar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 }}>
                        {workout.name}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                            <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '500' }}>
                                Criado em {new Date(workout.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                        {workout.lastDone && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, marginRight: 12 }} />
                                <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                                <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '500' }}>
                                    Última vez: {workout.lastDone === 'Agora' ? 'Hoje' : workout.lastDone}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {children}

                {/* Exercise List - Modern Cards */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
                        Exercícios ({workout.exercises.length})
                    </Text>

                    {workout.exercises.map((exercise, index) => (
                        <View
                            key={`${exercise.id}-${index}`}
                            style={{
                                flexDirection: 'row',
                                backgroundColor: theme.colors.card,
                                borderRadius: 18,
                                marginBottom: 10,
                                padding: 10,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}
                        >
                            {/* Image Container - Click to View Details */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    router.push({
                                        pathname: '/exercise/[id]',
                                        params: {
                                            id: exercise.id,
                                            source: 'preview',
                                            workoutId: workout.id
                                        }
                                    });
                                }}
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 12,
                                    backgroundColor: theme.colors.backgroundTertiary,
                                    overflow: 'hidden',
                                    marginRight: 14,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {exercise.image_url ? (
                                    <>
                                        <Image
                                            source={{ uri: exercise.image_url }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                        {exercise.video_url && (
                                            <View style={{
                                                position: 'absolute',
                                                inset: 0,
                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Ionicons name="play" size={16} color="white" />
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <Ionicons name="barbell" size={20} color={theme.colors.textMuted} />
                                )}
                            </TouchableOpacity>

                            {/* Info */}
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => {
                                    router.push({
                                        pathname: '/exercise/[id]',
                                        params: {
                                            id: exercise.id,
                                            source: 'preview',
                                            workoutId: workout.id
                                        }
                                    });
                                }}
                            >
                                <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 }}>
                                    {exercise.name}
                                </Text>
                                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                                    {(exercise.sets && exercise.sets.length > 0)
                                        ? `${exercise.sets.length} séries • ${exercise.sets[0].reps} reps`
                                        : '3 séries • 10 reps'
                                    }
                                </Text>
                            </TouchableOpacity>

                            {/* Modern Edit Exercise Button */}
                            <TouchableOpacity
                                onPress={() => handleEditExercise(exercise)}
                                activeOpacity={0.7}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 12,
                                    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: theme.colors.border,
                                    marginLeft: 6,
                                }}
                            >
                                <Ionicons name="create-outline" size={17} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    ))}

                </ScrollView>

                {/* Bottom Start Button - Floating & Premium */}
                {!isWorkoutActive ? (
                    <View style={{
                        position: 'absolute',
                        bottom: Math.max(insets.bottom, 24) + 24,
                        left: 20,
                        right: 20
                    }}>
                        <GradientButton
                            onPress={onStart}
                            style={{
                                borderRadius: 20,
                                shadowColor: theme.colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: theme.mode === 'light' ? 0.22 : 0.3,
                                shadowRadius: 12,
                                elevation: 6
                            }}
                            gradientStyle={{
                                paddingVertical: 16,
                                flexDirection: 'row',
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="play" size={20} color={theme.colors.onPrimary} style={{ marginRight: 8 }} />
                            <Text style={{ color: theme.colors.onPrimary, fontSize: 18, fontWeight: '700' }}>
                                Iniciar Treino
                            </Text>
                        </GradientButton>
                    </View>
                ) : (
                    // Active Workout Notification Footer
                    <View
                        style={{ bottom: Math.max(insets.bottom, 24) + 24 }}
                        className="absolute left-4 right-4 z-50"
                    >
                        <ActiveWorkoutBanner
                            onPress={() => {
                                onClose();
                                router.push({
                                    pathname: '/workout',
                                    params: { tab: 'active', returnTo: getReturnPath() }
                                });
                            }}
                        />
                    </View>
                )}

                {/* Quick Edit Target Sets/Reps Modal */}
                <Modal
                    visible={showEditModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowEditModal(false)}
                >
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20
                    }}>
                        <View style={{
                            backgroundColor: theme.colors.card,
                            borderRadius: 24,
                            padding: 24,
                            width: '100%',
                            maxWidth: 340,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.3,
                            shadowRadius: 20,
                            elevation: 10
                        }}>
                            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                                Editar Meta do Exercício
                            </Text>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 20 }} numberOfLines={1}>
                                {editingExercise?.name}
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                                        SÉRIES
                                    </Text>
                                    <TextInput
                                        value={editSets}
                                        onChangeText={setEditSets}
                                        keyboardType="number-pad"
                                        style={{
                                            backgroundColor: theme.colors.background,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: theme.colors.border,
                                            paddingVertical: 12,
                                            paddingHorizontal: 16,
                                            color: theme.colors.text,
                                            fontSize: 16,
                                            fontWeight: '700',
                                            textAlign: 'center'
                                        }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                                        REPETIÇÕES
                                    </Text>
                                    <TextInput
                                        value={editReps}
                                        onChangeText={setEditReps}
                                        keyboardType="number-pad"
                                        style={{
                                            backgroundColor: theme.colors.background,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: theme.colors.border,
                                            paddingVertical: 12,
                                            paddingHorizontal: 16,
                                            color: theme.colors.text,
                                            fontSize: 16,
                                            fontWeight: '700',
                                            textAlign: 'center'
                                        }}
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => setShowEditModal(false)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 14,
                                        borderRadius: 14,
                                        backgroundColor: theme.colors.backgroundTertiary,
                                        alignItems: 'center'
                                    }}
                                >
                                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={saveExerciseEdit}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 14,
                                        borderRadius: 14,
                                        backgroundColor: theme.colors.primary,
                                        alignItems: 'center'
                                    }}
                                >
                                    <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>Salvar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
}
