import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// expo-notifications remote push is not supported in Expo Go (SDK 53+).
// Lazy-require the module inside functions to avoid the module-level warning.
const isExpoGo = Constants.appOwnership === 'expo';

function getNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-notifications') as typeof import('expo-notifications');
}

// Set up foreground notification handling (only in dev builds)
if (!isExpoGo) {
  getNotifications().setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  if (isExpoGo) return;

  const Notifications = getNotifications();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Klowk Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5A00',
    });
  }

  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    })).data;
    return token;
  } catch (e) {
    console.log('Failed to get push token:', e);
  }
}

export async function sendLocalNotification(title: string, body: string, data = {}) {
  const Notifications = getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null,
  });
}
