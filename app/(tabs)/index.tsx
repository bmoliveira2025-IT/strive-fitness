import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityFeed } from '../../components/home/ActivityFeed';
import { CardioSummaryWidget } from '../../components/home/CardioSummaryWidget';
import { CommunityLeaderboardCard } from '../../components/home/CommunityLeaderboardCard';
import { ContextualReminderCard } from '../../components/home/ContextualReminderCard';
import { DailyInsightCard } from '../../components/home/DailyInsightCard';
import { HomeHeader } from '../../components/home/HomeHeader';
import { MuscleUsageStats } from '../../components/home/MuscleUsageStats';
import { MusicPlayerWidget } from '../../components/home/MusicPlayerWidget';
import { NextWorkoutCard } from '../../components/home/NextWorkoutCard';
import { RecentPRCard } from '../../components/home/RecentPRCard';
import { WeeklyProgressTracker } from '../../components/home/WeeklyProgressTracker';
import { WorkoutListView } from '../../components/home/WorkoutListView';
import { NotificationModal } from '../../components/NotificationModal';
import { QuestionnaireModal } from '../../components/QuestionnaireModal';
import { HeroCard } from '../../components/dashboard/HeroCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSavedWorkouts } from '../../context/SavedWorkoutsContext';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store/useUserStore';
import { useWorkoutHistory } from '../../context/WorkoutHistoryContext';
import { useStreak } from '../../hooks/useStreak';
import { useWeeklyStats } from '../../hooks/useWeeklyStats';

export default function Home() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();
    const { savedWorkouts, deleteWorkout, toggleWorkoutFavorite } = useSavedWorkouts();
    const { history } = useWorkoutHistory();
    const { userName, profile, syncFromAuthUser, setUserName, updateProfile, addWeeklyMonitoring, addPeriodicAssessment } = useUserStore();
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

    // Survey States
    const [surveyType, setSurveyType] = useState<'onboarding' | 'weekly' | 'periodic' | null>(null);
    const [showSurvey, setShowSurvey] = useState(false);

    useEffect(() => {
        if (!profile) return;
        if (!profile.hasOnboarded) {
            setSurveyType('onboarding');
            setShowSurvey(true);
            return;
        }

        const now = new Date();

        // 2. Check Weekly (every 7 days)
        const lastWeekly = profile.trackingStats?.lastWeeklyMonitoring ? new Date(profile.trackingStats.lastWeeklyMonitoring) : null;
        if (!lastWeekly || (now.getTime() - lastWeekly.getTime() > 7 * 24 * 60 * 60 * 1000)) {
            setSurveyType('weekly');
            setShowSurvey(true);
            return;
        }

        // 3. Check Periodic (every 30 days)
        const lastPeriodic = profile.trackingStats?.lastPeriodicAssessment ? new Date(profile.trackingStats.lastPeriodicAssessment) : null;
        const creationDate = new Date(profile.createdAt);
        const daysSinceCreation = (now.getTime() - creationDate.getTime()) / (24 * 60 * 60 * 1000);

        if (lastPeriodic) {
            if (now.getTime() - lastPeriodic.getTime() > 30 * 24 * 60 * 60 * 1000) {
                setSurveyType('periodic');
                setShowSurvey(true);
                return;
            }
        } else if (daysSinceCreation >= 30) {
            // First periodic assessment only after 30 days of usage
            setSurveyType('periodic');
            setShowSurvey(true);
            return;
        }
    }, [profile]);

    const handleSurveyComplete = (answers: any) => {
        if (surveyType === 'onboarding') {
            if (answers.name) {
                setUserName(answers.name);
            }

            updateProfile({
                hasOnboarded: true,
                onboardingData: answers as any,
                weight: parseFloat(answers.weight) || profile?.weight,
                height: parseFloat(answers.height) || profile?.height,
                objective: answers.goal,
                // Initialize weekly monitoring so it doesn't trigger immediately
                trackingStats: {
                    ...profile!.trackingStats,
                    lastWeeklyMonitoring: new Date().toISOString()
                }
            });
        } else if (surveyType === 'weekly') {
            addWeeklyMonitoring({
                date: new Date().toISOString(),
                weight: parseFloat(answers.currentWeight),
                sleepQuality: answers.sleep,
                stressLevel: answers.stress,
                recoveryLevel: answers.recovery,
                energyLevel: answers.energy
            });
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
            case 'weekly':
                return {
                    title: "Acompanhamento Semanal",
                    description: "Hora de ver como foi sua semana e ajustar o rumo se necessário.",
                    questions: [
                        { id: 'currentWeight', type: 'text', text: 'Peso atual (kg):', placeholder: 'Ex: 76.2' },
                        { id: 'sleep', type: 'scale', text: 'Qualidade do sono (1-5):', min: 1, max: 5 },
                        { id: 'energy', type: 'scale', text: 'Nível de energia (1-5):', min: 1, max: 5 },
                        { id: 'stress', type: 'scale', text: 'Nível de estresse (1-5):', min: 1, max: 5 },
                        { id: 'recovery', type: 'scale', text: 'Recuperação muscular (1-5):', min: 1, max: 5 }
                    ]
                };
            case 'periodic':
                return {
                    title: "Avaliação Mensal",
                    description: "Vamos registrar seu progresso físico e satisfação geral.",
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
                contentContainerStyle={{ paddingBottom: 160 + Math.max(insets.bottom, 20) }}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
            >
                {/* 1. HERO: Premium Card with Contextual Action */}
                <HeroCard />

                {/* 2. CONTEXTUAL REMINDER: Smart streak / weekly goals reminder */}
                <ContextualReminderCard streak={streak} weekCount={stats.current.count} />

                {/* 3. WEEKLY PROGRESS: 7-day dot tracker + streak + volume */}
                <WeeklyProgressTracker
                    streak={streak}
                    weekCount={stats.current.count}
                    weekVolume={stats.current.volumeFormatted}
                />

                {/* 4. NEXT WORKOUT: shown only when user hasn't trained today */}
                <NextWorkoutCard />

                {/* 5. RECENT PR: Personal Record Milestone */}
                <RecentPRCard />

                {/* 6. CARDIO TRACKER */}
                <CardioSummaryWidget />

                {/* 7. QUICK ACTIONS: Iniciar, Criar Ficha, Biblioteca, Assist */}
                <QuickActions />

                {/* 8. MUSIC & PODCAST: MusiKA Integrated Player */}
                <MusicPlayerWidget />

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

                {/* 12. MUSCLE USAGE: Weekly Focus */}
                <MuscleUsageStats />

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
                    onClose={() => setShowSurvey(false)}
                />
            )}
        </View>
    );
}
