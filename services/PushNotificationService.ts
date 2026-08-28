import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const WORKOUT_REMINDER_ID = 'strive-workout-reminder';
const STREAK_ALERT_ID = 'strive-streak-alert';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function sendTestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;

  await setupAndroidChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Notificações funcionando! ✅',
      body: 'O Strive poderá lembrar você das suas metas e treinos.',
      sound: true,
    },
    trigger: null,
  });
}

export async function scheduleWorkoutReminder(hour: number, minute: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_REMINDER_ID).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: WORKOUT_REMINDER_ID,
    content: {
      title: 'Hora do Treino! 💪',
      body: 'Não perca o ritmo. Seu treino de hoje te espera.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });
}

export async function cancelWorkoutReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_REMINDER_ID).catch(() => {});
}

/**
 * Schedules a one-time streak alert for today at targetHour:targetMinute.
 * If it's already past that time, schedules for tomorrow.
 * Call this on app open when the user hasn't worked out today.
 */
export async function scheduleStreakAlert(
  currentStreak: number,
  targetHour = 20,
  targetMinute = 0,
  forceTomorrow = false,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(STREAK_ALERT_ID).catch(() => {});

  const now = new Date();
  const fire = new Date();
  fire.setHours(targetHour, targetMinute, 0, 0);

  // If already past fire time today, push to tomorrow
  if (forceTomorrow || fire <= now) {
    fire.setDate(fire.getDate() + 1);
  }

  const body =
    currentStreak > 0
      ? `Seu streak de ${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'} está em risco! 🔥 Treine agora para manter.`
      : 'Você ainda não treinou hoje. Comece agora! 🏋️';

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_ALERT_ID,
    content: {
      title: currentStreak > 0 ? '🔥 Streak em Risco!' : '💪 Que tal treinar hoje?',
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fire,
      channelId: Platform.OS === 'android' ? 'streak' : undefined,
    },
  });
}

export async function cancelStreakAlert(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(STREAK_ALERT_ID).catch(() => {});
}

export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Lembretes de Treino',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8B5CF6',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('streak', {
    name: 'Alerta de Streak',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 200, 300],
    lightColor: '#F59E0B',
    sound: 'default',
  });
}
