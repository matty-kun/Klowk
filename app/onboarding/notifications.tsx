import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Bell, CheckCircle2, ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressIndicator from "./ProgressIndicator";
import TypewriterText from "./TypewriterText";

export default function NotificationsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { completeOnboarding } = useOnboarding();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleEnableNotifications = async () => {
    impact(ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setNotificationsEnabled(true);
        notification(NotificationFeedbackType.Success);

        // Test notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Welcome to Flow! 🐌",
            body: "Your journey to peak focus starts now.",
            data: { testNotification: true },
          },
          trigger: {
            type: "timeInterval",
            seconds: 1,
            repeats: false,
            ...(Platform.OS === "android" ? { channelId: "default" } : {}),
          } as any,
        });
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    notification(NotificationFeedbackType.Success);
    router.replace("/(tabs)");
    completeOnboarding();
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top", "bottom"]}
    >
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 items-center justify-center">
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-6 z-10 p-2"
          >
            <ChevronLeft size={24} color={isDark ? "#ffffff" : "#000000"} />
          </Pressable>

          {/* Mascot */}
          <View className="mb-12 items-center">
            <Image
              source={require("../../assets/images/klowk bell.png")}
              style={{ width: 200, height: 200 }}
              contentFit="contain"
            />
          </View>

          {/* Speech Bubble */}
          <View className="mb-8 flex-row items-center">
            <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <TypewriterText
                text="I can also nudge you when you're in a flow state or if we drift off course. Want me to keep an eye on the clock?"
                className="text-base font-semibold text-klowk-black dark:text-white leading-5"
              />
              <View className="absolute -right-2 top-6 w-4 h-4 bg-white dark:bg-zinc-900 border-r border-t border-gray-100 dark:border-zinc-800 rotate-45" />
            </View>
          </View>

          {/* Notification Status */}
          {notificationsEnabled && (
            <View className="w-full mb-8 bg-green-50 dark:bg-green-950/30 p-4 rounded-[16px] border border-green-200 dark:border-green-800 flex-row items-center">
              <CheckCircle2 size={16} color="#10b981" />
              <Text className="ml-3 text-sm font-semibold text-green-700 dark:text-green-300">
                Notifications enabled!
              </Text>
            </View>
          )}

          {/* Button Group */}
          <View className="w-full gap-3">
            {!notificationsEnabled ? (
              <Pressable
                onPress={handleEnableNotifications}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-[20px] items-center justify-center bg-amber-400 flex-row"
              >
                <Bell size={20} color="white" />
                <Text className="ml-2 text-base font-black text-white uppercase tracking-wider">
                  Enable Nudges
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleFinish}
              className={`w-full py-4 px-6 rounded-[20px] items-center justify-center ${
                notificationsEnabled
                  ? "bg-amber-400"
                  : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
              }`}
            >
              <Text
                className={`text-base font-black uppercase tracking-wider ${
                  notificationsEnabled
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {notificationsEnabled ? "Let's Roll! 🐌" : "Maybe Later →"}
              </Text>
            </Pressable>
          </View>

          {/* Info Text */}
          <View className="mt-8 items-center">
            <Text className="text-center text-sm text-gray-600 dark:text-gray-400 leading-5">
              You can change notification settings anytime in preferences.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
