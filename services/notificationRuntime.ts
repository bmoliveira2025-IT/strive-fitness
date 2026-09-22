import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function setupTimerNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('timer', {
    name: 'Timer de Descanso',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
  });
}

export async function cancelWorkoutNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleRestNotification(seconds: number) {
  await cancelWorkoutNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏱️ Descanso finalizado!',
      body: 'Hora de voltar para a série!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
      ...(Platform.OS === 'android' ? { channelId: 'timer' } : {}),
    },
  });
}
