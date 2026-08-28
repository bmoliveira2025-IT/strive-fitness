import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = '@exercise_history';

type ExerciseRecord = {
    lastKg: string;
    lastReps: string;
    bestKg: string;
    bestReps: string;
    lastDate: string;
    lastSets?: { [index: number]: { kg: string, reps: string } }; // New field for granular history
};

type ExerciseHistoryData = {
    [exerciseId: string]: ExerciseRecord;
};

type ExerciseHistoryContextType = {
    history: ExerciseHistoryData;
    getHistory: (exerciseId: string) => ExerciseRecord | null;
    updateHistory: (exerciseId: string, kg: string, reps: string, setIndex?: number) => void;
    updateHistoryBatch: (updates: { exerciseId: string; kg: string; reps: string; setIndex?: number }[]) => Promise<void>;
    checkIsPR: (exerciseId: string, kg: string, reps: string) => boolean;
};

const ExerciseHistoryContext = createContext<ExerciseHistoryContextType | undefined>(undefined);

export function ExerciseHistoryProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState<ExerciseHistoryData>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            saveHistory(history);
        }
    }, [history, isLoaded]);

    const loadHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load exercise history:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const saveHistory = async (newHistory: ExerciseHistoryData) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Failed to save exercise history:', error);
        }
    };

    const getHistory = (exerciseId: string): ExerciseRecord | null => {
        return history[exerciseId] || null;
    };

    const updateHistory = (exerciseId: string, kg: string, reps: string, setIndex?: number) => {
        setHistory(prev => {
            const kgNum = parseFloat(kg) || 0;
            const repsNum = parseInt(reps) || 0;

            const current = prev[exerciseId];
            const currentBestKg = current ? parseFloat(current.bestKg) || 0 : 0;
            const currentBestReps = current ? parseInt(current.bestReps) || 0 : 0;

            const newLastSets = current?.lastSets ? { ...current.lastSets } : {};
            if (setIndex !== undefined) {
                newLastSets[setIndex] = { kg, reps };
            }

            const newRecord: ExerciseRecord = {
                lastKg: kg, // We keep the global lastKg as the last updated set for backward compatibility
                lastReps: reps,
                bestKg: kgNum > currentBestKg ? kg : (current?.bestKg || kg),
                bestReps: repsNum > currentBestReps ? reps : (current?.bestReps || reps),
                lastDate: new Date().toISOString(),
                lastSets: newLastSets
            };

            return { ...prev, [exerciseId]: newRecord };
        });
    };

    const updateHistoryBatch = async (updates: { exerciseId: string; kg: string; reps: string; setIndex?: number }[]) => {
        const nextHistory = updates.reduce<ExerciseHistoryData>((next, update) => {
            const current = next[update.exerciseId];
            const kgNum = parseFloat(update.kg) || 0;
            const repsNum = parseInt(update.reps) || 0;
            const currentBestKg = current ? parseFloat(current.bestKg) || 0 : 0;
            const currentBestReps = current ? parseInt(current.bestReps) || 0 : 0;
            const lastSets = current?.lastSets ? { ...current.lastSets } : {};
            if (update.setIndex !== undefined) lastSets[update.setIndex] = { kg: update.kg, reps: update.reps };

            next[update.exerciseId] = {
                lastKg: update.kg,
                lastReps: update.reps,
                bestKg: kgNum > currentBestKg ? update.kg : (current?.bestKg || update.kg),
                bestReps: repsNum > currentBestReps ? update.reps : (current?.bestReps || update.reps),
                lastDate: new Date().toISOString(),
                lastSets,
            };
            return next;
        }, { ...history });

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
        setHistory(nextHistory);
    };

    const checkIsPR = (exerciseId: string, kg: string, reps: string): boolean => {
        const current = history[exerciseId];
        if (!current) return false;

        const kgNum = parseFloat(kg) || 0;
        const repsNum = parseInt(reps) || 0;
        const bestKg = parseFloat(current.bestKg) || 0;
        const bestReps = parseInt(current.bestReps) || 0;

        // A PR is considered only if:
        // 1. Weight is strictly higher than previous best weight AND reps are at least equal to best reps
        // 2. OR Reps are strictly higher than previous best reps AND weight is at least equal to best weight
        // This ensures the "Explosion" only happens when a real progress boundary is crossed.
        return (kgNum > bestKg && repsNum >= bestReps) || (repsNum > bestReps && kgNum >= bestKg);
    };

    return (
        <ExerciseHistoryContext.Provider value={{
            history,
            getHistory,
            updateHistory,
            updateHistoryBatch,
            checkIsPR,
        }}>
            {children}
        </ExerciseHistoryContext.Provider>
    );
}

export function useExerciseHistory() {
    const context = useContext(ExerciseHistoryContext);
    if (context === undefined) {
        throw new Error('useExerciseHistory must be used within an ExerciseHistoryProvider');
    }
    return context;
}
