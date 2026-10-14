import { Platform, Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Task } from '@/types';

// Check if running in Expo Go (which does not support expo-notifications on Android in SDK 53+)
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

let Notifications: any = null;

// Safely load expo-notifications only if not in Expo Go, with try/catch guard
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (error) {
    console.warn('expo-notifications is unavailable:', error);
    Notifications = null;
  }
}

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (!Notifications) {
      // In Expo Go, simulated permission granted for UI flows
      return true;
    }
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permissions:', e);
      return false;
    }
  },

  async scheduleTaskReminder(task: Task): Promise<string | undefined> {
    if (Platform.OS === 'web' || !task.reminder?.enabled || !task.date) {
      return undefined;
    }

    const simId = `sim-rem-${Date.now()}`;

    if (!Notifications) {
      // Safe fallback for Expo Go
      console.log(
        `[CodeTrack Reminder Scheduled] "${task.title}" for ${task.reminder.triggerTime || task.startTime || '09:00'}`
      );
      return simId;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return undefined;

      const timeParts = (task.reminder.triggerTime || task.startTime || '09:00').split(':');
      const hours = parseInt(timeParts[0], 10) || 9;
      const minutes = parseInt(timeParts[1], 10) || 0;

      const [year, month, day] = task.date.split('-').map(Number);
      const triggerDate = new Date(year, month - 1, day, hours, minutes, 0);

      const now = new Date();
      let triggerTimeSeconds = Math.max(10, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));
      if (triggerTimeSeconds <= 0) {
        triggerTimeSeconds = 60;
      }

      if (task.reminder.notificationId && !task.reminder.notificationId.startsWith('sim-')) {
        await this.cancelReminder(task.reminder.notificationId);
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `CodeTrack Reminder: ${task.title}`,
          body: `Time to code! Priority: ${task.priority} | Category: ${task.category}`,
          data: { taskId: task.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerTimeSeconds,
        },
      });

      return id;
    } catch (e) {
      console.warn('scheduleTaskReminder error:', e);
      return simId;
    }
  },

  async cancelReminder(notificationId?: string): Promise<void> {
    if (Platform.OS === 'web' || !notificationId || !Notifications) return;
    try {
      if (!notificationId.startsWith('sim-')) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    } catch (e) {
      console.warn('cancelReminder error:', e);
    }
  },

  async scheduleStudyReminder(
    minutes: number,
    label: string = 'Study Session'
  ): Promise<string | undefined> {
    const simId = `sim-study-${Date.now()}`;
    if (Platform.OS === 'web') return undefined;

    if (!Notifications) {
      // In Expo Go, show in-app alert after duration
      if (minutes <= 0.2) {
        setTimeout(() => {
          Alert.alert(
            `🎯 ${label} Complete!`,
            'Great job staying focused! Take a short break or check off your completed task.'
          );
        }, Math.max(1000, Math.round(minutes * 60 * 1000)));
      }
      return simId;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return undefined;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎯 ${label} Complete!`,
          body: 'Great job staying focused! Take a short break or check off your completed task.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(5, Math.round(minutes * 60)),
        },
      });
      return id;
    } catch (e) {
      console.warn('scheduleStudyReminder error:', e);
      return simId;
    }
  },

  async getUpcomingNotifications(): Promise<any[]> {
    if (Platform.OS === 'web' || !Notifications) return [];
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('getUpcomingNotifications error:', e);
      return [];
    }
  },
};
