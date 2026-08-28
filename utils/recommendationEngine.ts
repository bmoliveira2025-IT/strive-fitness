import { MuscleData } from '../context/MuscleTrackerContext';
import { SavedWorkout } from '../context/SavedWorkoutsContext';
import { WorkoutHistoryRecord } from '../context/WorkoutHistoryContext';
import { WorkoutMuscleAnalysis, analyzeWorkout } from './workoutAnalyzer';

export interface WorkoutRecommendation {
    workout: SavedWorkout;
    analysis: WorkoutMuscleAnalysis;
    score: number; // 0-100, higher is better
    priority: 'high' | 'medium' | 'low';
    reason: string;
    musclesNeedingAttention: string[];
    daysSinceLastPerformed: number | null;
}

export interface RecommendationEngine {
    getRecommendations: (
        savedWorkouts: SavedWorkout[],
        muscleStats: Record<string, MuscleData>,
        history: WorkoutHistoryRecord[]
    ) => WorkoutRecommendation[];
    getBestRecommendation: (
        savedWorkouts: SavedWorkout[],
        muscleStats: Record<string, MuscleData>,
        history: WorkoutHistoryRecord[]
    ) => WorkoutRecommendation | null;
}

function getLastPerformedDate(workout: SavedWorkout, history: WorkoutHistoryRecord[]): Date | null {
    // Find the most recent workout with this ID or similar name
    const relevantWorkouts = history.filter(h =>
        h.workoutName === workout.name || h.workoutId === workout.id
    );

    if (relevantWorkouts.length === 0) return null;

    const sorted = relevantWorkouts.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return new Date(sorted[0].date);
}

function getDaysSince(date: Date | null): number | null {
    if (!date) return null;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function calculateWorkoutScore(
    workout: SavedWorkout,
    analysis: WorkoutMuscleAnalysis,
    muscleStats: Record<string, MuscleData>,
    daysSinceLastPerformed: number | null
): { score: number; musclesNeedingAttention: string[]; reason: string } {
    let score = 0;
    const musclesNeedingAttention: string[] = [];
    const reasons: string[] = [];

    // 1. Freshness Score (25 points) - Variety in workout selection
    if (daysSinceLastPerformed === null) {
        score += 25;
        reasons.push('Treino inédito');
    } else if (daysSinceLastPerformed >= 7) {
        score += 20;
        reasons.push(`Última vez há ${daysSinceLastPerformed} dias`);
    } else if (daysSinceLastPerformed >= 3) {
        score += 10;
    } else {
        score -= 15; // Recently done
        reasons.push('Feito recentemente');
    }

    // 2. Muscle Priority & Recency Score (60 points)
    analysis.primaryFocus.forEach(muscleName => {
        const muscle = muscleStats[muscleName];
        if (!muscle) return;

        // Recency Check (How many days since last trained this specific muscle)
        const lastTrainedDate = muscle.lastTrained ? new Date(muscle.lastTrained) : null;
        const daysSinceMuscle = lastTrainedDate ? Math.floor((new Date().getTime() - lastTrainedDate.getTime()) / (1000 * 60 * 60 * 24)) : 99;

        if (muscle.status === 'overreaching' || muscle.recoveryPercentage < 50) {
            score -= 30; // Strong penalty for overtrained muscles
            reasons.push(`${muscleName} em recuperação`);
            return;
        }

        // Undertrained or Long Gap
        if (muscle.status === 'undertrained' || daysSinceMuscle >= 4) {
            score += 25;
            musclesNeedingAttention.push(muscleName);
            if (daysSinceMuscle >= 4) {
                reasons.push(`${muscleName} sem treino há ${daysSinceMuscle} dias`);
            } else {
                reasons.push(`${muscleName} precisa de volume`);
            }
        } else if (muscle.setsThisWeek < muscle.weeklyTarget) {
            score += 10;
            musclesNeedingAttention.push(muscleName);
        }
    });

    // 3. Balance Score (15 points)
    const uniqueMuscles = analysis.musclesTargeted.length;
    if (uniqueMuscles >= 4) score += 15;
    else if (uniqueMuscles >= 2) score += 5;

    // Determine primary reason
    let finalReason = '';
    const urgentReason = reasons.find(r => r.includes('sem treino há') || r.includes('precisa de volume'));

    if (urgentReason) {
        finalReason = urgentReason;
    } else if (musclesNeedingAttention.length > 0) {
        finalReason = `Foca em ${musclesNeedingAttention.slice(0, 2).join(' e ')}`;
    } else if (reasons.length > 0) {
        finalReason = reasons[0];
    } else {
        finalReason = 'Ótima opção para hoje';
    }

    return { score: Math.max(0, Math.min(100, score)), musclesNeedingAttention, reason: finalReason };
}

export const recommendationEngine: RecommendationEngine = {
    getRecommendations: (savedWorkouts, muscleStats, history) => {
        if (savedWorkouts.length === 0) return [];

        const recommendations: WorkoutRecommendation[] = savedWorkouts.map(workout => {
            const analysis = analyzeWorkout(workout);
            const lastPerformed = getLastPerformedDate(workout, history);
            const daysSince = getDaysSince(lastPerformed);

            const { score, musclesNeedingAttention, reason } = calculateWorkoutScore(
                workout,
                analysis,
                muscleStats,
                daysSince
            );

            let priority: 'high' | 'medium' | 'low' = 'medium';
            if (score >= 60) priority = 'high';
            else if (score < 30) priority = 'low';

            return {
                workout,
                analysis,
                score,
                priority,
                reason,
                musclesNeedingAttention,
                daysSinceLastPerformed: daysSince
            };
        });

        // Sort by score descending
        return recommendations.sort((a, b) => b.score - a.score);
    },

    getBestRecommendation: (savedWorkouts, muscleStats, history) => {
        const recommendations = recommendationEngine.getRecommendations(
            savedWorkouts,
            muscleStats,
            history
        );

        if (recommendations.length === 0) return null;

        // Return the highest scoring recommendation
        return recommendations[0];
    }
};
