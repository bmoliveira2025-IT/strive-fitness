import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ImageBackground, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutHistoryRecord } from '../../context/WorkoutHistoryContext';

interface IntelligentFeedbackProps {
    history: WorkoutHistoryRecord[];
}

interface Insight {
    id: string;
    type: 'pr' | 'frequency' | 'progression' | 'welcome';
    title: string;
    message: string;
    icon: string;
    color: string;
    gradient: readonly [string, string];
}

export function IntelligentFeedback({ history }: IntelligentFeedbackProps) {
    const { theme } = useTheme();

    const insights = useMemo(() => {
        const result: Insight[] = [];

        if (history.length === 0) {
            result.push({
                id: 'welcome',
                type: 'welcome',
                title: 'Comece sua jornada',
                message: 'Inicie seu primeiro treino para começar a receber feedbacks inteligentes! 💪',
                icon: 'rocket',
                color: '#4F8FF7',
                gradient: ['#4F8FF7', '#3B82F6'] as const
            });
            return result;
        }

        // 1. PR Check (Recorde Pessoal)
        const lastWorkout = history[0];
        let hadPR = false;
        let prExercise = '';

        lastWorkout.exercises.forEach(ex => {
            const currentMax = Math.max(...ex.sets.map(s => s.kg));
            let prevMax = 0;
            for (let i = 1; i < history.length; i++) {
                const prevEx = history[i].exercises.find(e => e.name === ex.name);
                if (prevEx) {
                    const m = Math.max(...prevEx.sets.map(s => s.kg));
                    if (m > prevMax) prevMax = m;
                }
            }
            if (currentMax > prevMax && prevMax > 0) {
                hadPR = true;
                prExercise = ex.name;
            }
        });

        if (hadPR) {
            result.push({
                id: 'pr',
                type: 'pr',
                title: 'Novo Recorde! 🔥',
                message: `Você bateu seu recorde no ${prExercise} no último treino!`,
                icon: 'trophy',
                color: '#FFD700',
                gradient: ['#F59E0B', '#D97706'] as const
            });
        }

        // 2. Frequency Check
        const muscleLastTrained: Record<string, Date> = {};
        const majorGroups = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços'];

        history.forEach(workout => {
            const wDate = new Date(workout.date);
            workout.exercises.forEach(ex => {
                const name = ex.name.toLowerCase();
                let group = '';
                if (name.includes('supino') || name.includes('peito') || name.includes('fly')) group = 'Peito';
                else if (name.includes('remada') || name.includes('puxada') || name.includes('barra fixa')) group = 'Costas';
                else if (name.includes('agachamento') || name.includes('leg') || name.includes('perna') || name.includes('extensora')) group = 'Pernas';
                else if (name.includes('desenvolvimento') || name.includes('lateral') || name.includes('ombro')) group = 'Ombros';
                else if (name.includes('rosca') || name.includes('tríceps') || name.includes('bíceps')) group = 'Braços';

                if (group && (!muscleLastTrained[group] || wDate > muscleLastTrained[group])) {
                    muscleLastTrained[group] = wDate;
                }
            });
        });

        const today = new Date();
        majorGroups.forEach(group => {
            const lastDate = muscleLastTrained[group];
            if (lastDate) {
                const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= 5) {
                    result.push({
                        id: `freq-${group}`,
                        type: 'frequency',
                        title: 'Foco na Consistência 🔑',
                        message: `Seu último treino de ${group.toLowerCase()} foi há ${diffDays} dias. Que tal hoje?`,
                        icon: 'calendar',
                        color: '#FF9500',
                        gradient: ['#F97316', '#EA580C'] as const
                    });
                }
            }
        });

        // 3. Progression Tip
        let progressionCandidate: { name: string, avgReps: number } | null = null;

        lastWorkout.exercises.forEach(ex => {
            const avgReps = ex.sets.reduce((acc, s) => acc + s.reps, 0) / ex.sets.length;
            if (avgReps >= 11) {
                if (!progressionCandidate || avgReps > (progressionCandidate as { name: string, avgReps: number }).avgReps) {
                    progressionCandidate = { name: ex.name, avgReps };
                }
            }
        });

        if (progressionCandidate) {
            const candidate = progressionCandidate as { name: string, avgReps: number };
            result.push({
                id: `prog-${candidate.name}`,
                type: 'progression',
                title: 'Evolução Detectada 🚀',
                message: `Você domina a carga no ${candidate.name}. Já pensou em aumentar o peso hoje?`,
                icon: 'trending-up',
                color: '#22C55E',
                gradient: ['#10B981', '#059669'] as const
            });
        }

        if (result.length === 0) {
            result.push({
                id: 'daily',
                type: 'welcome',
                title: 'Pronto para o Próximo Nível?',
                message: 'Treinar hoje te coloca um passo à frente dos seus objetivos.',
                icon: 'fitness',
                color: '#4F8FF7',
                gradient: ['#4F8FF7', '#3B82F6'] as const
            });
        }
        return result;
    }, [history]);

    const displayInsights = insights.slice(0, 2);

    return (
        <View className="px-6 mb-12">
            <Text style={{ color: theme.colors.textMuted }} className="text-[11px] font-black uppercase tracking-[2.5px] mb-5">Feedback do Coach AI</Text>

            <View className="gap-5">
                {displayInsights.map((insight, index) => (
                    <Animated.View
                        key={insight.id}
                        entering={FadeInDown.delay(index * 200).duration(800).springify()}
                        style={{
                            backgroundColor: '#000',
                            borderRadius: 30,
                            overflow: 'hidden',
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 12 },
                            shadowOpacity: 0.35,
                            shadowRadius: 24,
                            elevation: 8,
                        }}
                    >
                        <ImageBackground
                            source={require('../../assets/performance_bg.png')}
                            style={{ flex: 1 }}
                        >
                            {/* Deep Moody Cinematic Overlay - 95% Opacity */}
                            <LinearGradient
                                colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
                                style={{ position: 'absolute', inset: 0 }}
                            />

                            <View className="p-5 flex-row items-center">
                                <View
                                    style={{ backgroundColor: insight.color + '20', width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 18, borderWidth: 1, borderColor: insight.color + '30' }}
                                >
                                    <View style={{ position: 'absolute', width: 44, height: 44, borderRadius: 15, backgroundColor: 'white', opacity: 0.05 }} />
                                    <Ionicons name={insight.icon as any} size={24} color={insight.color} />
                                </View>

                                <View className="flex-1">
                                    <Text style={{ color: '#FFF', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }} className="font-black text-base mb-1 tracking-tight">{insight.title}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{insight.message}</Text>
                                </View>
                            </View>
                        </ImageBackground>
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}
