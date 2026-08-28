import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useMuscleTracker } from '../../context/MuscleTrackerContext';
import { useSavedWorkouts } from '../../context/SavedWorkoutsContext';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { clearAIPlansCache, generateWorkoutPlans } from '../../services/aiWorkoutService';
import { recommendationEngine } from '../../utils/recommendationEngine';
import { ActivityIndicator } from 'react-native';

// Helper functions defined OUTSIDE component to avoid hoisting issues
const getPriorityScore = (status: string) => {
    switch (status) {
        case 'undertrained': return 10;
        case 'overreaching': return 8;
        case 'accumulating': return 5;
        case 'recovered': return 1;
        default: return 0;
    }
};

const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E'; // Green
    if (score >= 50) return '#EAB308'; // Yellow
    return '#EF4444'; // Red
};

export function SmartCoach() {
    const { theme } = useTheme();
    const router = useRouter();
    const { muscleStats } = useMuscleTracker();
    const { savedWorkouts, saveWorkout } = useSavedWorkouts();
    const { history } = useWorkoutHistory();
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Sort muscles: 
    // 1. Undertrained (Yellow) first
    // 2. Overreaching (Red) second
    // 3. Accumulating (Blue)
    // 4. Recovered (Green)
    const sortedMuscles = useMemo(() => {
        if (!muscleStats) return [];
        return Object.values(muscleStats).sort((a, b) => {
            const scoreA = getPriorityScore(a.status);
            const scoreB = getPriorityScore(b.status);
            return scoreB - scoreA; // High priority first
        });
    }, [muscleStats]);

    const StatusBadge = ({ status }: { status: string }) => {
        let color = theme.colors.primary;
        let text = 'Neutro';
        let bg = 'bg-primary/10';

        switch (status) {
            case 'undertrained':
                color = theme.mode === 'light' ? '#92400E' : '#EAB308'; // Amber-800 for light mode
                text = 'Subtreinado';
                bg = theme.mode === 'light' ? 'bg-amber-100' : 'bg-yellow-500/20';
                break;
            case 'overreaching':
                color = '#EF4444'; // Red-500
                text = 'Sobrecarga';
                bg = 'bg-red-500/20';
                break;
            case 'recovered':
                color = '#22C55E'; // Green-500
                text = 'Volume Ideal';
                bg = 'bg-green-500/20';
                break;
            case 'accumulating':
                color = theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary;
                text = 'Em Progresso';
                bg = theme.mode === 'light' ? 'bg-primary/20' : 'bg-primary/20';
                break;
        }

        return (
            <View className={`px-2 py-1 rounded-md ${bg} self-start`}>
                <Text style={{ color }} className="text-[10px] font-bold uppercase">{text}</Text>
            </View>
        );
    };

    // Coach AI Insights
    const coachInsight = useMemo(() => {
        if (!sortedMuscles.length) return null;

        const undertrained = sortedMuscles.filter(m => m.status === 'undertrained');
        const longGap = sortedMuscles.filter(m => {
            const lastTrainedDate = m.lastTrained ? new Date(m.lastTrained) : null;
            return lastTrainedDate && (new Date().getTime() - lastTrainedDate.getTime()) / (1000 * 60 * 60 * 24) >= 4;
        });

        if (longGap.length > 0) {
            const m = longGap[0];
            const days = Math.floor((new Date().getTime() - new Date(m.lastTrained!).getTime()) / (1000 * 60 * 60 * 24));
            return {
                message: `Você não treina ${m.name} há ${days} dias. Focar nisso hoje manterá sua simetria impecável. ✨`,
                focusMuscles: [m.name]
            };
        }

        if (undertrained.length > 0) {
            return {
                message: `Notei que o seu volume de ${undertrained[0].name} está abaixo da meta semanal. Vamos ajustar isso?`,
                focusMuscles: [undertrained[0].name]
            };
        }

        return {
            message: "Tudo em ordem com seu plano! Continue firme na consistência para extrair o máximo de performance.",
            focusMuscles: []
        };
    }, [sortedMuscles]);

    // Foco do Dia Logic within the new layout
    const dailyFocus = useMemo(() => {
        const undertrained = sortedMuscles.filter(m => m.status === 'undertrained').slice(0, 2);
        if (undertrained.length > 0) {
            return {
                title: "Prioridade sugerida",
                names: undertrained.map(m => m.name).join(' + '),
                reason: "Abaixo da meta semanal",
                icon: "flash"
            };
        }
        const overreaching = sortedMuscles.filter(m => m.status === 'overreaching').slice(0, 1);
        if (overreaching.length > 0) {
            return {
                title: "Recuperação",
                names: overreaching[0].name,
                reason: "Recuperação prioritária",
                icon: "bed"
            };
        }
        return {
            title: "Plano Ideal",
            names: "Manutenção",
            reason: "Foco livre hoje",
            icon: "checkmark-done-circle"
        };
    }, [sortedMuscles]);

    // Get workout recommendation
    const workoutRecommendation = useMemo(() => {
        if (!savedWorkouts || savedWorkouts.length === 0 || !muscleStats) return null;

        const validWorkouts = savedWorkouts.filter(w => w && w.id && w.exercises && w.exercises.length > 0);
        if (validWorkouts.length === 0) return null;

        return recommendationEngine.getBestRecommendation(validWorkouts, muscleStats, history);
    }, [savedWorkouts, muscleStats, history]);

    // Generate AI workout for specific muscle focus
    const handleGenerateAIWorkout = async (focusNames: string) => {
        if (!muscleStats || isGeneratingAI) return;

        setIsGeneratingAI(true);
        try {
            const focusMuscles = focusNames.split(' + ');
            // Clear cache before generating
            await clearAIPlansCache();
            const result = await generateWorkoutPlans(focusNames, focusMuscles);

            if (result && result.length > 0) {
                let workout = result[0];
                const searchTerms = focusNames.toLowerCase().split(' + ');

                const bestMatch = result.find(p =>
                    p.exercises.length > 0 &&
                    searchTerms.some(term => p.name.toLowerCase().includes(term))
                );

                if (bestMatch) workout = bestMatch;

                if (!workout.exercises || workout.exercises.length === 0) {
                    setIsGeneratingAI(false);
                    return;
                }

                saveWorkout(focusNames, workout.exercises, 'IA', true);
                router.push({ pathname: '/workout', params: { _t: Date.now().toString(), returnTo: '/' } });
            }
        } catch (error) {
            console.error('Error generating AI workout:', error);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    return (
        <View className="mb-8">
            {/* Premium AI Assistant Card */}
            <View className="px-6 mb-6 mt-4">
                <Animated.View
                    entering={FadeInUp.delay(200).duration(1000).springify()}
                    style={{
                        borderRadius: 32,
                        overflow: 'hidden',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 20 },
                        shadowOpacity: 0.25,
                        shadowRadius: 30,
                        elevation: 10,
                        minHeight: 200
                    }}
                >
                    <ImageBackground
                        source={require('../../assets/back_bg.png')}
                        style={{ flex: 1 }}
                        imageStyle={{ borderRadius: 32 }}
                    >
                        {/* Ultra Deep Cinematic Overlay - MOODY 95% */}
                        <LinearGradient
                            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.95)']}
                            style={{ position: 'absolute', inset: 0 }}
                        />

                        {/* Top Lens Flare / Gloss */}
                        <LinearGradient
                            colors={['rgba(255,255,255,0.15)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.5, y: 0.5 }}
                            style={{ position: 'absolute', inset: 0 }}
                        />

                        <View className="p-6">
                            <View className="flex-row items-center justify-between mb-6">
                                <View className="flex-row items-center flex-1 mr-4">
                                    <View
                                        style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }}
                                        className="p-2.5 rounded-xl mr-3"
                                    >
                                        <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
                                    </View>
                                    <View className="flex-1">
                                        <Text style={{ color: '#FFF', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} className="text-sm font-black italic uppercase tracking-tighter" numberOfLines={1}>Strive Analytics</Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} className="text-[9px] font-bold uppercase tracking-[1.5px] mt-0.5">ANALÍTICO V2.5</Text>
                                    </View>
                                </View>

                                <View
                                    className="flex-row items-center bg-green-500/20 px-2.5 py-1 rounded-full border border-green-500/40"
                                    style={{ flexShrink: 0, minWidth: 60, justifyContent: 'center' }}
                                >
                                    <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 shadow-sm" style={{ shadowColor: '#22C55E', shadowRadius: 4, shadowOpacity: 1 }} />
                                    <Text className="text-green-500 text-[9px] font-black uppercase tracking-wider">ATIVO</Text>
                                </View>
                            </View>

                            <Animated.Text
                                entering={FadeInDown.delay(200).duration(600)}
                                style={{
                                    color: '#FFF',
                                    fontSize: 19,
                                    fontWeight: '900',
                                    letterSpacing: -0.5,
                                    lineHeight: 26,
                                    marginBottom: 16,
                                    fontStyle: 'italic',
                                    textShadowColor: 'rgba(0,0,0,0.9)',
                                    textShadowOffset: { width: 0, height: 2 },
                                    textShadowRadius: 8
                                }}
                            >
                                “{coachInsight?.message}”
                            </Animated.Text>

                            <View className="flex-row items-center justify-between mt-auto pt-5 border-t" style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}>
                                <View className="flex-row gap-2">
                                    {coachInsight?.focusMuscles.map((m, i) => (
                                        <View key={i} style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                            <Text style={{ color: '#000' }} className="text-[9px] font-black uppercase">{m}</Text>
                                        </View>
                                    ))}
                                </View>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} className="text-[9px] font-black uppercase tracking-widest">MODEL: STRIVE-CORE</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </Animated.View>

                {/* Integrated Attached Sugestão/AI Card */}
                <Animated.View
                    entering={FadeInDown.delay(600).duration(800)}
                    style={{ marginTop: -20, paddingHorizontal: 16, zIndex: -1 }}
                >
                    {workoutRecommendation ? (
                        <TouchableOpacity
                            onPress={() => {
                                router.push({
                                    pathname: '/workout',
                                    params: { loadWorkoutId: workoutRecommendation.workout.id, returnTo: '/' }
                                });
                            }}
                            activeOpacity={0.95}
                            style={{
                                backgroundColor: theme.mode === 'dark' ? '#111827' : '#FFFFFF',
                                borderBottomLeftRadius: 24,
                                borderBottomRightRadius: 24,
                                padding: 16,
                                paddingTop: 32,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: theme.colors.shadow,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: theme.mode === 'light' ? 0.05 : 0.2,
                                shadowRadius: 10,
                                elevation: 0,
                                borderWidth: 1,
                                borderColor: theme.colors.cardBorder
                            }}
                        >
                            <View className="flex-row items-center flex-1 mr-4">
                                <View
                                    style={{ backgroundColor: theme.colors.primary + '15', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}
                                >
                                    <Ionicons name="barbell" size={18} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sugestão de Hoje</Text>
                                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }} className="mt-0.5">{workoutRecommendation.workout.name}</Text>
                                </View>
                            </View>
                            <View style={{ backgroundColor: theme.colors.primary, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
                                <Ionicons name="play" size={20} color="#000000" />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handleGenerateAIWorkout(dailyFocus.names)}
                            disabled={isGeneratingAI}
                            activeOpacity={0.95}
                            style={{
                                backgroundColor: theme.mode === 'dark' ? '#111827' : '#FFFFFF',
                                borderBottomLeftRadius: 24,
                                borderBottomRightRadius: 24,
                                padding: 16,
                                paddingTop: 32,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: theme.colors.shadow,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: theme.mode === 'light' ? 0.05 : 0.2,
                                shadowRadius: 10,
                                elevation: 0,
                                borderWidth: 1,
                                borderColor: theme.colors.cardBorder
                            }}
                        >
                            <View className="flex-row items-center flex-1 mr-4">
                                <View
                                    style={{ backgroundColor: theme.colors.primary + '15', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}
                                >
                                    <Ionicons name="sparkles" size={18} color={theme.mode === 'light' ? theme.colors.primaryDark : theme.colors.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gerar Treino IA</Text>
                                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }} className="mt-0.5">{dailyFocus.names}</Text>
                                </View>
                            </View>
                            <View style={{ backgroundColor: theme.colors.primary, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
                                {isGeneratingAI ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="sparkles" size={20} color="#000000" />}
                            </View>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>



            {/* Horizontal Scroll Cards */}
            <View style={{ paddingHorizontal: 16 }}>
                {sortedMuscles.slice(0, 4).map((muscle) => (
                    <View
                        key={muscle.id}
                        style={{
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.cardBorder,
                            width: '100%',
                            shadowColor: theme.colors.shadow,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 0,
                            borderRadius: 16,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 12,
                            borderWidth: 1
                        }}
                    >
                        {/* Muscle Name & Status */}
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.colors.text }} className="text-sm font-black italic uppercase tracking-tighter mb-1" numberOfLines={1}>{muscle.name}</Text>
                            <StatusBadge status={muscle.status} />
                        </View>

                        {/* Compact Metrics Row */}
                        <View className="flex-row items-center justify-end px-4 gap-x-6">
                            <View>
                                <Text style={{ color: theme.colors.textMuted }} className="text-[7px] font-bold uppercase mb-0.5">SÉRIES</Text>
                                <Text style={{ color: theme.colors.text }} className="text-[10px] font-bold">
                                    {muscle.setsThisWeek}<Text className="text-[8px] font-normal opacity-50">/{muscle.weeklyTarget}</Text>
                                </Text>
                            </View>
                            <View>
                                <Text style={{ color: theme.colors.textMuted }} className="text-[7px] font-bold uppercase mb-0.5">RECUP.</Text>
                                <Text style={{ color: theme.colors.text }} className="text-[10px] font-bold">{muscle.recoveryPercentage}%</Text>
                            </View>
                        </View>

                        {/* Score Badge */}
                        <View className="items-center justify-center pl-4 border-l" style={{ borderLeftColor: theme.colors.cardBorder, minWidth: 45 }}>
                            <Text style={{ color: getScoreColor(muscle.score) }} className="text-base font-black leading-none">{muscle.score}</Text>
                            <Text style={{ color: theme.colors.textMuted }} className="text-[7px] font-black uppercase">SCORE</Text>
                        </View>
                    </View>
                ))}

                {sortedMuscles.length > 4 && (
                    <TouchableOpacity
                        onPress={() => router.push('/muscle-coach-details')}
                        style={{
                            backgroundColor: theme.mode === 'light' ? theme.colors.primary : theme.colors.primary + '10',
                            borderRadius: 12,
                            paddingVertical: 12,
                            alignItems: 'center',
                            marginTop: 4,
                            borderWidth: 1,
                            borderColor: theme.mode === 'light' ? theme.colors.primary : theme.colors.primary + '20',
                            boxShadow: theme.mode === 'light' ? '0px 4px 8px rgba(0,0,0,0.08)' : 'none',
                            elevation: theme.mode === 'light' ? 3 : 0
                        }}
                    >
                        <View className="flex-row items-center justify-center">
                            <Text style={{ color: theme.mode === 'light' ? '#000000' : theme.colors.primary }} className="text-[11px] font-black uppercase tracking-wider italic">Análise Completa & Detalhes</Text>
                            <Ionicons name="chevron-forward" size={14} color={theme.mode === 'light' ? '#000000' : theme.colors.primary} style={{ marginLeft: 6 }} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
