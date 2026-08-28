import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const HISTORY_STORAGE_KEY = '@workout_history_v2';

export interface HistorySet {
    kg: number;
    reps: number;
    type: 'N' | 'W' | 'D' | 'F';
}

export interface HistoryExercise {
    id: string;
    name: string;
    image_url?: string;
    video_url?: string;
    body_parts?: string[]; // Needed for cardio tracking
    sets: HistorySet[];
}

export interface PostWorkoutSurvey {
    intensity: 'leve' | 'moderado' | 'intenso';
    completedAllSeries: boolean;
    discomfort: boolean;
    feeling: 'energizado' | 'cansado' | 'satisfeito';
}

export interface WorkoutHistoryRecord {
    id: string;
    workoutId?: string | null;
    workoutName: string;
    date: string; // ISO string
    duration: number; // in seconds
    totalVolume: number;
    totalSeries: number;
    exercises: HistoryExercise[];
    postWorkoutSurvey?: PostWorkoutSurvey;
    notes?: string;
    media?: string[];
}

type WorkoutHistoryContextType = {
    history: WorkoutHistoryRecord[];
    addHistoryRecord: (record: Omit<WorkoutHistoryRecord, 'id' | 'date'>, transactionId?: string) => Promise<void>;
    clearHistory: () => void;
};

const WorkoutHistoryContext = createContext<WorkoutHistoryContextType | undefined>(undefined);

export function WorkoutHistoryProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState<WorkoutHistoryRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            saveHistory();
        }
    }, [history, isLoaded]);

    const loadHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load history', e);
        } finally {
            setIsLoaded(true);
        }
    };

    const saveHistory = async () => {
        try {
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history', e);
        }
    };

    const addHistoryRecord = async (record: Omit<WorkoutHistoryRecord, 'id' | 'date'>, transactionId?: string) => {
        const newRecord: WorkoutHistoryRecord = {
            ...record,
            id: transactionId || Date.now().toString(),
            date: new Date().toISOString(),
        };
        // A stable transaction id makes retries idempotent after partial failures.
        const nextHistory = [newRecord, ...history.filter(item => item.id !== newRecord.id)];
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
        setHistory(nextHistory);
    };

    const clearHistory = () => {
        setHistory([]);
    };

    return (
        <WorkoutHistoryContext.Provider value={{ history, addHistoryRecord, clearHistory }}>
            {children}
        </WorkoutHistoryContext.Provider>
    );
}

export function useWorkoutHistory() {
    const context = useContext(WorkoutHistoryContext);
    if (context === undefined) {
        throw new Error('useWorkoutHistory must be used within a WorkoutHistoryProvider');
    }
    return context;
}
