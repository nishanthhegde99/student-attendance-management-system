import { Platform } from 'react-native';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[Notifications] Setup warning:', error);
    return false;
  }
}

export async function triggerLowAttendanceAlert(studentName: string, percentage: number): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Low Attendance Alert',
        body: `Dear ${studentName}, your current attendance is ${percentage}%, which is below the mandatory 75% college requirement.`,
        sound: true,
      },
      trigger: null, // immediate
    });
  } catch (error) {
    console.warn('[Notifications] Could not schedule alert:', error);
  }
}
