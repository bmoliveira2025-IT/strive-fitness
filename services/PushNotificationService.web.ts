export async function requestNotificationPermission() { return false; }
export async function hasNotificationPermission() { return false; }
export async function sendTestNotification() {}
export async function scheduleWorkoutReminder(_hour: number, _minute: number) {}
export async function cancelWorkoutReminder() {}
export async function scheduleStreakAlert(
  _currentStreak: number,
  _targetHour = 20,
  _targetMinute = 0,
  _forceTomorrow = false
) {}
export async function cancelStreakAlert() {}
export async function setupAndroidChannels() {}
