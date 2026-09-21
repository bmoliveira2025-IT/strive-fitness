import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityFeed } from '../../components/home/ActivityFeed';
import { CardioSummaryWidget } from '../../components/home/CardioSummaryWidget';
import { CommunityLeaderboardCard } from '../../components/home/CommunityLeaderboardCard';
import { DailyInsightCard } from '../../components/home/DailyInsightCard';
import { HomeHeader } from '../../components/home/HomeHeader';
import { MuscleUsageStats } from '../../components/home/MuscleUsageStats';
import { NextWorkoutCard } from '../../components/home/NextWorkoutCard';
import { RecentPRCard } from '../../components/home/RecentPRCard';
import { WeeklyProgressTracker } from '../../components/home/WeeklyProgressTracker';
import { WorkoutListView } from '../../components/home/WorkoutListView';
import { NotificationModal } from '../../components/NotificationModal';
import { QuestionnaireModal } from '../../components/QuestionnaireModal';
import { VisualOnboardingModal } from '../../components/onboarding/VisualOnboardingModal';
import { HeroCard } from '../../components/dashboard/HeroCard';
import { MuscleGroupHeatmapWidget } from '../../components/dashboard/MuscleGroupHeatmapWidget';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSavedWorkouts } from '../../context/SavedWorkoutsContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { useStreak } from '../../hooks/useStreak';
import { useWeeklyStats } from '../../hooks/useWeeklyStats';

const exercisesData = require('../../assets/exercises.json');

function getDefaultPlanForGoal(goal?: string): { name: string; exercises: any[]; category: string } {
    const getEx = (id: string) => {
        const found = exercisesData.find((e: any) => e.id.toString() === id);
        if (!found) return null;
        return {
            id: found.id.toString(),
            name: found.name,
            image_url: found.image_url,
            video_url: found.video_url,
            body_parts: found.body_parts || [],
            equipment: found.equipment || [],
        };
    };

    let title = 'Plano Inicial - Hipertrofia';
    let ids = ['2', '136', '105', '18', '145', '107', '6'];

    if (goal === 'fat_loss') {
        title = 'Plano Inicial - Queima de Gordura';
        ids = ['18', '2', '105', '145', '107', '1725'];
    } else if (goal === 'strength') {
        title = 'Plano Inicial - Força & Potência';
        ids = ['2', '18', '105', '136', '107'];
    } else if (goal === 'conditioning') {
        title = 'Plano Inicial - Condicionamento Físico';
        ids = ['18', '2', '105', '145', '6', '1916'];
    }

    const exercises = ids.map(getEx).filter(Boolean);
    return { name: title, exercises, category: 'Inicial' };
}

