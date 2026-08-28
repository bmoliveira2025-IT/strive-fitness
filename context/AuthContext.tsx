import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

const GUEST_KEY = '@strive_offline_guest';

type AuthContextType = {
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    isOfflineGuest: boolean;
    continueAsGuest: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    loading: true,
    isAdmin: false,
    isOfflineGuest: false,
    continueAsGuest: async () => {},
    signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isOfflineGuest, setIsOfflineGuest] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                // Check if user previously chose offline guest mode
                const guestStored = await AsyncStorage.getItem(GUEST_KEY);
                if (guestStored === 'true' && isMounted) {
                    setIsOfflineGuest(true);
                }

                // Safety timeout so app NEVER freezes on startup without internet
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<any>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null } }), 3000)
                );

                const res = await Promise.race([sessionPromise, timeoutPromise]);
                const currentSession = res?.data?.session || null;

                if (isMounted) {
                    setSession(currentSession);
                    if (currentSession?.user) {
                        useUserStore.getState().syncFromAuthUser(currentSession.user);
                    }
                }
            } catch (err) {
                console.warn('Auth initialization error or offline:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (isMounted) {
                setSession(newSession);
                if (newSession?.user) {
                    useUserStore.getState().syncFromAuthUser(newSession.user);
                    setIsOfflineGuest(false);
                    AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
                }
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const continueAsGuest = async () => {
        setIsOfflineGuest(true);
        await AsyncStorage.setItem(GUEST_KEY, 'true');
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('SignOut error or offline:', e);
        }
        await AsyncStorage.removeItem(GUEST_KEY);
        setIsOfflineGuest(false);
        setSession(null);
    };

    const value = {
        session,
        loading,
        isAdmin: false,
        isOfflineGuest,
        continueAsGuest,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
