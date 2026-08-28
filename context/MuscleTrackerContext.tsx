import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWorkoutHistory } from './WorkoutHistoryContext';

// Define the muscle groups we track (Portuguese keys)
// These should match the keys in exercises_translated.json and muscleImages.ts
export type MuscleId =
    | 'Peito'
    | 'Costas'
    | 'Ombros'
    | 'Bíceps'
    | 'Tríceps'
    | 'Quadríceps'
    | 'Isquiotibiais' // Posteriores
    | 'Glúteos'
    | 'Panturrilhas'
    | 'Abdômen';

export type MuscleStatus = 'recovered' | 'accumulating' | 'overreaching' | 'undertrained';

export interface MuscleData {
    id: string;
    name: string;
    status: MuscleStatus;
    score: number; // 0-100
    lastTrained: string | null; // ISO date
    setsThisWeek: number;
    weeklyTarget: number;
    recoveryPercentage: number; // 0-100%
    recommendation: string;
    frequency: number;
    avgLoad: number;
}

interface MuscleTrackerContextType {
    muscleStats: Record<string, MuscleData>;
    loading: boolean;
    getMuscleStatus: (muscleId: string) => MuscleData | undefined;
}

const MuscleTrackerContext = createContext<MuscleTrackerContextType | undefined>(undefined);

// Default Targets (can be customized later)
const DEFAULT_WEEKLY_TARGET = 12;
const RECOVERY_HOURS_SMALL = 48;
const RECOVERY_HOURS_LARGE = 72;

const LARGE_MUSCLES = ['Peito', 'Costas', 'Quadríceps', 'Isquiotibiais', 'Glúteos'];

