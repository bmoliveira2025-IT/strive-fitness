import palette from '../constants/palette.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

const THEME_STORAGE_KEY = '@app_theme';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = typeof palette.light;

export interface Theme {
    mode: ThemeMode;
    colors: ThemeColors;
}

// Shared visual tokens; theme selection and persistence are unchanged.
const lightTheme: ThemeColors = palette.light;
const darkTheme: ThemeColors = palette.dark;

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
