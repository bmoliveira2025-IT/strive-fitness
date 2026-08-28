import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  cancelStreakAlert,
  cancelWorkoutReminder,
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleStreakAlert,
  scheduleWorkoutReminder,
  sendTestNotification,
  setupAndroidChannels,
} from '../services/PushNotificationService';
import { useWorkoutHistory } from './WorkoutHistoryContext';

const PREFS_KEY = 'strive_push_prefs';

export interface PushNotificationPrefs {
  workoutReminderEnabled: boolean;
  workoutReminderHour: number;
  workoutReminderMinute: number;
  streakAlertEnabled: boolean;
  permissionGranted: boolean;
}

const DEFAULT_PREFS: PushNotificationPrefs = {
  workoutReminderEnabled: false,
  workoutReminderHour: 18,
  workoutReminderMinute: 0,
  streakAlertEnabled: false,
  permissionGranted: false,
};

interface PushNotificationContextType {
  prefs: PushNotificationPrefs;
  updatePrefs: (partial: Partial<PushNotificationPrefs>) => Promise<void>;
  onWorkoutCompleted: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refreshPermission: () => Promise<boolean>;
  testNotification: () => Promise<boolean>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

function todayTrained(history: { date: string }[]): boolean {
  const todayStr = new Date().toDateString();
  return history.some((r) => new Date(r.date).toDateString() === todayStr);
}

function computeStreak(history: { date: string }[]): number {
  if (!history.length) return 0;

  const uniqueDays = [
    ...new Set(history.map((r) => new Date(r.date).setHours(0, 0, 0, 0))),
  ].sort((a, b) => b - a);

  let streak = 0;
  const today = new Date().setHours(0, 0, 0, 0);
  let check = today;

  if (uniqueDays.includes(today)) {
    streak++;
    check -= 86400000;
  } else {
    check -= 86400000;
  }

  while (uniqueDays.includes(check)) {
    streak++;
    check -= 86400000;
  }

  return streak;
}

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<PushNotificationPrefs>(DEFAULT_PREFS);
  const prefsRef = useRef<PushNotificationPrefs>(DEFAULT_PREFS);
  const [initialized, setInitialized] = useState(false);
  const { history } = useWorkoutHistory();

  // Load saved prefs
  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => {
        if (raw) {
          const stored = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
          prefsRef.current = stored;
          setPrefs(stored);
        }
      })
      .catch(() => {})
      .finally(() => setInitialized(true));
  }, []);

  // On startup: set up Android channels and evaluate streak alert
  useEffect(() => {
    if (!initialized || Platform.OS === 'web') return;

    const synchronize = async () => {
      await setupAndroidChannels();
      const granted = await hasNotificationPermission();
      const current = { ...prefsRef.current, permissionGranted: granted };
      await savePrefs(current);

      if (!granted) {
        await Promise.all([cancelWorkoutReminder(), cancelStreakAlert()]);
        return;
      }
      if (current.workoutReminderEnabled) {
        await scheduleWorkoutReminder(current.workoutReminderHour, current.workoutReminderMinute);
      }
      if (current.streakAlertEnabled) {
        if (todayTrained(history)) await cancelStreakAlert();
        else await scheduleStreakAlert(computeStreak(history));
      }
    };
    synchronize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const savePrefs = async (next: PushNotificationPrefs) => {
    prefsRef.current = next;
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  const updatePrefs = useCallback(
    async (partial: Partial<PushNotificationPrefs>) => {
      const next = { ...prefsRef.current, ...partial };
      await savePrefs(next);

      if (Platform.OS === 'web') return;

      // Sync scheduled notifications with new prefs
      if ('workoutReminderEnabled' in partial || 'workoutReminderHour' in partial || 'workoutReminderMinute' in partial) {
        if (next.workoutReminderEnabled && next.permissionGranted) {
          await scheduleWorkoutReminder(next.workoutReminderHour, next.workoutReminderMinute);
        } else {
          await cancelWorkoutReminder();
        }
      }

      if ('streakAlertEnabled' in partial) {
        if (next.streakAlertEnabled && next.permissionGranted) {
          if (!todayTrained(history)) {
            await scheduleStreakAlert(computeStreak(history));
          }
        } else {
          await cancelStreakAlert();
        }
      }
    },
    [history],
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    await updatePrefs({ permissionGranted: granted });
    return granted;
  }, [updatePrefs]);

  const refreshPermission = useCallback(async (): Promise<boolean> => {
    const granted = await hasNotificationPermission();
    if (prefsRef.current.permissionGranted !== granted) {
      await savePrefs({ ...prefsRef.current, permissionGranted: granted });
    }
    return granted;
  }, []);

  const testNotification = useCallback(async (): Promise<boolean> => {
    const granted = await hasNotificationPermission();
    if (!granted) {
      await savePrefs({ ...prefsRef.current, permissionGranted: false });
      return false;
    }
    await sendTestNotification();
    return true;
  }, []);

  // Called immediately after a workout is saved
  const onWorkoutCompleted = useCallback(async () => {
    if (Platform.OS === 'web') return;
    await cancelStreakAlert();
    const current = prefsRef.current;
    if (current.streakAlertEnabled && current.permissionGranted) {
      await scheduleStreakAlert(computeStreak(history), 20, 0, true);
    }
  }, [history]);

  return (
    <PushNotificationContext.Provider value={{ prefs, updatePrefs, onWorkoutCompleted, requestPermission, refreshPermission, testNotification }}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotifications() {
  const ctx = useContext(PushNotificationContext);
  if (!ctx) throw new Error('usePushNotifications must be used within PushNotificationProvider');
  return ctx;
}