export default function Home() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();
    const { savedWorkouts, deleteWorkout, toggleWorkoutFavorite, saveWorkout } = useSavedWorkouts();
    const { history } = useWorkoutHistory();
    const { userName, profile, syncFromAuthUser, setUserName, updateProfile, addPeriodicAssessment } = useUserStore();
    const router = useRouter();
    const params = useLocalSearchParams<{ previewWorkoutId?: string }>();

    useEffect(() => {
        if (session?.user) {
            syncFromAuthUser(session.user);
        }
    }, [session, syncFromAuthUser]);

    const [showNotifications, setShowNotifications] = useState(false);
    const { unreadCount } = useNotifications();

    const handleOpenPreview = (workout: any) => {
        router.push({
            pathname: '/preview',
            params: { id: workout.id, type: 'saved' }
        });
    };

    // Auto-open preview from params
    useEffect(() => {
        if (params.previewWorkoutId && savedWorkouts.length > 0) {
            router.push({
                pathname: '/preview',
                params: { id: params.previewWorkoutId, type: 'saved' }
            });
        }
    }, [params.previewWorkoutId, savedWorkouts, router]);

    // Survey States - Only onboarding and 3-month periodic evolution
    const [surveyType, setSurveyType] = useState<'onboarding' | 'periodic' | null>(null);
    const [showSurvey, setShowSurvey] = useState(false);

    useEffect(() => {
        if (!profile) return;

        // A idade e onboarding só devem ser perguntados uma única vez! Se já tem idade ou já completou, não pergunta mais.
        if (!profile.hasOnboarded && !profile.age && !(profile.onboardingData as any)?.age) {
            AsyncStorage.getItem('@strive_has_onboarded').then((val) => {
                if (val === 'true') {
                    updateProfile({ hasOnboarded: true });
                }
            });
            return;
        }

        const now = new Date();

        // Check Periodic Evolution (every 90 days / 3 months)
        const lastPeriodic = profile.trackingStats?.lastPeriodicAssessment ? new Date(profile.trackingStats.lastPeriodicAssessment) : null;
        const creationDate = new Date(profile.createdAt);
        const daysSinceCreation = (now.getTime() - creationDate.getTime()) / (24 * 60 * 60 * 1000);

        if (lastPeriodic) {
            if (now.getTime() - lastPeriodic.getTime() > 90 * 24 * 60 * 60 * 1000) {
                setSurveyType('periodic');
                setShowSurvey(true);
                return;
            }
        } else if (daysSinceCreation >= 90) {
            // First periodic evolution assessment only after 90 days (3 months)
            setSurveyType('periodic');
            setShowSurvey(true);
            return;
        }
    }, [profile]);

    const handleSurveyComplete = (answers: any) => {
        if (surveyType === 'onboarding') {
            const ageNum = parseInt(answers.age, 10);
            if (answers.name) {
                setUserName(answers.name);
            }

            updateProfile({
                hasOnboarded: true,
                age: !isNaN(ageNum) ? ageNum : profile?.age,
                onboardingData: answers as any,
                weight: parseFloat(answers.weight) || profile?.weight,
                height: parseFloat(answers.height) || profile?.height,
                objective: answers.goal,
                trackingStats: {
                    ...profile!.trackingStats,
                    lastPeriodicAssessment: new Date().toISOString()
                }
            });
            if (!isNaN(ageNum)) {
                AsyncStorage.setItem('@strive_user_age', String(ageNum)).catch(() => {});
            }
            AsyncStorage.setItem('@strive_has_onboarded', 'true').catch(() => {});

            // Auto-create initial workout plan from native app exercises with real images if none exists
            if (savedWorkouts.length === 0) {
                try {
                    const defaultPlan = getDefaultPlanForGoal(answers.goal);
                    saveWorkout(defaultPlan.name, defaultPlan.exercises, defaultPlan.category, true);
                } catch (e) {
                    console.warn('Failed to auto-create onboarding workout:', e);
                }
            }
        } else if (surveyType === 'periodic') {
            addPeriodicAssessment({
                date: new Date().toISOString(),
                satisfaction: answers.overallSatisfaction,
                motivation: answers.motivation,
                difficulty: answers.workoutDifficulty,
                weight: profile?.weight || 0,
                energyLevel: 5,
                completingWorkouts: true,
                painOrDiscomfort: false,
                measurements: {
                    chest: parseFloat(answers.chest),
                    waist: parseFloat(answers.waist),
                    hips: parseFloat(answers.hips),
                    thigh: parseFloat(answers.thigh),
                    bicep: parseFloat(answers.bicep),
                    updatedAt: new Date().toISOString()
                }
            });
        }
        setShowSurvey(false);
        setSurveyType(null);
    };

    const getSurveyConfig = () => {
        switch (surveyType) {
            case 'onboarding':
                return {
                    title: "Bem-vindo ao Strive!",
                    description: "Vamos personalizar sua experiência. Conte-nos um pouco sobre você.",
                    questions: [
                        { id: 'name', type: 'text', text: 'Como você quer ser chamado?', placeholder: 'Ex: João' },
                        { id: 'age', type: 'text', text: 'Qual sua idade?', placeholder: 'Ex: 25' },
                        { id: 'height', type: 'text', text: 'Qual sua altura (cm)?', placeholder: 'Ex: 175' },
                        { id: 'weight', type: 'text', text: 'Qual seu peso atual (kg)?', placeholder: 'Ex: 75.5' },
                        {
                            id: 'goal', type: 'select', text: 'Qual seu principal objetivo?',
                            options: [
                                { label: 'Ganhar Massa', value: 'hypertrophy' },
                                { label: 'Perder Gordura', value: 'fat_loss' },
                                { label: 'Condicionamento', value: 'conditioning' },
                                { label: 'Força', value: 'strength' }
                            ]
                        },
                        {
                            id: 'experience', type: 'select', text: 'Qual seu nível de experiência?',
                            options: [
                                { label: 'Iniciante', value: 'beginner' },
                                { label: 'Intermediário', value: 'intermediate' },
                                { label: 'Avançado', value: 'advanced' }
                            ]
                        }
                    ]
                };
            case 'periodic':
                return {
                    title: "Acompanhamento Trimestral (3 Meses)",
                    description: "Acompanhe a evolução do seu corpo e suas medidas a cada 3 meses.",
                    questions: [
                        { id: 'overallSatisfaction', type: 'scale', text: 'Satisfação com os resultados (1-5):', min: 1, max: 5 },
                        { id: 'motivation', type: 'scale', text: 'Nível de motivação (1-5):', min: 1, max: 5 },
                        {
                            id: 'workoutDifficulty', type: 'select', text: 'O que achou da dificuldade dos treinos?',
                            options: [
                                { label: 'Muito Fácil', value: 'very_easy' },
                                { label: 'Fácil', value: 'easy' },
                                { label: 'Ideal', value: 'perfect' },
                                { label: 'Difícil', value: 'hard' },
                                { label: 'Muito Difícil', value: 'very_hard' }
                            ]
                        },
                        { id: 'chest', type: 'text', text: 'Medida do Peitoral (cm):', placeholder: 'Opcional' },
                        { id: 'waist', type: 'text', text: 'Medida da Cintura (cm):', placeholder: 'Opcional' },
                        { id: 'bicep', type: 'text', text: 'Medida do Braço (cm):', placeholder: 'Opcional' }
                    ]
                };
            default:
                return { title: '', description: '', questions: [] };
        }
    };

    const stats = useWeeklyStats(history);
    const streak = useStreak(history);
    const validSavedWorkouts = useMemo(() => savedWorkouts.filter(workout => workout?.id), [savedWorkouts]);

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />

            {/* Premium Header */}
            <HomeHeader
                userName={userName}
                streak={streak}
                unreadCount={unreadCount}
                onNotificationPress={() => setShowNotifications(true)}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 75 }}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
            >
                {/* 1. HERO: Premium Card with Contextual Action */}
                <HeroCard />

                {/* 2. WEEKLY PROGRESS: Dynamic goal tracker + streak + volume */}
                <WeeklyProgressTracker
                    streak={streak}
                    weekCount={stats.current.count}
                    weekVolume={stats.current.volumeFormatted}
                />

                {/* 3. NEXT WORKOUT: shown only when user hasn't trained today */}
                <NextWorkoutCard />

                {/* 5. RECENT PR: Personal Record Milestone */}
                <RecentPRCard />

                {/* 6. CARDIO TRACKER */}
                <CardioSummaryWidget />

                {/* 7. QUICK ACTIONS: Iniciar, Criar Ficha, Biblioteca, Assist */}
                <QuickActions />

                {/* 9. MEUS PLANOS: Saved Workouts with Quick Edit & Create */}
                {validSavedWorkouts.length > 0 && (
                    <WorkoutListView
                        workouts={validSavedWorkouts}
                        onWorkoutPress={handleOpenPreview}
                        onDeleteWorkout={deleteWorkout}
                        onToggleFavorite={toggleWorkoutFavorite}
                    />
                )}

                {/* 10. DAILY INSIGHT: AI Coach performance tip */}
                <DailyInsightCard />

                {/* 11. COMMUNITY RANKING: Weekly League & Social Leaderboard */}
                <CommunityLeaderboardCard />

                {/* 12. MUSCLE GROUP HEATMAP (Boneco Anatômico Dinâmico) */}
                <View style={{ paddingHorizontal: 20 }}>
                    <MuscleGroupHeatmapWidget />
                </View>

                {/* 13. RECENT ACTIVITY: Progressive Batch Loading Feed */}
                <ActivityFeed />

            </ScrollView>

            <NotificationModal
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
            />

            {showSurvey && surveyType && (
                <QuestionnaireModal
                    visible={showSurvey}
                    title={getSurveyConfig().title}
                    description={getSurveyConfig().description}
                    questions={getSurveyConfig().questions as any}
                    onComplete={handleSurveyComplete}
                    onClose={() => {
                        setShowSurvey(false);
                        if (surveyType === 'onboarding') {
                            updateProfile({ hasOnboarded: true });
                            AsyncStorage.setItem('@strive_has_onboarded', 'true').catch(() => {});
                        }
                    }}
                />
            )}

            {/* Novo Onboarding Visual por Gênero & Planos de Treino — Só se não completou */}
            <VisualOnboardingModal
                visible={!!profile && !profile.hasOnboarded && !profile.age}
                onClose={() => {
                    updateProfile({ hasOnboarded: true });
                    AsyncStorage.setItem('@strive_has_onboarded', 'true').catch(() => {});
                }}
            />
        </View>
    );
}
