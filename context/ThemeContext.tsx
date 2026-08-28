import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

const THEME_STORAGE_KEY = '@app_theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
    // Backgrounds
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    card: string;
    cardBorder: string;

    // Text
    text: string;
    textSecondary: string;
    textMuted: string;

    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    onPrimary: string;

    // Status colors
    success: string;
    error: string;
    warning: string;

    // UI elements
    border: string;
    divider: string;
    overlay: string;
    shadow: string;

    // Tab bar
    tabBarBackground: string;
    tabBarBorder: string;
    tabBarActive: string;
    tabBarInactive: string;
}

export interface Theme {
    mode: ThemeMode;
    colors: ThemeColors;
}

// Strive Premium Athletic Minimalism — Clean Mineral Light
const lightTheme: ThemeColors = {
    background: '#F8FAFC',
    backgroundSecondary: '#F1F5F9',
    backgroundTertiary: '#E2E8F0',
    card: '#FFFFFF',
    cardBorder: 'rgba(15, 23, 42, 0.08)',

    // Text - High Legibility Slate
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',

    // Primary - Athletic Performance Accent
    primary: '#4D7C0F',
    primaryLight: '#65A30D',
    primaryDark: '#3F6212',
    onPrimary: '#FFFFFF',

    // Status colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',

    // UI elements
    border: 'rgba(15, 23, 42, 0.08)',
    divider: 'rgba(15, 23, 42, 0.04)',
    overlay: 'rgba(15, 23, 42, 0.45)',
    shadow: 'rgba(15, 23, 42, 0.06)',

    // Tab bar
    tabBarBackground: 'rgba(255, 255, 255, 0.96)',
    tabBarBorder: 'rgba(15, 23, 42, 0.08)',
    tabBarActive: '#4D7C0F',
    tabBarInactive: '#94A3B8',
};

// Strive Premium Athletic Minimalism — Deep Athletic Graphite Dark
const darkTheme: ThemeColors = {
    background: '#0D0F12',
    backgroundSecondary: '#13161B',
    backgroundTertiary: '#1A1E24',
    card: '#161A20',
    cardBorder: 'rgba(255, 255, 255, 0.07)',

    // Text - Crisp Pure Slate
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Primary - Electric Performance Lime (20% Personality)
    primary: '#B7F52A',
    primaryLight: '#D7FF72',
    primaryDark: '#8CC80D',
    onPrimary: '#0D0F12',

    // Status colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',

    // UI elements
    border: 'rgba(255, 255, 255, 0.07)',
    divider: 'rgba(255, 255, 255, 0.04)',
    overlay: 'rgba(13, 15, 18, 0.85)',
    shadow: 'rgba(0, 0, 0, 0.4)',

    // Tab bar
    tabBarBackground: 'rgba(19, 22, 27, 0.95)',
    tabBarBorder: 'rgba(255, 255, 255, 0.07)',
    tabBarActive: '#B7F52A',
    tabBarInactive: '#64748B',
};

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>(systemColorScheme || 'dark');
    const [isLoading, setIsLoading] = useState(true);

    // Load saved theme preference
    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme) {
                setThemeMode(savedTheme as ThemeMode);
            } else {
                const defaultTheme: ThemeMode = systemColorScheme || 'dark';
                setThemeMode(defaultTheme);
                await AsyncStorage.setItem(THEME_STORAGE_KEY, defaultTheme);
            }
        } catch (error) {
            console.error('Failed to load theme', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setTheme = async (mode: ThemeMode) => {
        try {
            setThemeMode(mode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const toggleTheme = async () => {
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        await setTheme(newMode);
    };

    const theme: Theme = {
        mode: themeMode,
        colors: themeMode === 'light' ? lightTheme : darkTheme,
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
