import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { getExerciseMuscleActivation } from '../services/muscleActivation';
import { AnatomicalMuscleBody, MuscleColorMap } from './dashboard/AnatomicalMuscleBody';
import { WorkoutVideo, WorkoutVideoHandle } from './media/WorkoutVideo';
// @ts-ignore
import exercises from '../assets/exercises.json';

// Translation dictionaries (copied from original)
const BODY_PART_TRANSLATION: Record<string, string> = {
    'chest': 'Peito',
    'back': 'Costas',
    'upper back': 'Costas Superiores',
    'lower back': 'Costas Inferiores',
    'biceps': 'Bíceps',
    'triceps': 'Tríceps',
    'quadriceps': 'Quadríceps',
    'hamstrings': 'Posteriores',
    'shoulders': 'Ombros',
    'hips': 'Quadris',
    'waist': 'Cintura',
    'upper arms': 'Braços',
    'calves': 'Panturrilhas',
    'forearms': 'Antebraços',
    'neck': 'Pescoço',
    'cardio': 'Cardio',
    'glutes': 'Glúteos',
    'abs': 'Abdômen',
};

const EQUIPMENT_TRANSLATION: Record<string, string> = {
    'barbell': 'Barra',
    'dumbbell': 'Halter',
    'cable': 'Cabo',
    'machine': 'Máquina',
    'body weight': 'Peso Corporal',
    'kettlebell': 'Kettlebell',
    'resistance band': 'Faixa Elástica',
    'bench': 'Banco',
    'none': 'Nenhum',
};

interface ExerciseDetailContentProps {
    exerciseId: string;
    onClose?: () => void; // Optional: for modal usage
    isModal?: boolean;
}

