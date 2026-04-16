import { useLanguage } from "@/context/LanguageContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
    ArrowLeft,
    Bell,
    Globe,
    Info,
    Moon,
    Trash2,
} from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React from "react";
import {
    Alert,
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const SettingItem = ({
  icon: Icon,
  label,
  value,
  type = "info",
  onPress,
  color = "#FBBF24",
  destructive = false,
  isDark,
  t,
}: any) => {
  const iconBg = destructive ? (isDark ? "#450a0a" : "#FEF2F2") : "#FBBF2415";
  const iconColor = destructive ? "#EF4444" : "#FBBF24";

  return (
    <Pressable
      onPress={() => {
        if (type === "action") {
          impact(ImpactFeedbackStyle.Light);
          onPress?.();
        } else if (type === "switch") {
          onPress?.();
        }
      }}
      className={`flex-row items-center justify-between py-5 px-6 bg-white dark:bg-zinc-900 border-b border-gray-50 dark:border-zinc-800 ${type === "action" ? "active:bg-gray-100 dark:active:bg-zinc-800" : ""}`}
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View
          style={{ backgroundColor: iconBg }}
          className="w-10 h-10 rounded-xl items-center justify-center mr-4"
        >
          <Icon size={20} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text
            className={`text-base font-bold ${destructive ? "text-red-500" : "text-klowk-black dark:text-white"}`}
          >
            {label}
          </Text>
          {label === t("clear_logs") && (
            <Text
              className="text-[11px] text-red-400 font-medium mt-0.5"
              numberOfLines={1}
            >
              {t("clear_logs_desc")}
            </Text>
          )}
          {label === t("push_notifications") && (
            <Text
              className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5"
              numberOfLines={1}
            >
              {t("notifications_desc")}
            </Text>
          )}
          {label === t("app_version") && (
            <Text
              className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5"
              numberOfLines={1}
            >
              {t("app_version_desc")}
            </Text>
          )}
        </View>
      </View>
      <View className="items-end">
        {type === "switch" ? (
          <View className="w-12 h-6 bg-gray-100 dark:bg-zinc-800 rounded-full p-1 justify-center">
            <MotiView
              animate={{
                translateX: value ? 24 : 0,
                backgroundColor: value
                  ? "#FBBF24"
                  : isDark
                    ? "#3f3f46"
                    : "#d1d5db",
              }}
              transition={{ type: "spring", damping: 15, stiffness: 120 }}
              className="w-4 h-4 rounded-full"
            />
          </View>
        ) : value ? (
          <Text className="text-gray-400 dark:text-gray-500 font-bold text-sm">
            {value}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

import { useTracking } from "@/context/TrackingContext";
import { getHapticsEnabled, setHapticsEnabled } from "@/utils/haptics";
import {
  cancelDailyReminder,
  getDailyReminderSettings,
  registerForPushNotificationsAsync,
  scheduleDailyReminder,
} from "@/utils/notifications";

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme, setColorScheme } = useColorScheme();
  const { t, language, setLanguage } = useLanguage();
  const { clearAllActivities } = useTracking();
  const isDarkMode = colorScheme === "dark";
  const [localIsDark, setLocalIsDark] = React.useState(isDarkMode);
  const [localLang, setLocalLang] = React.useState(language);

  React.useEffect(() => setLocalIsDark(isDarkMode), [isDarkMode]);
  React.useEffect(() => setLocalLang(language), [language]);
  const [notifications, setNotifications] = React.useState(false);
  const [dailyReminder, setDailyReminder] = React.useState(false);
  const [hapticsOn, setHapticsOn] = React.useState(getHapticsEnabled);

  React.useEffect(() => {
    getDailyReminderSettings().then(({ enabled }) => setDailyReminder(enabled));
  }, []);
  const [langToggleWidth, setLangToggleWidth] = React.useState(0);
  const [themeToggleWidth, setThemeToggleWidth] = React.useState(0);
  const [notifToggleWidth, setNotifToggleWidth] = React.useState(0);

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setNotifications(true);
        notification(NotificationFeedbackType.Success);
        Alert.alert(
          t("notifications_enabled"),
          t("notifications_enabled_desc"),
        );
      }
    } else {
      setNotifications(false);
    }
  };

  const handleToggleDailyReminder = async (val: boolean) => {
    if (val) {
      const token = await registerForPushNotificationsAsync();
      if (token !== undefined || Platform.OS === "ios") {
        await scheduleDailyReminder(9, 0);
        setDailyReminder(true);
        notification(NotificationFeedbackType.Success);
      }
    } else {
      await cancelDailyReminder();
      setDailyReminder(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top"]}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900"
        >
          <ArrowLeft size={20} color={isDarkMode ? "#fff" : "#121212"} />
        </Pressable>
        <Text className="text-lg font-black text-klowk-black dark:text-white">
          {t("settings_title")}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 bg-gray-50/30 dark:bg-klowk-black"
        showsVerticalScrollIndicator={false}
      >
        <View className="py-8 items-center bg-white dark:bg-klowk-black mb-8">
          <Image
            source={require("../assets/images/flow portrait.png")}
            style={{ width: 80, height: 80, borderRadius: 40 }}
            contentFit="cover"
          />
          <Text className="text-2xl font-black text-klowk-black dark:text-white mt-4">
            Flow
          </Text>
        </View>

        <View className="mb-8">
          <Text className="px-6 mb-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t("appearance_stats")}
          </Text>
          <View className="bg-white dark:bg-klowk-black border-y border-gray-50 dark:border-zinc-800">
            {/* Theme Dual Buttons */}
            <View className="flex-row items-center px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
              <View
                style={{ backgroundColor: "#FBBF2415" }}
                className="w-10 h-10 rounded-[12px] items-center justify-center mr-4"
              >
                <Moon size={20} color="#FBBF24" />
              </View>
              <View className="flex-1 mr-4">
                <Text className="text-sm font-bold text-klowk-black dark:text-white">
                  {t("dark_mode")}
                </Text>
                <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  {t("dark_mode_desc")}
                </Text>
              </View>
              <View
                onLayout={(e) =>
                  setThemeToggleWidth(e.nativeEvent.layout.width)
                }
                className="w-[120px] flex-row bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-2xl relative"
              >
                <MotiView
                  animate={{
                    translateX:
                      (localIsDark ? 1 : 0) * ((themeToggleWidth - 8) / 2),
                  }}
                  transition={{ type: "spring", damping: 20, stiffness: 150 }}
                  style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: (themeToggleWidth - 8) / 2 || "48%",
                    backgroundColor: isDarkMode ? "#3f3f46" : "#fff",
                    borderRadius: 12,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (!localIsDark) return;
                    impact(ImpactFeedbackStyle.Light);
                    setLocalIsDark(false);
                    setTimeout(() => setColorScheme("light"), 200);
                  }}
                  className="flex-1 py-3 items-center z-10"
                >
                  <Text
                    className={`text-xs font-black uppercase ${!localIsDark ? "text-amber-400" : "text-gray-400"}`}
                  >
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (localIsDark) return;
                    impact(ImpactFeedbackStyle.Light);
                    setLocalIsDark(true);
                    setTimeout(() => setColorScheme("dark"), 200);
                  }}
                  className="flex-1 py-3 items-center z-10"
                >
                  <Text
                    className={`text-xs font-black uppercase ${localIsDark ? "text-amber-400" : "text-gray-400"}`}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Language Dual Buttons */}
            <View className="flex-row items-center px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
              <View
                style={{ backgroundColor: "#FBBF2415" }}
                className="w-10 h-10 rounded-[12px] items-center justify-center mr-4"
              >
                <Globe size={20} color="#FBBF24" />
              </View>
              <View className="flex-1 mr-4">
                <Text className="text-sm font-bold text-klowk-black dark:text-white">
                  {t("default_language")}
                </Text>
                <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  {t("language_desc")}
                </Text>
              </View>
              <View
                onLayout={(e) => setLangToggleWidth(e.nativeEvent.layout.width)}
                className="w-[120px] flex-row bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-2xl relative"
              >
                <MotiView
                  animate={{
                    translateX:
                      (localLang === "en" ? 0 : 1) *
                      ((langToggleWidth - 8) / 2),
                  }}
                  transition={{ type: "spring", damping: 20, stiffness: 150 }}
                  style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: (langToggleWidth - 8) / 2 || "48%",
                    backgroundColor: isDarkMode ? "#3f3f46" : "#fff",
                    borderRadius: 12,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (localLang === "en") return;
                    impact(ImpactFeedbackStyle.Light);
                    setLocalLang("en");
                    setTimeout(() => setLanguage("en"), 200);
                  }}
                  className="flex-1 py-3 items-center z-10"
                >
                  <Text
                    className={`text-xs font-black uppercase ${localLang === "en" ? "text-amber-400" : "text-gray-400"}`}
                  >
                    English
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (localLang === "tl") return;
                    impact(ImpactFeedbackStyle.Light);
                    setLocalLang("tl");
                    setTimeout(() => setLanguage("tl"), 200);
                  }}
                  className="flex-1 py-3 items-center z-10"
                >
                  <Text
                    className={`text-xs font-black uppercase ${localLang === "tl" ? "text-amber-400" : "text-gray-400"}`}
                  >
                    Filipino
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications Dual Buttons */}
            <View className="flex-row items-center px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
              <View
                style={{ backgroundColor: "#FBBF2415" }}
                className="w-10 h-10 rounded-[12px] items-center justify-center mr-4"
              >
                <Bell size={20} color="#FBBF24" />
              </View>
              <View className="flex-1 mr-4">
                <Text className="text-sm font-bold text-klowk-black dark:text-white">
                  {t("push_notifications")}
                </Text>
                <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  {t("notifications_desc")}
                </Text>
              </View>
              <View
                onLayout={(e) =>
                  setNotifToggleWidth(e.nativeEvent.layout.width)
                }
                className="w-[120px] flex-row bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-2xl relative"
              >
                <MotiView
                  animate={{
                    translateX:
                      (notifications ? 1 : 0) * ((notifToggleWidth - 8) / 2),
                  }}
                  transition={{ type: "spring", damping: 20, stiffness: 150 }}
                  style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: (notifToggleWidth - 8) / 2 || "48%",
                    backgroundColor: isDarkMode ? "#3f3f46" : "#fff",
                    borderRadius: 12,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    impact(ImpactFeedbackStyle.Light);
                    handleToggleNotifications(false);
                  }}
                  className="flex-1 py-3 items-center z-10"
                >
                  <Text
                    className={`text-[10px] font-black uppercase ${!notifications ? "text-amber-400" : "text-gray-400"}`}
                  >
                    Off
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    impact(ImpactFeedbackStyle.Light);
                    handleToggleNotifications(true);
                  }}
                  className="flex-1 py-3 items-center z-10"
                >
                  <Text
                    className={`text-[10px] font-black uppercase ${notifications ? "text-amber-400" : "text-gray-400"}`}
                  >
                    On
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Daily Reminder Row */}
          <View className="flex-row items-center px-6 py-4">
            <View
              style={{ backgroundColor: "#FBBF2415" }}
              className="w-10 h-10 rounded-[12px] items-center justify-center mr-4"
            >
              <Bell size={20} color="#FBBF24" />
            </View>
            <View className="flex-1 mr-4">
              <Text className="text-sm font-bold text-klowk-black dark:text-white">
                Daily Reminder
              </Text>
              <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                Nudge at 9:00 AM if you haven't logged yet
              </Text>
            </View>
            <View
              className="w-[80px] flex-row bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-2xl relative"
            >
              <MotiView
                animate={{ translateX: dailyReminder ? 36 : 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 150 }}
                style={{
                  position: "absolute",
                  top: 4, bottom: 4, left: 4,
                  width: 32,
                  backgroundColor: isDarkMode ? "#3f3f46" : "#fff",
                  borderRadius: 10,
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              />
              <TouchableOpacity
                onPress={() => { impact(ImpactFeedbackStyle.Light); handleToggleDailyReminder(false); }}
                className="flex-1 py-3 items-center z-10"
              >
                <Text className={`text-[10px] font-black uppercase ${!dailyReminder ? "text-amber-400" : "text-gray-400"}`}>Off</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { impact(ImpactFeedbackStyle.Light); handleToggleDailyReminder(true); }}
                className="flex-1 py-3 items-center z-10"
              >
                <Text className={`text-[10px] font-black uppercase ${dailyReminder ? "text-amber-400" : "text-gray-400"}`}>On</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Haptics Toggle */}
        <View className="mb-8">
          <View className="bg-white dark:bg-klowk-black border-y border-gray-50 dark:border-zinc-800">
            <View className="flex-row items-center px-6 py-4">
              <View
                style={{ backgroundColor: "#FBBF2415" }}
                className="w-10 h-10 rounded-[12px] items-center justify-center mr-4"
              >
                <Moon size={20} color="#FBBF24" />
              </View>
              <View className="flex-1 mr-4">
                <Text className="text-sm font-bold text-klowk-black dark:text-white">
                  Haptics
                </Text>
                <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  Vibration feedback on interactions
                </Text>
              </View>
              <View className="w-[80px] flex-row bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-2xl relative">
                <MotiView
                  animate={{ translateX: hapticsOn ? 36 : 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 150 }}
                  style={{
                    position: "absolute",
                    top: 4, bottom: 4, left: 4,
                    width: 32,
                    backgroundColor: isDarkMode ? "#3f3f46" : "#fff",
                    borderRadius: 10,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                />
                <TouchableOpacity
                  onPress={() => { setHapticsOn(false); setHapticsEnabled(false); }}
                  className="flex-1 py-3 items-center z-10"
                >
                  <Text className={`text-[10px] font-black uppercase ${!hapticsOn ? "text-amber-400" : "text-gray-400"}`}>Off</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setHapticsOn(true); setHapticsEnabled(true); }}
                  className="flex-1 py-3 items-center z-10"
                >
                  <Text className={`text-[10px] font-black uppercase ${hapticsOn ? "text-amber-400" : "text-gray-400"}`}>On</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-20">
          <View className="bg-white dark:bg-klowk-black border-y border-gray-50 dark:border-zinc-800">
            <SettingItem
              icon={Trash2}
              label={t("clear_logs")}
              destructive
              type="action"
              isDark={isDarkMode}
              t={t}
              onPress={() => {
                impact(ImpactFeedbackStyle.Heavy);
                Alert.alert(t("clear_data_title"), t("clear_data_desc"), [
                  { text: t("cancel"), style: "cancel" },
                  {
                    text: t("delete"),
                    style: "destructive",
                    onPress: () => clearAllActivities(),
                  },
                ]);
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
