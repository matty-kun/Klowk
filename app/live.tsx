import { CategoryIcon } from "@/components/CategoryIcon";
import CategoryPillScroller from "@/components/CategoryPillScroller";
import ScreenHeader from "@/components/ScreenHeader";
import { useLanguage } from "@/context/LanguageContext";
import { useTracking } from "@/context/TrackingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { useRouter } from "expo-router";
import AddGoalModal from "@/components/AddGoalModal";
import NewCategorySheet from "@/components/NewCategorySheet";
import {
  Check,
  Clock,
  Plus,
  Tag,
  Target,
  Timer,
  Zap,
} from "lucide-react-native";
import { DEFAULT_POMODORO_SETTINGS, PomodoroSettings } from "@/utils/pomodoro";

import WheelPicker from "@/components/WheelPicker";
import { useColorScheme } from "nativewind";
import React, { useRef, useState } from "react";
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
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [category, setCategory] = useState("work");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);

  // Pomodoro mode state
  const [mode, setMode] = useState<"free" | "pomodoro">("free");
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const parentScrollRef = useRef<ScrollView>(null);

  const updatePomodoro = (patch: Partial<PomodoroSettings>) => {
    setPomodoroSettings((prev) => ({ ...prev, ...patch }));
  };

  const getGoalRemainingSecs = (goalId: string) => {
    const goal = customGoals.find((g) => g.id === goalId);
    if (!goal) return 0;
    const logged = activities
      .filter(
        (a) =>
          (a.title === goal.name || (a.title.startsWith(goal.name + " —") && !a.title.endsWith(" — Short Break") && !a.title.endsWith(" — Long Break"))) &&
          a.category === goal.categoryId &&
          a.duration &&
          a.start_time >= goal.startDate &&
          a.start_time <= goal.endDate,
      )
      .reduce((acc, a) => acc + (a.duration || 0), 0);
    return Math.max(0, goal.targetMins * 60 - logged);
  };

  const plannedSecs = hours * 3600 + minutes * 60 + seconds;

  const canStart =
    !!title &&
    !!category &&
    !currentActivity &&
    (mode === "pomodoro" || plannedSecs > 0);

  const handleStart = async () => {
    if (!canStart) return;
    notification(NotificationFeedbackType.Success);

    if (mode === "pomodoro") {
      const workSecs = pomodoroSettings.workMins * 60;
      router.replace({
        pathname: "/tracker",
        params: {
          pomodoro: "true",
          workSecs: String(workSecs),
          shortBreakSecs: String(pomodoroSettings.shortBreakMins * 60),
          longBreakSecs: String(pomodoroSettings.longBreakMins * 60),
          rounds: String(pomodoroSettings.rounds),
          baseTitle: title,
          category,
          targetSecs: String(workSecs),
        },
      });
      startTracker(`${title} — Round 1`, category, "Pomodoro", workSecs);
    } else {
      const description = `Target: ${Math.floor(plannedSecs / 60)}m ${plannedSecs % 60}s`;
      router.replace({ pathname: "/tracker", params: { targetSecs: String(plannedSecs) } });
      startTracker(title, category, description, plannedSecs);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          ref={parentScrollRef}
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ScreenHeader title={t("live_session")} onBack={() => router.back()} />

          {/* Mode Selector */}
          <View className="mb-8">
            <View
              style={{
                flexDirection: "row",
                backgroundColor: isDark ? "#1c1c1e" : "#f3f4f6",
                borderRadius: 16,
                padding: 4,
              }}
            >
              {(["free", "pomodoro"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { impact(ImpactFeedbackStyle.Light); setMode(m); }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor:
                      mode === m
                        ? m === "pomodoro"
                          ? "#FBBF24"
                          : isDark ? "#2d2d2d" : "#fff"
                        : "transparent",
                  }}
                >
                  {m === "pomodoro" && (
                    <Timer size={14} color={mode === "pomodoro" ? "#121212" : isDark ? "#71717a" : "#9ca3af"} />
                  )}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color:
                        mode === m
                          ? m === "pomodoro"
                            ? "#121212"
                            : isDark ? "#fff" : "#121212"
                          : isDark ? "#71717a" : "#9ca3af",
                    }}
                  >
                    {m === "free" ? t("free_mode") : t("pomodoro_mode")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

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

          {/* Duration Section — hidden in Pomodoro mode */}
          <View className="mb-8" style={{ display: mode === "free" ? "flex" : "none" }}>
            <View className="flex-row items-center mb-4">
              <Clock size={14} color="#9ca3af" />
              <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                {t("duration")}
              </Text>
            </View>
            <View
              onTouchStart={() => (parentScrollRef.current as any)?.setNativeProps?.({ scrollEnabled: false })}
              onTouchEnd={() => (parentScrollRef.current as any)?.setNativeProps?.({ scrollEnabled: true })}
              onTouchCancel={() => (parentScrollRef.current as any)?.setNativeProps?.({ scrollEnabled: true })}
              style={{
                backgroundColor: isDark ? "#1c1c1e" : "#f9fafb",
                borderRadius: 20,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderWidth: 1,
                borderColor: isDark ? "#27272a" : "#f3f4f6",
                flexDirection: "row",
              }}
            >
              {([
                {
                  label: "hrs",
                  values: Array.from({ length: 24 }, (_, i) => `${i}`),
                  selectedIndex: hours,
                  onChange: (i: number) => setHours(i),
                },
                {
                  label: "min",
                  values: Array.from({ length: 60 }, (_, i) => `${i}`),
                  selectedIndex: minutes,
                  onChange: (i: number) => setMinutes(i),
                },
                {
                  label: "sec",
                  values: Array.from({ length: 60 }, (_, i) => `${i}`),
                  selectedIndex: seconds,
                  onChange: (i: number) => setSeconds(i),
                },
              ] as const).map((col) => (
                <View key={col.label} style={{ flex: 1, alignItems: "center" }}>
                  <WheelPicker
                    values={col.values as unknown as string[]}
                    selectedIndex={col.selectedIndex}
                    onChange={col.onChange}
                    itemHeight={32}
                  />
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "700",
                      color: isDark ? "#71717a" : "#9ca3af",
                      marginTop: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {col.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pomodoro Config — shown in Pomodoro mode */}
          {mode === "pomodoro" && (
            <View style={{ marginBottom: 32 }}>
              <View className="flex-row items-center mb-4">
                <Timer size={14} color="#FBBF24" />
                <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                  {t("pomodoro_settings")}
                </Text>
              </View>
              <View
                onTouchStart={() => (parentScrollRef.current as any)?.setNativeProps?.({ scrollEnabled: false })}
                onTouchEnd={() => (parentScrollRef.current as any)?.setNativeProps?.({ scrollEnabled: true })}
                onTouchCancel={() => (parentScrollRef.current as any)?.setNativeProps?.({ scrollEnabled: true })}
                style={{
                  backgroundColor: isDark ? "#1c1c1e" : "#f9fafb",
                  borderRadius: 20,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderWidth: 1,
                  borderColor: isDark ? "#27272a" : "#f3f4f6",
                  flexDirection: "row",
                }}
              >
                {([
                  {
                    label: t("work_duration"),
                    values: Array.from({ length: 90 }, (_, i) => {
                      const mins = i + 1;
                      if (mins < 60) return `${mins}m`;
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      return m === 0 ? `${h}h` : `${h}h ${m}m`;
                    }),
                    selectedIndex: pomodoroSettings.workMins - 1,
                    onChange: (i: number) => updatePomodoro({ workMins: i + 1 }),
                  },
                  {
                    label: t("short_break"),
                    values: Array.from({ length: 30 }, (_, i) => `${i + 1}m`),
                    selectedIndex: pomodoroSettings.shortBreakMins - 1,
                    onChange: (i: number) => updatePomodoro({ shortBreakMins: i + 1 }),
                  },
                  {
                    label: t("rounds_label"),
                    values: Array.from({ length: 19 }, (_, i) => `${i + 2}`),
                    selectedIndex: Math.max(0, pomodoroSettings.rounds - 2),
                    onChange: (i: number) => updatePomodoro({ rounds: i + 2 }),
                  },
                ] as const).map((col) => (
                  <View key={col.label} style={{ flex: 1, alignItems: "center" }}>
                    <WheelPicker
                      values={col.values as unknown as string[]}
                      selectedIndex={col.selectedIndex}
                      onChange={col.onChange}
                    />
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "700",
                        color: isDark ? "#71717a" : "#9ca3af",
                        marginTop: 6,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        textAlign: "center",
                      }}
                    >
                      {col.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Goals Selection */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Target size={14} color="#9ca3af" />
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

            {customGoals.filter((g) => getGoalRemainingSecs(g.id) > 0).length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {customGoals.filter((g) => getGoalRemainingSecs(g.id) > 0).map((goal) => {
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
                        if (mode === "free") {
                          setHours(Math.floor(remaining / 3600));
                          setMinutes(Math.floor((remaining % 3600) / 60));
                          setSeconds(remaining % 60);
                        }
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
