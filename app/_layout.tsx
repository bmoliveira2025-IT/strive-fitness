import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { InteractionManager, LogBox, Platform, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';
import { ExerciseHistoryProvider } from '../context/ExerciseHistoryContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { SavedWorkoutsProvider } from '../context/SavedWorkoutsContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useWorkoutStore } from '../store/useWorkoutStore';
import '../global.css';

import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActiveWorkoutBanner } from '../components/ActiveWorkoutBanner';
import { FloatingMusicPlayer } from '../components/FloatingMusicPlayer';
import { UpdateAvailableModal } from '../components/UpdateAvailableModal';
import WebInstallBanner from '../components/WebInstallBanner';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MusicPlayerProvider } from '../context/MusicPlayerContext';
import { MuscleTrackerProvider } from '../context/MuscleTrackerContext';
import { NotificationProvider } from '../context/NotificationContext';
import { PushNotificationProvider } from '../context/PushNotificationContext';
import { ToastProvider } from '../context/ToastContext';
import { WorkoutHistoryProvider } from '../context/WorkoutHistoryContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  const { isWorkoutActive } = useWorkoutStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      router.prefetch('/settings');
      router.prefetch('/preview');
      router.prefetch('/activities');
      router.prefetch('/community');
    });
    return () => task.cancel();
  }, [router]);

  const showNotification = isWorkoutActive && !pathname.includes('workout') && !pathname.includes('preview') && !pathname.includes('exercise');

  return (
    <>
      <WebInstallBanner />
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
            <Stack.Screen name="muscle-coach-details" />
            <Stack.Screen name="asymmetry-analysis" />
            <Stack.Screen name="asymmetry-history" />
            <Stack.Screen name="activities" />
            <Stack.Screen name="community" />
          </Stack>

          {showNotification && <ActiveWorkoutBanner draggable />}
          <FloatingMusicPlayer />
          <UpdateAvailableModal />
        </NavThemeProvider>
      </AuthProtection>
    </>
  );
}

function RootLayoutContent() {
  const { theme } = useTheme();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? '#0D0F12' : 'transparent' }}>
        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: Platform.OS === 'web' ? 500 : undefined,
            alignSelf: 'center',
            backgroundColor: theme.colors.background,
            ...(Platform.OS === 'web' ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            } : {})
          }}
        >
          <LinearGradient
            colors={theme.mode === 'dark' ? ['#13161B', '#0D0F12', '#0A0C0E'] : ['#FFFFFF', '#F8FAFC', '#F1F5F9']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <StackContent />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function TabLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
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
      <AnimatedSplashScreen onFinish={() => setSplashFinished(true)} />
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
                      <MusicPlayerProvider>
                        <ToastProvider>
                          <RootLayoutContent />
                        </ToastProvider>
                      </MusicPlayerProvider>
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
