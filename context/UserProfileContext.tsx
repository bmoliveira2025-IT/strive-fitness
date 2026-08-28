import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const PROFILE_STORAGE_KEY = '@user_profile';

export type TrainingObjective = 'hipertrofia' | 'força' | 'cutting';

export interface WeightEntry {
    date: string;
    value: number;
}

export interface BodyMeasurements {
    fatPercentage?: number;
    caloricIntake?: number;
    neck?: number;
    shoulders?: number;
    chest?: number;
    abdomen?: number;
    waist?: number;
    hips?: number;
    leftArm?: number;
    rightArm?: number;
    leftForearm?: number;
    rightForearm?: number;
    leftThigh?: number;
    rightThigh?: number;
    leftCalf?: number;
    rightCalf?: number;
    thigh?: number;
    bicep?: number;
    updatedAt: string;
}

export interface ProgressPhoto {
    id: string;
    uri: string;
    date: string;
    note?: string;
}

export interface OnboardingData {
    goal: 'perder peso' | 'ganhar massa' | 'condicionamento' | 'reabilitação';
    lastTimeExercise: string;
    medicalRestrictions: string;
    experienceLevel: string;
    daysPerWeek: number;
    preferredTime: string;
}

export interface PeriodicAssessment {
    date: string;
    weight: number;
    fatPercentage?: number;
    measurements?: BodyMeasurements;
    energyLevel: number; // 1-10
    completingWorkouts: boolean;
    painOrDiscomfort: boolean;
    satisfaction?: number;
    motivation?: number;
    difficulty?: string;
}

export interface WeeklyMonitoring {
    date: string;
    weight: number;
    sleepQuality: number;
    stressLevel: number;
    energyLevel: number;
    recoveryLevel: number;
}

export interface QuarterlyReevaluation {
    date: string;
    satisfied: boolean;
    adjustObjectives: boolean;
}

export interface UserProfile {
    id: string;
    weight?: number; // Current weight kg
    weightHistory?: WeightEntry[]; // Track weight over time
    measurements?: BodyMeasurements;
    progressPhotos?: ProgressPhoto[];
    height?: number; // cm
    objective?: TrainingObjective;
    bio?: string;
    photoUri?: string;
    hasOnboarded: boolean;
    onboardingData?: OnboardingData;
    periodicAssessments?: PeriodicAssessment[];
    weeklyMonitoring?: WeeklyMonitoring[];
    quarterlyReevaluations?: QuarterlyReevaluation[];
    trackingStats: {
        lastWeeklyMonitoring?: string;
        lastPeriodicAssessment?: string;
        lastQuarterlyReevaluation?: string;
    };
    createdAt: string;
    updatedAt: string;
}

type UserProfileContextType = {
    profile: UserProfile | null;
    updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
    addWeeklyMonitoring: (entry: WeeklyMonitoring) => Promise<void>;
    addPeriodicAssessment: (entry: PeriodicAssessment) => Promise<void>;
    clearProfile: () => Promise<void>;
    isLoading: boolean;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
            if (stored) {
                setProfile(JSON.parse(stored));
            } else {
                // Create initial profile
                const newProfile: UserProfile = {
                    id: Date.now().toString(),
                    hasOnboarded: false,
                    trackingStats: {},
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                setProfile(newProfile);
                await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
            }
        } catch (e) {
            console.error('Failed to load profile', e);
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => {
        try {
            if (!profile) return;

            const updatedProfile: UserProfile = {
                ...profile,
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            // If weight is updated, also add to history
            if (updates.weight !== undefined) {
                const newEntry: WeightEntry = {
                    date: new Date().toISOString(),
                    value: updates.weight
                };
                updatedProfile.weightHistory = [
                    ...(profile.weightHistory || []),
                    newEntry
                ];
            }

            setProfile(updatedProfile);
            await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
        } catch (e) {
            console.error('Failed to update profile', e);
        }
    };

    const addWeeklyMonitoring = async (entry: WeeklyMonitoring) => {
        try {
            if (!profile) return;
            const updatedProfile: UserProfile = {
                ...profile,
                weeklyMonitoring: [...(profile.weeklyMonitoring || []), entry],
                trackingStats: {
                    ...profile.trackingStats,
                    lastWeeklyMonitoring: entry.date
                },
                updatedAt: new Date().toISOString()
            };
            setProfile(updatedProfile);
            await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
        } catch (e) {
            console.error('Failed to add weekly monitoring', e);
        }
    };

    const addPeriodicAssessment = async (entry: PeriodicAssessment) => {
        try {
            if (!profile) return;
            const updatedProfile: UserProfile = {
                ...profile,
                periodicAssessments: [...(profile.periodicAssessments || []), entry],
                trackingStats: {
                    ...profile.trackingStats,
                    lastPeriodicAssessment: entry.date
                },
                updatedAt: new Date().toISOString()
            };
            setProfile(updatedProfile);
            await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
        } catch (e) {
            console.error('Failed to add periodic assessment', e);
        }
    };

    const clearProfile = async () => {
        try {
            await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
            const newProfile: UserProfile = {
                id: Date.now().toString(),
                hasOnboarded: false,
                trackingStats: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setProfile(newProfile);
        } catch (e) {
            console.error('Failed to clear profile', e);
        }
    };

    return (
        <UserProfileContext.Provider value={{
            profile,
            updateProfile,
            addWeeklyMonitoring,
            addPeriodicAssessment,
            clearProfile,
            isLoading
        }}>
            {children}
        </UserProfileContext.Provider>
    );
}

export function useUserStore() {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
}
