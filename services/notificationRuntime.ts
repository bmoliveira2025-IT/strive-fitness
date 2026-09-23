import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REST_TIMER_NOTIFICATION_ID = 'strive-rest-timer';
// Notification channels are immutable after their first creation. A new id is
// required so existing installations receive the alarm audio attributes too.
const REST_TIMER_CHANNEL_ID = 'rest-timer-v2';

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
  await Notifications.setNotificationChannelAsync(REST_TIMER_CHANNEL_ID, {
    name: 'Timer de Descanso',
    description: 'Avisos de término do descanso entre séries',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });
}

export async function cancelWorkoutNotifications() {
  // Do not cancel unrelated workout/streak reminders.
  await Notifications.cancelScheduledNotificationAsync(REST_TIMER_NOTIFICATION_ID).catch(() => {});
}

export async function scheduleRestNotification(seconds: number) {
  if (Platform.OS === 'web') return;

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== 'granted') {
      throw new Error('Notification permission is required for the rest timer alarm');
    }
  }

  await setupTimerNotificationChannel();
  await cancelWorkoutNotifications();
  await Notifications.scheduleNotificationAsync({
    identifier: REST_TIMER_NOTIFICATION_ID,
    content: {
      title: '⏱️ Descanso finalizado!',
      body: 'Hora de voltar para a série!',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { type: 'rest-timer-finished' },
    },
    trigger: {
      // An absolute DATE trigger maps to an RTC_WAKEUP alarm on Android. Expo
      // uses setExactAndAllowWhileIdle when exact-alarm access is available.
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: Date.now() + Math.max(1, seconds) * 1000,
      ...(Platform.OS === 'android' ? { channelId: REST_TIMER_CHANNEL_ID } : {}),
    },
  });
}
