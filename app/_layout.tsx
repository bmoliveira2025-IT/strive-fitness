import Palette from '../constants/palette.json';
import Ionicons from '@expo/vector-icons/Ionicons';
import { themeVariables } from '../constants/theme-variables';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { InteractionManager, LogBox, Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';
import { ExerciseHistoryProvider } from '../context/ExerciseHistoryContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { SavedWorkoutsProvider } from '../context/SavedWorkoutsContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useWorkoutStore } from '../store/useWorkoutStore';
import '../global.css';

import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { configureNotificationHandler } from '../services/notificationRuntime';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActiveWorkoutBanner } from '../components/ActiveWorkoutBanner';
import { UpdateAvailableModal } from '../components/UpdateAvailableModal';
import WebInstallBanner from '../components/WebInstallBanner';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MuscleTrackerProvider } from '../context/MuscleTrackerContext';
import { NotificationProvider } from '../context/NotificationContext';
import { PushNotificationProvider } from '../context/PushNotificationContext';
import { ToastProvider } from '../context/ToastContext';
import { WorkoutHistoryProvider } from '../context/WorkoutHistoryContext';

configureNotificationHandler();

function AuthProtection({ children }: { children: React.ReactNode }) {
  const { session, isOfflineGuest, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'auth';
    const isAuthenticated = !!session || isOfflineGuest;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && segments[0] !== 'auth') {
      router.replace('/(tabs)');
    }
  }, [session, isOfflineGuest, loading, segments, router]);

  if (loading) {
    return <View className="flex-1 bg-black" />;
  }

  return <>{children}</>;
}

function StackContent() {
  const { theme } = useTheme();
  const isWorkoutActive = useWorkoutStore(state => state.isWorkoutActive);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      router.prefetch('/settings');
      router.prefetch('/preview');
      router.prefetch('/activities');
      router.prefetch('/(tabs)/feed');
    });
    return () => task.cancel();
  }, [router]);

  const showNotification = isWorkoutActive && !pathname.includes('workout') && !pathname.includes('preview') && !pathname.includes('exercise');

  return (
    <>
      <AuthProtection>
        <NavThemeProvider value={
          theme.mode === 'dark' 
            ? { ...DarkTheme, colors: { ...DarkTheme.colors, ...theme.colors, background: 'transparent' } }
            : { ...DefaultTheme, colors: { ...DefaultTheme.colors, ...theme.colors, background: 'transparent' } }
        }>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            
            {/* Stack Screens that were previously hidden in tabs */}
            <Stack.Screen
              name="preview"
              options={{
                presentation: 'card',
                animation: 'none',
                gestureEnabled: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            />
            <Stack.Screen name="settings" options={{ animation: 'fade', gestureEnabled: true }} />
            <Stack.Screen name="achievements" />
            <Stack.Screen name="streak" />
            <Stack.Screen name="muscle-tracking" />
            <Stack.Screen name="muscle-analysis" options={{ headerShown: false }} />
            <Stack.Screen name="muscle-coach-details" />
            <Stack.Screen name="asymmetry-analysis" />
            <Stack.Screen name="asymmetry-history" />
            <Stack.Screen name="activities" />
            <Stack.Screen name="community" />
          </Stack>

          {showNotification && <ActiveWorkoutBanner draggable />}
          <UpdateAvailableModal />
          <WebInstallBanner />
        </NavThemeProvider>
      </AuthProtection>
    </>
  );
}

function RootLayoutContent() {
  const { theme } = useTheme();

  useEffect(() => {
    // 1. Android System UI & Status/Navigation Bar
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
      try {
        RNStatusBar.setBackgroundColor(theme.colors.background, true);
        RNStatusBar.setBarStyle(theme.mode === 'light' ? 'dark-content' : 'light-content', true);
      } catch {}
    }

    // 2. Web / PWA / iPhone Safari / Android Chrome Dynamic Theme Identification
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme.mode);
      document.documentElement.style.backgroundColor = theme.colors.background;
      (document.documentElement.style as any).colorScheme = theme.mode;
      document.body.style.backgroundColor = theme.colors.background;
      (document.body.style as any).colorScheme = theme.mode;

      // Update meta theme-color for browser address bar & notch
      let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', theme.colors.background);

      // Update meta apple-mobile-web-app-status-bar-style
      let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (metaApple) {
        metaApple.setAttribute('content', theme.mode === 'light' ? 'default' : 'black-translucent');
      }
    }
  }, [theme.mode, theme.colors.background]);

  return (
    <SafeAreaProvider>
      <StatusBar
        style={theme.mode === 'light' ? 'dark' : 'light'}
        backgroundColor={theme.colors.background}
        translucent={Platform.OS === 'android'}
      />
      <GestureHandlerRootView style={[themeVariables(theme.colors), { flex: 1, backgroundColor: theme.colors.background }]}>
        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: Platform.OS === 'web' ? 500 : undefined,
            alignSelf: 'center',
            backgroundColor: theme.colors.background,
            ...(Platform.OS === 'web' ? {
              shadowColor: Palette.ink,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 10,
            } : {})
          }}
        >
          <StackContent />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function TabLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const handleSplashFinished = useCallback(() => setSplashFinished(true), []);
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    setIsMounted(true);
    SplashScreen.hideAsync().catch(() => {});

    LogBox.ignoreLogs([
      'SafeAreaView has been deprecated',
      'Expo AV has been deprecated',
      'Warning: ref.measureLayout must be called',
      'Invalid DOM property',
      'Unknown event handler property',
      // Remote push not available in Expo Go SDK 53 — we only use local scheduled notifications
      'expo-notifications: Android Push notifications',
      'expo-notifications: iOS Push notifications',
    ]);
  }, []);

  if (!isMounted || !fontsLoaded || !splashFinished) {
    return (
      <AnimatedSplashScreen onFinish={handleSplashFinished} />
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <SavedWorkoutsProvider>
          <FavoritesProvider>
            <ExerciseHistoryProvider>
              <WorkoutHistoryProvider>
                <PushNotificationProvider>
                  <MuscleTrackerProvider>
                    <NotificationProvider>
                      <ToastProvider>
                        <RootLayoutContent />
                      </ToastProvider>
                    </NotificationProvider>
                  </MuscleTrackerProvider>
                </PushNotificationProvider>
              </WorkoutHistoryProvider>
            </ExerciseHistoryProvider>
          </FavoritesProvider>
        </SavedWorkoutsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
