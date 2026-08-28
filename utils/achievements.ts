import { WorkoutHistoryRecord } from '../context/WorkoutHistoryContext';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    category: 'Treinos' | 'Sequência' | 'Metas' | 'Volume';
    icon: string;
    tier: AchievementTier;
    current: number;
    target: number;
    unlocked: boolean;
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const startOfWeek = (date: Date) => {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - day);
    result.setHours(0, 0, 0, 0);
    return result;
};

export function getAchievementStats(history: WorkoutHistoryRecord[], weeklyTarget = 3) {
    const uniqueDates = [...new Set(history.map(item => dayKey(new Date(item.date))))]
        .map(key => {
            const [year, month, day] = key.split('-').map(Number);
            return new Date(year, month, day);
        })
        .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = uniqueDates.length ? 1 : 0;
    let runningStreak = uniqueDates.length ? 1 : 0;
    for (let index = 1; index < uniqueDates.length; index += 1) {
        const difference = Math.round((uniqueDates[index].getTime() - uniqueDates[index - 1].getTime()) / 86_400_000);
        runningStreak = difference === 1 ? runningStreak + 1 : 1;
        longestStreak = Math.max(longestStreak, runningStreak);
    }

    const weeklyDays = new Map<string, Set<string>>();
    const monthlyDays = new Map<string, Set<string>>();
    uniqueDates.forEach(date => {
        const week = dayKey(startOfWeek(date));
        const month = `${date.getFullYear()}-${date.getMonth()}`;
        if (!weeklyDays.has(week)) weeklyDays.set(week, new Set());
        if (!monthlyDays.has(month)) monthlyDays.set(month, new Set());
        weeklyDays.get(week)!.add(dayKey(date));
        monthlyDays.get(month)!.add(dayKey(date));
    });

    const monthlyTarget = Math.max(8, weeklyTarget * 4);
    const weeklyGoals = [...weeklyDays.values()].filter(days => days.size >= weeklyTarget).length;
    const monthlyGoals = [...monthlyDays.values()].filter(days => days.size >= monthlyTarget).length;
    const totalVolume = Math.round(history.reduce((sum, workout) => sum + (workout.totalVolume || 0), 0));

    return { workouts: history.length, longestStreak, weeklyGoals, monthlyGoals, totalVolume };
}

export function buildAchievements(history: WorkoutHistoryRecord[], weeklyTarget = 3): Achievement[] {
    const stats = getAchievementStats(history, weeklyTarget);
    const make = (achievement: Omit<Achievement, 'unlocked'>): Achievement => ({
        ...achievement,
        unlocked: achievement.current >= achievement.target,
    });

    return [
        make({ id: 'first-workout', title: 'Primeiro passo', description: 'Conclua seu primeiro treino', category: 'Treinos', icon: 'rocket', tier: 'bronze', current: stats.workouts, target: 1 }),
        make({ id: 'workouts-10', title: 'Em movimento', description: 'Complete 10 treinos', category: 'Treinos', icon: 'barbell', tier: 'silver', current: stats.workouts, target: 10 }),
        make({ id: 'workouts-50', title: 'Atleta dedicado', description: 'Complete 50 treinos', category: 'Treinos', icon: 'fitness', tier: 'gold', current: stats.workouts, target: 50 }),
        make({ id: 'workouts-100', title: 'Centenário', description: 'Complete 100 treinos', category: 'Treinos', icon: 'trophy', tier: 'platinum', current: stats.workouts, target: 100 }),
        make({ id: 'streak-3', title: 'Ritmo criado', description: 'Treine por 3 dias consecutivos', category: 'Sequência', icon: 'flame', tier: 'bronze', current: stats.longestStreak, target: 3 }),
        make({ id: 'streak-7', title: 'Semana perfeita', description: 'Treine por 7 dias consecutivos', category: 'Sequência', icon: 'calendar', tier: 'gold', current: stats.longestStreak, target: 7 }),
        make({ id: 'streak-30', title: 'Imparável', description: 'Treine por 30 dias consecutivos', category: 'Sequência', icon: 'flash', tier: 'diamond', current: stats.longestStreak, target: 30 }),
        make({ id: 'weekly-1', title: 'Meta semanal', description: `Complete sua meta de ${weeklyTarget} treinos na semana`, category: 'Metas', icon: 'checkmark-circle', tier: 'bronze', current: stats.weeklyGoals, target: 1 }),
        make({ id: 'weekly-4', title: 'Mês consistente', description: 'Complete a meta semanal 4 vezes', category: 'Metas', icon: 'calendar-outline', tier: 'gold', current: stats.weeklyGoals, target: 4 }),
        make({ id: 'monthly-1', title: 'Meta mensal', description: `Complete ${Math.max(8, weeklyTarget * 4)} treinos em um mês`, category: 'Metas', icon: 'ribbon', tier: 'gold', current: stats.monthlyGoals, target: 1 }),
        make({ id: 'monthly-3', title: 'Trimestre forte', description: 'Complete a meta mensal 3 vezes', category: 'Metas', icon: 'medal', tier: 'diamond', current: stats.monthlyGoals, target: 3 }),
        make({ id: 'volume-10k', title: 'Força acumulada', description: 'Movimente 10.000 kg em treinos', category: 'Volume', icon: 'trending-up', tier: 'silver', current: stats.totalVolume, target: 10_000 }),
        make({ id: 'volume-100k', title: 'Potência total', description: 'Movimente 100.000 kg em treinos', category: 'Volume', icon: 'shield-checkmark', tier: 'platinum', current: stats.totalVolume, target: 100_000 }),
    ];
}

export function getGoalMotivation(history: WorkoutHistoryRecord[], weeklyTarget = 3) {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const trainedThisWeek = new Set(
        history
            .map(item => new Date(item.date))
            .filter(date => date >= weekStart && date <= now)
            .map(dayKey)
    ).size;
    const remaining = Math.max(0, weeklyTarget - trainedThisWeek);

    if (remaining === 0) {
        return { icon: 'checkmark-circle', title: 'Meta semanal concluída', message: 'Excelente trabalho. Cada treino adicional fortalece sua consistência.' };
    }
    if (remaining === 1) {
        return { icon: 'flash', title: 'Falta apenas um treino', message: 'Você está muito perto de concluir sua meta desta semana.' };
    }
    if (trainedThisWeek > 0) {
        return { icon: 'trending-up', title: 'Mantenha o ritmo', message: `Mais ${remaining} treinos para completar sua meta semanal.` };
    }
    return { icon: 'calendar', title: 'Sua semana começa agora', message: `Planeje ${weeklyTarget} treinos e dê o primeiro passo para uma nova medalha.` };
}
