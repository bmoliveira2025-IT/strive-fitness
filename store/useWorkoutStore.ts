import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Exercise = {
    id: string;
    name: string;
    body_parts?: string[];
    equipment?: string[];
    image_url?: string;
    video_url?: string;
    targetSets?: string;
    targetReps?: string;
    targetWeight?: string;
    sets?: any[];
    notes?: string;
    restTime?: number;
};

export function prepareWorkoutExercises(exercises: any[]): any[] {
    if (!exercises || !Array.isArray(exercises)) return [];

    return exercises.map((item, newIdx) => {
        const isCardio = item.body_parts?.some((p: string) => typeof p === 'string' && p.toLowerCase() === 'cardio') ||
            (item.name && (
                item.name.toLowerCase().includes('run') ||
                item.name.toLowerCase().includes('treadmill') ||
                item.name.toLowerCase().includes('cardio') ||
                item.name.toLowerCase().includes('esteira') ||
                item.name.toLowerCase().includes('corrida')
            ));

        let defaultSets: any[] = [];
        if (item.sets && Array.isArray(item.sets) && item.sets.length > 0) {
            defaultSets = item.sets.map((s: any, idx: number) => ({
                id: Date.now() + Math.random() + idx,
                previous: s.previous || '-',
                kg: s.kg !== undefined && s.kg !== null ? String(s.kg) : '',
                reps: s.reps !== undefined && s.reps !== null ? String(s.reps) : '10',
                completed: false,
                type: s.type || 'N',
            }));
        } else if (item.targetSets && parseInt(item.targetSets) > 0) {
            const count = parseInt(item.targetSets);
            const reps = item.targetReps || '10';
            const kg = item.targetWeight || '';
            for (let i = 0; i < count; i++) {
                defaultSets.push({
                    id: Date.now() + Math.random() + i,
                    previous: '-',
                    kg,
                    reps,
                    completed: false,
                    type: 'N',
                });
            }
        } else {
            const baseId = Date.now();
            if (isCardio) {
                defaultSets.push({ id: baseId, previous: '-', kg: '', reps: '', completed: false, type: 'N' });
            } else {
                defaultSets.push(
                    { id: baseId, previous: '-', kg: '', reps: '10', completed: false, type: 'N' },
                    { id: baseId + 1, previous: '-', kg: '', reps: '10', completed: false, type: 'N' },
                    { id: baseId + 2, previous: '-', kg: '', reps: '10', completed: false, type: 'N' }
                );
            }
        }

        return {
            id: String(item.id),
            name: item.name || '',
            image_url: item.image_url || '',
            video_url: item.video_url,
            body_parts: item.body_parts,
            equipment: item.equipment,
            sets: defaultSets,
            notes: item.notes || '',
            pinnedNote: item.pinnedNote || '',
            showPinnedNote: false,
            weightUnit: 'kg' as const,
            restTime: item.restTime || 90,
            expanded: newIdx === 0,
        };
    });
}

interface WorkoutState {
    currentWorkout: Exercise[];
    isWorkoutActive: boolean;
    workoutStartTime: number | null;
    returnPath: string | null;
    activeExercises: any[];
    activePlanId: string | null;
    hasHydrated: boolean;
    
    addToWorkout: (exercise: Exercise) => void;
    loadWorkout: (name: string, exercises: any[], planId?: string | null) => void;
    removeFromWorkout: (id: string) => void;
    clearWorkout: () => void;
    startWorkout: () => void;
    finishWorkout: () => void;
    setIsWorkoutActive: (active: boolean) => void;
    setReturnPath: (path: string | null) => void;
    saveActiveSession: (exercises: any[], activePlanId: string | null) => void;
    setHasHydrated: (hydrated: boolean) => void;
}

export const useWorkoutStore = create<WorkoutState>()(persist((set) => ({
    currentWorkout: [],
    isWorkoutActive: false,
    workoutStartTime: null,
    returnPath: null,
    activeExercises: [],
    activePlanId: null,
    hasHydrated: false,

    setReturnPath: (path) => set({ returnPath: path }),
    saveActiveSession: (activeExercises, activePlanId) => set({ activeExercises, activePlanId }),
    setHasHydrated: (hasHydrated) => set({ hasHydrated }),

    addToWorkout: (exercise) => set((state) => {
        const idStr = String(exercise.id);
        if (state.activeExercises.some(e => String(e.id) === idStr) || state.currentWorkout.some(e => String(e.id) === idStr)) {
            return state;
        }
        const prepared = prepareWorkoutExercises([exercise]);
        return {
            currentWorkout: [...state.currentWorkout, exercise],
            activeExercises: [...state.activeExercises, ...prepared],
        };
    }),

    loadWorkout: (name, exercises, planId) => {
        const enriched = prepareWorkoutExercises(exercises);
        set({
            currentWorkout: exercises,
            activeExercises: enriched,
            activePlanId: planId || null,
            isWorkoutActive: true,
            workoutStartTime: Date.now()
        });
    },

    removeFromWorkout: (id) => set((state) => {
        const idStr = String(id);
        return {
            currentWorkout: state.currentWorkout.filter(e => String(e.id) !== idStr),
            activeExercises: state.activeExercises.filter(e => String(e.id) !== idStr),
        };
    }),

    clearWorkout: () => set({
        currentWorkout: [],
        isWorkoutActive: false,
        workoutStartTime: null,
        returnPath: null,
        activeExercises: [],
        activePlanId: null
    }),

    startWorkout: () => set({
        isWorkoutActive: true,
        workoutStartTime: Date.now(),
        activeExercises: [],
        currentWorkout: [],
    }),

    finishWorkout: () => set({
        isWorkoutActive: false,
        workoutStartTime: null,
        currentWorkout: [],
        activeExercises: [],
        activePlanId: null,
        returnPath: null
    }),

    setIsWorkoutActive: (active) => set({ isWorkoutActive: active }),
}), {
        name: '@active_workout_session',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
            currentWorkout: state.currentWorkout,
            isWorkoutActive: state.isWorkoutActive,
            workoutStartTime: state.workoutStartTime,
            returnPath: state.returnPath,
            activeExercises: state.activeExercises,
            activePlanId: state.activePlanId,
        }),
        onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
));