export function MuscleTrackerProvider({ children }: { children: ReactNode }) {
    const { history } = useWorkoutHistory();
    const [muscleStats, setMuscleStats] = useState<Record<string, MuscleData>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        calculateMuscleStats();
    }, [history]);

    const calculateMuscleStats = () => {
        const stats: Record<string, MuscleData> = {};
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);

        // Initialize all muscles
        const allMuscles: MuscleId[] = [
            'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
            'Quadríceps', 'Isquiotibiais', 'Glúteos', 'Panturrilhas', 'Abdômen'
        ];

        // Helper to find muscles in history
        // We need to look at history -> exercises -> body_parts
        // But history exercises only have names usually? 
        // Wait, WorkoutHistoryRecord types show HistoryExercise has 'id' and 'name'.
        // We might need to map ExerciseName -> BodyPart if it's not saved in history.
        // Assuming for V1 we can try to look up or if we are lucky it's saved.
        // Checking WorkoutHistoryContext... it saves id, name, sets.
        // We need a way to map stored exercises back to body parts. 
        // For now, let's assume we can map using the current exercises.json if needed, 
        // but ideally history should have it. If not, we do a best effort name match or 
        // simply string match standard names if possible.

        // Helper vars
        const setsCount: Record<string, number> = {};
        const lastTrained: Record<string, Date> = {};
        const loadSum: Record<string, number> = {}; // New: Track total load
        const frequencyCount: Record<string, number> = {}; // New: Track times trained

        history.forEach(workout => {
            const workoutDate = new Date(workout.date);
            const isThisWeek = workoutDate >= oneWeekAgo;

            workout.exercises.forEach(ex => {
                const parts = inferBodyPart(ex.name);

                parts.forEach(part => {
                    // Update Last Trained
                    if (!lastTrained[part] || workoutDate > lastTrained[part]) {
                        lastTrained[part] = workoutDate;
                    }

                    // Stats for this week
                    if (isThisWeek) {
                        const validSets = ex.sets.filter(s => s.type !== 'W');

                        if (validSets.length > 0) {
                            // Sets
                            setsCount[part] = (setsCount[part] || 0) + validSets.length;

                            // Frequency (increment once per workout per muscle)
                            // We need to be careful not to double count if muscle appears twice in one workout? 
                            // The outer loop is workout, so we are inside one workout.
                            // We need to know if we already counted this muscle for THIS workout.
                            // Simplified: We assume inferBodyPart returns unique parts for the exercise.
                            // But if multiple exercises hit the same part in one workout?
                            // We should track 'musclesHitInThisWorkout'.
                        }

                        // Load
                        const totalLoad = validSets.reduce((sum, s) => sum + s.kg, 0);
                        loadSum[part] = (loadSum[part] || 0) + totalLoad;
                    }
                });
            });

            // Correct Frequency Calculation:
            // Identify unique muscles in THIS workout
            const musclesInWorkout = new Set<string>();
            if (isThisWeek) {
                workout.exercises.forEach(ex => {
                    const parts = inferBodyPart(ex.name);
                    parts.forEach(p => musclesInWorkout.add(p));
                });
                musclesInWorkout.forEach(m => {
                    frequencyCount[m] = (frequencyCount[m] || 0) + 1;
                });
            }
        });

        allMuscles.forEach(muscle => {
            const sets = setsCount[muscle] || 0;
            const lastDate = lastTrained[muscle];
            const hoursSince = lastDate ? (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60) : 999;

            const isLarge = LARGE_MUSCLES.includes(muscle);
            const recoveryNeeded = isLarge ? RECOVERY_HOURS_LARGE : RECOVERY_HOURS_SMALL;
            const recoveryPercentage = Math.min(100, Math.round((hoursSince / recoveryNeeded) * 100));

            let status: MuscleStatus = 'undertrained';

            // Logic for status
            if (recoveryPercentage < 100) {
                status = 'accumulating'; // or 'recovering'
            } else if (sets < 4) {
                status = 'undertrained';
            } else if (sets >= DEFAULT_WEEKLY_TARGET) {
                status = 'recovered'; // 'Ideal' volume reached
            } else {
                status = 'accumulating'; // Building up
            }

            // Determine "Overreaching" / "Red" if trained very recently with high volume?
            if (recoveryPercentage < 30) status = 'overreaching';

            // Score Calculation (0-100)
            // Volume (40%) + Recency (30%) + Frequency (30% - simplified)
            let score = 0;
            const volumeScore = Math.min(100, (sets / DEFAULT_WEEKLY_TARGET) * 100);
            const recoveryScore = recoveryPercentage; // 100% means fully recovered

            // "Readiness" Score:
            // If fully recovered and volume is low -> Low Score (Needs training)
            // If fully recovered and volume is high -> High Score (Good maintenance)
            // This is tricky. Let's make Score = "Health/Optimization" Score
            // 100 = Perfect volume + Perfect recovery.
            score = Math.round((volumeScore * 0.6) + (recoveryScore * 0.4));

            let recommendation = "";
            const currentFrequency = frequencyCount[muscle] || 0; // New metric
            const avgLoad = loadSum[muscle] && setsCount[muscle] ? Math.round(loadSum[muscle] / setsCount[muscle]) : 0; // New metric (approx)

            if (status === 'overreaching') recommendation = "Descanse este músculo hoje.";
            else if (status === 'undertrained') recommendation = "Prioridade total. Aumente o volume.";
            else if (status === 'recovered') recommendation = "Volume otimizado. Manutenção.";
            else recommendation = "Em recuperação. Aguarde.";

            stats[muscle] = {
                id: muscle,
                name: muscle,
                status,
                score,
                lastTrained: lastDate ? lastDate.toISOString() : null,
                setsThisWeek: sets,
                weeklyTarget: DEFAULT_WEEKLY_TARGET,
                recoveryPercentage,
                recommendation,
                frequency: currentFrequency, // New
                avgLoad: avgLoad // New
            };
        });

        setMuscleStats(stats);
        setLoading(false);
    };

    const inferBodyPart = (name: string): string[] => {
        const n = name.toLowerCase();
        // Basic keyword matching for prototype
        if (n.includes('supino') || n.includes('chest') || n.includes('peito') || n.includes('fly')) return ['Peito'];
        if (n.includes('puxada') || n.includes('remada') || n.includes('costas') || n.includes('pull')) return ['Costas'];
        if (n.includes('agachamento') || n.includes('leg press') || n.includes('extensora') || n.includes('quad')) return ['Quadríceps'];
        if (n.includes('stiff') || n.includes('mesa flexora') || n.includes('posterior')) return ['Isquiotibiais'];
        if (n.includes('elevação') || n.includes('desenvolvimento') || n.includes('ombro')) return ['Ombros'];
        if (n.includes('rosca') || n.includes('biceps')) return ['Bíceps'];
        if (n.includes('triceps') || n.includes('testa') || n.includes('polia')) return ['Tríceps'];
        if (n.includes('panturrilha')) return ['Panturrilhas'];
        if (n.includes('abdominal') || n.includes('crunch')) return ['Abdômen'];
        return [];
    };

    const getMuscleStatus = (muscleId: string) => muscleStats[muscleId];

    return (
        <MuscleTrackerContext.Provider value={{ muscleStats, loading, getMuscleStatus }}>
            {children}
        </MuscleTrackerContext.Provider>
    );
}

export function useMuscleTracker() {
    const context = useContext(MuscleTrackerContext);
    if (context === undefined) {
        throw new Error('useMuscleTracker must be used within a MuscleTrackerProvider');
    }
    return context;
}
