import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressIndicator from "./ProgressIndicator";
import TypewriterText from "./TypewriterText";

export default function HandshakeScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { setUserName } = useOnboarding();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const handleNext = () => {
    if (!name.trim()) return;
    notification(NotificationFeedbackType.Success);
    router.push("/onboarding/test-log");
    setUserName(name.trim());
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top", "bottom"]}
    >
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={1} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 items-center justify-center py-8">
            {/* Mascot */}
            <View className="mb-12 items-center">
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: 200, height: 200 }}
                contentFit="contain"
              />
            </View>

            {/* Speech Bubble */}
            <View className="mb-8 flex-row items-center">
              <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                <TypewriterText
                  text="I'm Flow. I help you track your time, one steady step at a time. What should I call you on the trail?"
                  className="text-base font-semibold text-klowk-black dark:text-white leading-5"
                />
                <View className="absolute -right-2 top-6 w-4 h-4 bg-white dark:bg-zinc-900 border-r border-t border-gray-100 dark:border-zinc-800 rotate-45" />
              </View>
            </View>

            {/* Input */}
            <View className="w-full mb-6">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name..."
                placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                className="bg-gray-50 dark:bg-zinc-900 px-4 py-3 rounded-[16px] text-base font-semibold text-klowk-black dark:text-white border border-gray-200 dark:border-zinc-800"
                editable
              />
            </View>

            {/* Next Button */}
            <Pressable
              onPress={handleNext}
              disabled={!name.trim()}
              className={`w-full py-4 px-6 rounded-[20px] items-center justify-center mb-3 ${
                name.trim()
                  ? "bg-amber-400"
                  : "bg-gray-200 dark:bg-amber-400/30"
              }`}
            >
              <Text
                className={`text-base font-black uppercase tracking-wider ${
                  name.trim()
                    ? "text-white"
                    : "text-gray-400 dark:text-amber-400/60"
                }`}
              >
                Let's go →
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
