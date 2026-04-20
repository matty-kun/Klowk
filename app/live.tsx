import { CategoryIcon } from "@/components/CategoryIcon";
import CategoryPillScroller from "@/components/CategoryPillScroller";
import ScreenHeader from "@/components/ScreenHeader";
import TimeInputTrio from "@/components/TimeInputTrio";
import { useLanguage } from "@/context/LanguageContext";
import { Category, useTracking } from "@/context/TrackingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { useRouter } from "expo-router";
import AddGoalModal from "@/components/AddGoalModal";
import NewCategorySheet from "@/components/NewCategorySheet";
import { Check, Clock, Plus, Tag, Target, Zap } from "lucide-react-native";

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

export default function LiveSessionPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { startTracker, categories, customGoals, activities, currentActivity } =
    useTracking();
  const { t } = useLanguage();

  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [category, setCategory] = useState("work");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);

  const getGoalRemainingSecs = (goalId: string) => {
    const goal = customGoals.find((g) => g.id === goalId);
    if (!goal) return 0;
    const logged = activities
      .filter(
        (a) =>
          a.title === goal.name &&
          a.category === goal.categoryId &&
          a.duration &&
          a.start_time >= goal.startDate &&
          a.start_time <= goal.endDate,
      )
      .reduce((acc, a) => acc + (a.duration || 0), 0);
    return Math.max(0, goal.targetMins * 60 - logged);
  };

  const plannedSecs =
    (parseInt(hours) || 0) * 3600 +
    (parseInt(minutes) || 0) * 60 +
    (parseInt(seconds) || 0);
  const canStart = !!title && plannedSecs > 0 && !currentActivity && !!category;

  const handleStart = async () => {
    if (!canStart) return;
    notification(NotificationFeedbackType.Success);

    const description = `Target: ${Math.floor(plannedSecs / 60)}m ${plannedSecs % 60}s`;

    await startTracker(title, category, description, plannedSecs);
    router.replace("/tracker");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ScreenHeader title={t("live_session")} onBack={() => router.back()} />

          {/* Title Input */}
          <View className="mb-8">
            <View className="flex-row items-center mb-3">
              <Zap size={14} color="#FBBF24" />
              <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                {t("focus_target")}
              </Text>
            </View>
            <View className="bg-gray-50 dark:bg-zinc-900 rounded-[20px] border border-gray-100 dark:border-zinc-800">
              <TextInput
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (selectedGoalId) setSelectedGoalId(null);
                }}
                placeholder={t("what_working_on")}
                placeholderTextColor={isDark ? "#3f3f46" : "#9ca3af"}
                className="p-5 text-base font-bold text-klowk-black dark:text-white"
              />
            </View>
          </View>

          {/* Duration Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <Clock size={14} color="#9ca3af" />
              <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                {t("duration")}
              </Text>
            </View>
            <TimeInputTrio
              hours={hours} minutes={minutes} seconds={seconds}
              onChangeHours={setHours} onChangeMinutes={setMinutes} onChangeSeconds={setSeconds}
            />
          </View>

          {/* Goals Selection */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Target size={14} color="#FBBF24" />
                <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                  {t("active_goals")}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddGoal(true)}
                className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full"
              >
                <Plus size={11} color="#FBBF24" strokeWidth={3} />
                <Text className="text-[10px] font-black text-amber-400 uppercase tracking-wide">New</Text>
              </Pressable>
            </View>

            {customGoals.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {customGoals.map((goal) => {
                  const isSelected = selectedGoalId === goal.id;
                  const cat = categories.find((c) => c.id === goal.categoryId);

                  return (
                    <Pressable
                      key={goal.id}
                      onPress={() => {
                        const remaining = getGoalRemainingSecs(goal.id);
                        setSelectedGoalId(goal.id);
                        setTitle(goal.name);
                        setCategory(goal.categoryId);
                        setHours(Math.floor(remaining / 3600).toString());
                        setMinutes(
                          Math.floor((remaining % 3600) / 60).toString(),
                        );
                        setSeconds((remaining % 60).toString());
                        impact(ImpactFeedbackStyle.Medium);
                      }}
                      className={`mr-3 p-4 rounded-[24px] border min-w-[160px] ${isSelected ? "border-[#FBBF24] bg-amber-50 dark:bg-amber-500/10" : "bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"}`}
                    >
                      <Text
                        className={`text-sm font-black mb-1 ${isSelected ? "text-[#FBBF24]" : "text-klowk-black dark:text-white"}`}
                        numberOfLines={1}
                      >
                        {goal.name}
                      </Text>
                      <View className="flex-row items-center mb-2">
                        <CategoryIcon
                          name={cat?.iconName || "briefcase"}
                          size={10}
                          color={isSelected ? "#FBBF24" : "#9ca3af"}
                        />
                        <Text
                          className={`ml-1 text-[10px] font-bold uppercase ${isSelected ? "text-[#FBBF24]/70" : "text-gray-400"}`}
                        >
                          {cat ? t(cat.id as any) || cat.label : "General"}
                        </Text>
                      </View>
                      {(() => {
                        const rem = getGoalRemainingSecs(goal.id);
                        const remH = Math.floor(rem / 3600);
                        const remM = Math.floor((rem % 3600) / 60);
                        const label =
                          rem === 0
                            ? "Complete"
                            : remH > 0
                              ? `${remH}h ${remM}m left`
                              : `${remM}m left`;
                        return (
                          <Text
                            className={`text-[10px] font-black ${rem === 0 ? "text-green-500" : isSelected ? "text-[#FBBF24]" : "text-gray-400 dark:text-gray-500"}`}
                          >
                            {label}
                          </Text>
                        );
                      })()}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View className="bg-gray-50 dark:bg-zinc-900/50 rounded-[24px] p-5 border border-dashed border-gray-200 dark:border-zinc-800 items-center">
                <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 italic">
                  {t("no_goals_create")}
                </Text>
              </View>
            )}
          </View>

          {/* Category Selection */}
          <View className="mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Tag size={14} color="#9ca3af" />
                <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                  {t("category_label")}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowNewCat(true)}
                className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full"
              >
                <Plus size={11} color="#FBBF24" strokeWidth={3} />
                <Text className="text-[10px] font-black text-amber-400 uppercase tracking-wide">New</Text>
              </Pressable>
            </View>
            <CategoryPillScroller
              categories={categories}
              selectedId={category}
              onSelect={setCategory}
              layout="wrap"
            />
          </View>
        </ScrollView>

        {/* Start Button */}
        <View className="p-6 border-t border-gray-50 dark:border-zinc-900 bg-white dark:bg-klowk-black">
          <Pressable
            onPress={handleStart}
            disabled={!canStart}
            className={`py-5 rounded-[24px] flex-row items-center justify-center shadow-lg ${!canStart ? "bg-gray-100 dark:bg-zinc-900" : "bg-klowk-black dark:bg-white"}`}
          >
            <Check
              size={20}
              color={!canStart ? "#9ca3af" : isDark ? "#121212" : "#fff"}
              className="mr-3"
            />
            <Text
              className={`font-black uppercase tracking-wider ${!canStart ? "text-gray-400" : isDark ? "text-klowk-black" : "text-white"}`}
            >
              {t("launch_focus")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <AddGoalModal visible={showAddGoal} onClose={() => setShowAddGoal(false)} />
      <NewCategorySheet visible={showNewCat} onClose={() => setShowNewCat(false)} onCreated={setCategory} />
    </SafeAreaView>
  );
}
