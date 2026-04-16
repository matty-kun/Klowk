import { router } from "expo-router";
import {
    ArrowLeft,
    Brain,
    Database,
    MessageCircle,
    Shield,
    Target,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const examples = [
  "Worked 2h on coding",
  "How much did I focus today?",
  "How much did I study yesterday?",
  "How much time did I spend this week?",
  "Am I on track with my goals this week?",
  "Do you keep my data local?",
];

export default function ChatHelpScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top"]}
    >
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900"
        >
          <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
        </Pressable>
        <Text className="text-lg font-black text-klowk-black dark:text-white">
          Chat Guide
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-gray-50 dark:bg-zinc-900 rounded-[28px] p-5 border border-gray-100 dark:border-zinc-800 mb-5">
          <View className="flex-row items-center mb-2">
            <Brain size={18} color="#FBBF24" />
            <Text className="ml-2 text-base font-black text-klowk-black dark:text-white">
              What Flow Chat Can Do
            </Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">
            Flow helps you with logging, history questions, and goal progress
            forecasting using your activity records.
          </Text>
        </View>

        <View className="bg-gray-50 dark:bg-zinc-900 rounded-[28px] p-5 border border-gray-100 dark:border-zinc-800 mb-5">
          <View className="flex-row items-center mb-2">
            <MessageCircle size={18} color="#FBBF24" />
            <Text className="ml-2 text-base font-black text-klowk-black dark:text-white">
              1) Logging
            </Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">
            Type natural messages like "Worked 2h on coding" and Flow will
            understand it as a time-log intent.
          </Text>
        </View>

        <View className="bg-gray-50 dark:bg-zinc-900 rounded-[28px] p-5 border border-gray-100 dark:border-zinc-800 mb-5">
          <View className="flex-row items-center mb-2">
            <Database size={18} color="#FBBF24" />
            <Text className="ml-2 text-base font-black text-klowk-black dark:text-white">
              2) History Queries
            </Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">
            Ask questions about your tracked history by period, like today,
            yesterday, this week, or this month.
          </Text>
        </View>

        <View className="bg-gray-50 dark:bg-zinc-900 rounded-[28px] p-5 border border-gray-100 dark:border-zinc-800 mb-5">
          <View className="flex-row items-center mb-2">
            <Target size={18} color="#FBBF24" />
            <Text className="ml-2 text-base font-black text-klowk-black dark:text-white">
              3) Goal Forecasting
            </Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">
            Ask if you are on track. Flow compares your recent pace with active
            goals and tells you if you are ahead or behind.
          </Text>
        </View>

        <View className="bg-gray-50 dark:bg-zinc-900 rounded-[28px] p-5 border border-gray-100 dark:border-zinc-800 mb-5">
          <View className="flex-row items-center mb-2">
            <Shield size={18} color="#FBBF24" />
            <Text className="ml-2 text-base font-black text-klowk-black dark:text-white">
              Privacy
            </Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">
            Flow chat analysis is designed to run locally for these core
            features.
          </Text>
        </View>

        <View className="mb-10">
          <Text className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Prompt Examples
          </Text>
          {examples.map((example) => (
            <View
              key={example}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl px-4 py-3 mb-2"
            >
              <Text className="text-sm font-semibold text-klowk-black dark:text-white">
                {example}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