export function ExerciseDetailContent({ exerciseId, onClose, isModal = false }: ExerciseDetailContentProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();

    // Find exercise
    const exercise = exercises.find((e: any) => e.id.toString() === exerciseId);
    const isExerciseFavorite = isFavorite(exerciseId);

    // Video State
    const video = useRef<WorkoutVideoHandle>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [muscleView, setMuscleView] = useState<'Front' | 'Back'>('Front');

    const muscleActivation = useMemo(
        () => exercise ? getExerciseMuscleActivation(exercise) : {},
        [exercise]
    );
    const activationColor = (intensity: number) => {
        if (intensity <= 30) return '#2563EB';
        if (intensity <= 60) return '#FACC15';
        if (intensity <= 80) return '#F97316';
        return '#EF4444';
    };
    const muscleColors = useMemo<MuscleColorMap>(() => Object.fromEntries(
        Object.entries(muscleActivation).map(([muscle, intensity]) => [muscle, activationColor(intensity || 0)])
    ), [muscleActivation]);

    if (!exercise) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <Text style={{ color: theme.colors.text }}>Exercício não encontrado.</Text>
            </View>
        );
    }

    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>

            {/* Conditional Header for Modal Mode */}
            {isModal && (
                <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: theme.colors.background }}>
                    <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                        <Ionicons name="close" size={28} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: 0,
                    paddingBottom: insets.bottom + 40
                }}
            >
                {/* Video Section */}
                {exercise.video_url && (
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => {
                            if (isVideoPlaying) {
                                video.current?.pause();
                            } else {
                                video.current?.play();
                            }
                        }}
                        style={{ backgroundColor: theme.colors.card }}
                        className="w-full h-96 mb-6 relative justify-center items-center rounded-b-3xl overflow-hidden"
                    >
                        <WorkoutVideo
                            ref={video}
                            sourceUrl={exercise.video_url}
                            volume={1.0}
                            muted={false}
                            autoPlay
                            loop
                            controls={false}
                            style={{ width: '100%', height: '100%' }}
                            onPlayingChange={setIsVideoPlaying}
                        />
                        {/* Play/Pause Overlay */}
                        {!isVideoPlaying && (
                            <View className="absolute bg-black/40 p-4 rounded-full">
                                <Ionicons name="play" size={48} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {!exercise.video_url && exercise.image_url && (
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ backgroundColor: theme.colors.card }}
                        className="w-full h-96 mb-6 relative justify-center items-center rounded-b-3xl overflow-hidden"
                    >
                        <Image
                            source={{ uri: exercise.image_url }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />
                    </TouchableOpacity>
                )}

                <View className="px-6">
                    {/* Header */}
                    <View className="items-center mb-4">
                        <Text style={{ color: theme.colors.text }} className="text-3xl font-bold text-center leading-tight mb-4">
                            {exercise.name}
                        </Text>

                        {/* Tags Row */}
                        <View className="flex-row flex-wrap justify-center gap-2">
                            {/* Body Part Tag */}
                            {exercise.body_parts && (
                                <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }} className="px-3 py-1 rounded-lg border">
                                    <Text className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                                        {Array.isArray(exercise.body_parts)
                                            ? (BODY_PART_TRANSLATION[exercise.body_parts[0].toLowerCase()] || exercise.body_parts[0])
                                            : (BODY_PART_TRANSLATION[(exercise.body_parts as string).toLowerCase()] || exercise.body_parts)}
                                    </Text>
                                </View>
                            )}

                            {/* Equipment Tag */}
                            {exercise.equipment && (
                                <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }} className="px-3 py-1 rounded-lg border">
                                    <Text style={{ color: theme.colors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">
                                        {Array.isArray(exercise.equipment)
                                            ? (EQUIPMENT_TRANSLATION[exercise.equipment[0].toLowerCase()] || exercise.equipment[0])
                                            : (EQUIPMENT_TRANSLATION[(exercise.equipment as string).toLowerCase()] || exercise.equipment)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Quick Tools Row (Favorites, etc) */}
                    <View className="flex-row justify-center gap-4 mb-6">
                        <TouchableOpacity
                            onPress={() => toggleFavorite(exerciseId)}
                            style={{
                                backgroundColor: isExerciseFavorite ? 'rgba(239, 68, 68, 0.2)' : theme.colors.card,
                                borderColor: isExerciseFavorite ? theme.colors.error : theme.colors.border
                            }}
                            className={`flex-row items-center px-4 py-2 rounded-full border`}
                        >
                            <Ionicons name={isExerciseFavorite ? "heart" : "heart-outline"} size={20} color={isExerciseFavorite ? theme.colors.error : theme.colors.textMuted} />
                            <Text style={{ color: isExerciseFavorite ? theme.colors.error : theme.colors.textSecondary }} className="ml-2 font-medium">
                                Favoritos
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Exercise-specific biomechanical muscle map */}
                    <View className="mb-6 w-full">
                        <Text style={{ color: theme.colors.textMuted }} className="uppercase text-xs font-bold tracking-widest mb-2 pl-1">
                            ATIVAÇÃO MUSCULAR ESTIMADA
                        </Text>
                        <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: 20 }} className="w-full items-center justify-center p-3 border">
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                                {(['Front', 'Back'] as const).map((side) => (
                                    <TouchableOpacity
                                        key={side}
                                        onPress={() => setMuscleView(side)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: muscleView === side }}
                                        style={{
                                            minHeight: 44,
                                            paddingHorizontal: 18,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: muscleView === side ? theme.colors.primary : theme.colors.backgroundSecondary,
                                        }}
                                    >
                                        <Text style={{ color: muscleView === side ? theme.colors.onPrimary : theme.colors.textSecondary, fontWeight: '700' }}>
                                            {side === 'Front' ? 'Frente' : 'Costas'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <AnatomicalMuscleBody
                                viewSide={muscleView}
                                colors={muscleColors}
                                intensities={muscleActivation}
                                width={230}
                                height={345}
                                onToggleSide={() => setMuscleView((side) => side === 'Front' ? 'Back' : 'Front')}
                            />
                            <View style={{ width: '100%', gap: 8, marginTop: 4 }}>
                                {Object.entries(muscleActivation)
                                    .sort(([, a], [, b]) => (b || 0) - (a || 0))
                                    .map(([muscle, intensity]) => (
                                        <View key={muscle} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: activationColor(intensity || 0) }} />
                                            <Text style={{ color: theme.colors.text, flex: 1, fontWeight: '600' }}>{muscle}</Text>
                                            <Text style={{ color: theme.colors.textSecondary, fontVariant: ['tabular-nums'] }}>{Math.round(intensity || 0)}%</Text>
                                        </View>
                                    ))}
                            </View>
                        </View>
                    </View>

                    {/* Instructions / Description */}
                    {exercise.description && (
                        <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }} className="mb-4 p-4 rounded-2xl border">
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="information-circle-outline" size={20} color={theme.colors.textMuted} />
                                <Text style={{ color: theme.colors.textMuted }} className="uppercase text-xs font-bold tracking-widest ml-2">
                                    SOBRE
                                </Text>
                            </View>
                            <Text style={{ color: theme.colors.text }} className="leading-7 text-base">
                                {exercise.description}
                            </Text>
                        </View>
                    )}

                    {exercise.instructions && (
                        <View className="mb-8">
                            <Text style={{ color: theme.colors.textMuted }} className="uppercase text-xs font-bold tracking-widest mb-4 pl-1">
                                INSTRUÇÕES
                            </Text>
                            {exercise.instructions.map((step: string, index: number) => (
                                <View key={index} className="flex-row mb-4">
                                    <Text style={{ color: theme.colors.primary }} className="font-bold mr-4 text-lg">{index + 1}.</Text>
                                    <Text style={{ color: theme.colors.text }} className="flex-1 leading-7 text-base pt-0.5">{step}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Tips */}
                    {exercise.tips && exercise.tips.length > 0 && (
                        <View className="mt-6 bg-yellow-500/10 p-5 rounded-2xl border border-yellow-500/20">
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="bulb" size={20} color={theme.colors.warning} />
                                <Text className="text-yellow-600 font-bold text-sm uppercase tracking-wider ml-2">Dica Pro</Text>
                            </View>
                            {exercise.tips.map((tip: string, index: number) => (
                                <Text key={index} className="text-yellow-600/80 mb-2 leading-6 pl-2 border-l-2 border-yellow-500/30 text-sm">• {tip}</Text>
                            ))}
                        </View>
                    )}

                </View>
            </ScrollView>
        </View>
    );
}
