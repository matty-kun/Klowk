import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

const DAILY_REMINDER_KEY = "daily_reminder_enabled";
const DAILY_REMINDER_HOUR_KEY = "daily_reminder_hour";
const DAILY_REMINDER_MINUTE_KEY = "daily_reminder_minute";
const DAILY_REMINDER_ID = "daily-reminder";

// expo-notifications remote push is not supported in Expo Go (SDK 53+).
// Lazy-require the module inside functions to avoid the module-level warning.
const isExpoGo = Constants.appOwnership === "expo";

function getNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("expo-notifications") as typeof import("expo-notifications");
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

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Flow Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FBBF24",
    });
  }

  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      })
    ).data;
    return token;
  } catch (e) {
    console.log("Failed to get push token:", e);
  }
}

export async function scheduleDailyReminder(hour = 9, minute = 0) {
  const Notifications = getNotifications();

  // Cancel any existing daily reminder first
  await cancelDailyReminder();

  const trigger: any = {
    type: "daily",
    hour,
    minute,
    channelId: "default",
  };

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: "Time to log your day! ⏱",
      body: "Don't forget to track what you worked on today.",
      sound: "default",
    },
    trigger,
  });

  await AsyncStorage.setItem(DAILY_REMINDER_KEY, "true");
  await AsyncStorage.setItem(DAILY_REMINDER_HOUR_KEY, String(hour));
  await AsyncStorage.setItem(DAILY_REMINDER_MINUTE_KEY, String(minute));
}

export async function cancelDailyReminder() {
  const Notifications = getNotifications();
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  await AsyncStorage.setItem(DAILY_REMINDER_KEY, "false");
}

export async function getDailyReminderSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(DAILY_REMINDER_KEY),
    AsyncStorage.getItem(DAILY_REMINDER_HOUR_KEY),
    AsyncStorage.getItem(DAILY_REMINDER_MINUTE_KEY),
  ]);
  return {
    enabled: enabled === "true",
    hour: hour != null ? parseInt(hour) : 9,
    minute: minute != null ? parseInt(minute) : 0,
  };
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data = {},
) {
  const Notifications = getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: "default",
    },
    trigger: Platform.OS === "android"
        ? { type: "channel", channelId: "default" } as Parameters<typeof Notifications.scheduleNotificationAsync>[0]["trigger"]
        : null,
  });
}
