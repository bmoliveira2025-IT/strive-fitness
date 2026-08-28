import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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

interface UserState {
    userName: string;
    setUserName: (name: string) => void;
    
    profile: UserProfile | null;
    updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
    addWeeklyMonitoring: (entry: WeeklyMonitoring) => void;
    addPeriodicAssessment: (entry: PeriodicAssessment) => void;
    clearProfile: () => void;
    
    // We add this function to initialize default profile if it doesn't exist yet
    initProfileIfNeeded: () => void;
    syncFromAuthUser: (user: any) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            userName: 'Atleta',
            setUserName: (name) => set({ userName: name }),

            profile: null,

            syncFromAuthUser: (user: any) => {
                if (!user) return;
                const meta = user.user_metadata || {};
                const idData = (user.identities && user.identities[0] && user.identities[0].identity_data) || {};

                const avatar = meta.avatar_url || meta.picture || idData.avatar_url || idData.picture;
                const name = meta.full_name || meta.name || meta.user_name || idData.full_name || idData.name || user.email?.split('@')[0];

                const currentProfile = get().profile;
                const currentName = get().userName;

                if (name && (currentName === 'Atleta' || !currentName || currentName.trim() === '')) {
                    set({ userName: name });
                }

                if (!currentProfile) {
                    set({
                        profile: {
                            id: user.id || Date.now().toString(),
                            photoUri: avatar || undefined,
                            hasOnboarded: false,
                            trackingStats: {},
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }
                    });
                } else if (avatar && currentProfile.photoUri !== avatar) {
                    set({
                        profile: {
                            ...currentProfile,
                            photoUri: avatar,
                            updatedAt: new Date().toISOString(),
                        }
                    });
                }
            },

            initProfileIfNeeded: () => {
                if (!get().profile) {
                    set({
                        profile: {
                            id: Date.now().toString(),
                            hasOnboarded: false,
                            trackingStats: {},
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }
                    });
                }
            },

            updateProfile: (updates) => set((state) => {
                if (!state.profile) return state;

                const updatedProfile: UserProfile = {
                    ...state.profile,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };

                if (updates.weight !== undefined) {
                    const newEntry: WeightEntry = {
                        date: new Date().toISOString(),
                        value: updates.weight
                    };
                    updatedProfile.weightHistory = [
                        ...(state.profile.weightHistory || []),
                        newEntry
                    ];
                }

                return { profile: updatedProfile };
            }),

            addWeeklyMonitoring: (entry) => set((state) => {
                if (!state.profile) return state;
                return {
                    profile: {
                        ...state.profile,
                        weeklyMonitoring: [...(state.profile.weeklyMonitoring || []), entry],
                        trackingStats: {
                            ...state.profile.trackingStats,
                            lastWeeklyMonitoring: entry.date
                        },
                        updatedAt: new Date().toISOString()
                    }
                };
            }),

            addPeriodicAssessment: (entry) => set((state) => {
                if (!state.profile) return state;
                return {
                    profile: {
                        ...state.profile,
                        periodicAssessments: [...(state.profile.periodicAssessments || []), entry],
                        trackingStats: {
                            ...state.profile.trackingStats,
                            lastPeriodicAssessment: entry.date
                        },
                        updatedAt: new Date().toISOString()
                    }
                };
            }),

            clearProfile: () => set({
                userName: 'Atleta',
                profile: {
                    id: Date.now().toString(),
                    hasOnboarded: false,
                    trackingStats: {},
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            })
        }),
        {
            name: '@user_store',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.initProfileIfNeeded();
                }
            }
        }
    )
);
