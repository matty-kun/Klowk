import { CategoryIcon } from "@/components/CategoryIcon";
import LogCard from "@/components/LogCard";
import ProgressBar from "@/components/ProgressBar";
import ToggleBar from "@/components/ToggleBar";
import LogActionSheet from "@/components/LogActionSheet";
import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { Activity, Category, useTracking } from "@/context/TrackingContext";
import { getForecast } from "@/utils/forecast";
import { computeStreak } from "@/utils/streak";
import { impact } from "@/utils/haptics";
import {
    formatDate,
    formatDuration,
    formatLogDuration,
    formatTimestamp,
} from "@/utils/time";
import { useNavigation } from "@react-navigation/native";
import { ImpactFeedbackStyle } from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
    ArrowDown,
    ArrowUp,
    ChevronRight,
    ClipboardEdit,
    Flame,
    History,
    MessageCircle,
    MoreHorizontal,
    Settings2,
    Target,
    Timer,
} from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React, { useCallback, useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default React.memo(function TabOneScreen() {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const {
    activities,
    deleteActivity,
    duplicateActivity,
    categories,
    customGoals,
  } = useTracking();
  const { resetOnboarding, userName } = useOnboarding();
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(
    null,
  );
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "today",
  );
  const now = new Date();

  const getPeriodTotal = useCallback((
    range: "today" | "week" | "month",
    offset: number = 0,
  ) => {
    const ref = new Date(now);
    const startOfRange = new Date(ref);
    const endOfRange = new Date(ref);

    if (range === "today") {
      startOfRange.setDate(ref.getDate() + offset);
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange.setDate(ref.getDate() + offset);
      endOfRange.setHours(23, 59, 59, 999);
    } else if (range === "week") {
      const day = ref.getDay();
      startOfRange.setDate(ref.getDate() - day + offset * 7);
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange.setDate(startOfRange.getDate() + 6);
      endOfRange.setHours(23, 59, 59, 999);
    } else if (range === "month") {
      startOfRange.setMonth(ref.getMonth() + offset, 1);
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange.setMonth(ref.getMonth() + offset + 1, 0);
      endOfRange.setHours(23, 59, 59, 999);
    }

    return activities
      .filter((a: Activity) => {
        const t = new Date(a.start_time).getTime();
        return t >= startOfRange.getTime() && t <= endOfRange.getTime();
      })
      .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
  }, [activities]);

  const rangeMinsTotal = React.useMemo(
    () => getPeriodTotal(timeRange, 0),
    [timeRange, activities],
  );
  const prevRangeMinsTotal = React.useMemo(
    () => getPeriodTotal(timeRange, -1),
    [timeRange, activities],
  );
  const trendUp = rangeMinsTotal > prevRangeMinsTotal;
  const isNeutral = rangeMinsTotal === prevRangeMinsTotal;
  const trendColor = isNeutral ? "#121212" : trendUp ? "#10b981" : "#ef4444";

  const todayMinsTotal = React.useMemo(
    () =>
      activities
        .filter(
          (a: Activity) =>
            new Date(a.start_time).toDateString() === now.toDateString(),
        )
        .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0),
    [activities],
  );

  const dailyChartData = React.useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay() + i);
        const dayStr = d.toDateString();
        const isToday = dayStr === now.toDateString();
        const label = d.toLocaleDateString("en-US", { weekday: "narrow" });
        const mins = activities
          .filter(
            (a: Activity) => new Date(a.start_time).toDateString() === dayStr,
          )
          .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
        return { mins, label, isToday };
      }),
    [activities],
  );

  const { dayOfWeek, dayOfMonth, greetingKey } = React.useMemo(() => {
    const d = new Date();
    const w = d.toLocaleDateString(undefined, { weekday: "long" });
    const m = d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
    });
    let gk = "good_evening";
    if (d.getHours() < 12) gk = "good_morning";
    else if (d.getHours() < 17) gk = "good_afternoon";
    return { dayOfWeek: w, dayOfMonth: m, greetingKey: gk };
  }, [activities]);

  const maxWeeklyMins = React.useMemo(
    () => Math.max(...dailyChartData.map((d) => d.mins), 1),
    [dailyChartData],
  );

  const categoryStats = React.useMemo(() => {
    const total = activities.reduce(
      (sum: number, a: Activity) => sum + (a.duration || 0),
      0,
    );
    return categories
      .map((cat: Category) => {
        const logs = activities.filter((a: Activity) => a.category === cat.id);
        const totalMins = logs.reduce(
          (sum: number, a: Activity) => sum + (a.duration || 0),
          0,
        );
        return {
          ...cat,
          totalMins,
          sessionCount: logs.length,
          totalAll: total,
        };
      })
      .filter((c: any) => c.totalMins > 0)
      .sort((a: any, b: any) => b.totalMins - a.totalMins);
  }, [activities, categories]);

  const activeGoalsCount = customGoals
    ? customGoals.filter((g) => g.endDate >= Date.now()).length
    : 0;
  const klowkForecast = React.useMemo(
    () => getForecast({ activities, goals: customGoals || [], range: "week" }),
    [activities, customGoals],
  );

  const streak = React.useMemo(() => computeStreak(activities), [activities]);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: -20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 700 }}
          className="px-6 py-2 mb-2 flex-row justify-end items-center"
        >
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={async () => {
                impact(ImpactFeedbackStyle.Medium);
                await resetOnboarding();
                router.replace("/onboarding/handshake");
              }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full mr-2"
            >
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-300">
                ↺
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                impact(ImpactFeedbackStyle.Medium);
                router.push("/history");
              }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full mr-2"
            >
              <History
                size={20}
                color={colorScheme === "dark" ? "#fff" : "#121212"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                impact(ImpactFeedbackStyle.Medium);
                navigation.navigate("settings");
              }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full"
            >
              <Settings2
                size={20}
                color={colorScheme === "dark" ? "#fff" : "#121212"}
              />
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Greeting Section */}
        <View className="px-6 mb-8 mt-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-[1.5px]">
              {dayOfWeek}, {dayOfMonth}
            </Text>
            {streak > 0 && (
              <View className="flex-row items-center bg-amber-400 rounded-full px-2 py-1 gap-1">
                <Flame size={10} color="#fff" fill="#fff" />
                <Text className="text-white font-black text-[10px]">{streak}d</Text>
              </View>
            )}
          </View>
          <Text className="text-[26px] font-black text-klowk-black dark:text-white mb-10">
            {t(greetingKey as any)}{" "}
            <Text className="text-amber-400">{userName || "User"}!</Text>
          </Text>

          <View className="relative items-center justify-center -mt-12">
            <View
              className="absolute -left-6 -right-6 h-[56px] bg-klowk-orange"
              style={{ top: "52%" }}
            />
            <View className="flex-row items-center justify-between mt-9">
              <View className="w-40 h-40 items-center justify-center -mt-10">
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={{
                    width: 175,
                    height: 175,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                  }}
                  contentFit="contain"
                />
              </View>
              <View className="relative bg-white dark:bg-zinc-900 p-4 rounded-[32px] shadow-sm w-[55%] border border-gray-50 dark:border-zinc-800 -mt-6 ml-2">
                <View className="absolute -left-2 top-6 w-4 h-4 bg-white dark:bg-zinc-900 border-l border-b border-gray-50 dark:border-zinc-800 rotate-[45deg]" />
                <Text className="text-xs text-klowk-black dark:text-white font-semibold leading-5">
                  {klowkForecast.status === "no_goal"
                    ? todayMinsTotal > 0
                      ? t("focus_win").replace(
                          "{time}",
                          formatDuration(Math.floor(todayMinsTotal / 60)),
                        )
                      : t("focus_ready")
                    : klowkForecast.message}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions — shown until second log to encourage new users */}
        {activities.length <= 1 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 300 }}
            style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}
          >
            {/* Action buttons */}
            <Pressable
              onPress={() => {
                impact(ImpactFeedbackStyle.Medium);
                router.push("/live");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FBBF24",
                borderRadius: 28,
                padding: 20,
                marginBottom: 12,
                shadowColor: "#FBBF24",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Timer size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}
                >
                  {t("start_live_session")}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 2,
                  }}
                >
                  Track your focus in real time
                </Text>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>

            <Pressable
              onPress={() => {
                impact(ImpactFeedbackStyle.Light);
                router.push("/modal");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f9fafb",
                borderRadius: 28,
                padding: 20,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colorScheme === "dark" ? "#27272a" : "#f3f4f6",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor:
                    colorScheme === "dark" ? "#27272a" : "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <ClipboardEdit
                  size={22}
                  color={colorScheme === "dark" ? "#a1a1aa" : "#6b7280"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: colorScheme === "dark" ? "#fff" : "#121212",
                  }}
                >
                  {t("log_manually")}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colorScheme === "dark" ? "#71717a" : "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  Add a session you already did
                </Text>
              </View>
              <ChevronRight
                size={20}
                color={colorScheme === "dark" ? "#3f3f46" : "#e5e7eb"}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                impact(ImpactFeedbackStyle.Light);
                router.push("/chat");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colorScheme === "dark" ? "#0f1a2e" : "#eff6ff",
                borderRadius: 28,
                padding: 20,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colorScheme === "dark" ? "#1e3a5f" : "#dbeafe",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor:
                    colorScheme === "dark" ? "#1e3a5f" : "#dbeafe",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <MessageCircle size={22} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: colorScheme === "dark" ? "#fff" : "#121212",
                  }}
                >
                  Chat with Flow
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colorScheme === "dark" ? "#71717a" : "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  Ask anything about your focus
                </Text>
              </View>
              <ChevronRight
                size={20}
                color={colorScheme === "dark" ? "#3f3f46" : "#e5e7eb"}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                impact(ImpactFeedbackStyle.Light);
                navigation.navigate("goals");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colorScheme === "dark" ? "#0f2e2b" : "#f0fdfa",
                borderRadius: 28,
                padding: 20,
                borderWidth: 1,
                borderColor: colorScheme === "dark" ? "#134e4a" : "#ccfbf1",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor:
                    colorScheme === "dark" ? "#134e4a" : "#ccfbf1",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Target size={22} color="#14b8a6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: colorScheme === "dark" ? "#fff" : "#121212",
                  }}
                >
                  {t("goals")}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colorScheme === "dark" ? "#71717a" : "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  Set targets and track progress
                </Text>
              </View>
              <ChevronRight
                size={20}
                color={colorScheme === "dark" ? "#3f3f46" : "#e5e7eb"}
              />
            </Pressable>
          </MotiView>
        )}

        {/* Analytics + Bento + Logs — only shown when there is data */}
        {activities.length > 0 && (
          <>
            <View className="px-6 flex-row justify-between mb-8">
              {/* Intensity Card */}
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: "spring", delay: 400 }}
                className="w-[48.5%] bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-gray-50 dark:border-zinc-800 shadow-sm"
              >
                <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">
                  {t("intensity")}
                </Text>
                <View className="flex-row items-end justify-between h-16">
                  {dailyChartData.map((item, i) => {
                    const intensity = item.mins / maxWeeklyMins || 0;
                    const barHeight = Math.max(4, intensity * 40);
                    return (
                      <View
                        key={i}
                        className="w-[12%] items-center justify-end h-full"
                      >
                        <MotiView
                          from={{ height: 0 }}
                          animate={{ height: barHeight }}
                          transition={{ type: "spring", delay: 600 + i * 50 }}
                          style={{
                            width: 10,
                            borderRadius: 5,
                            backgroundColor: item.isToday
                              ? "#FBBF24"
                              : intensity > 0.05
                                ? `rgba(255, 90, 0, ${0.15 + intensity * 0.7})`
                                : colorScheme === "dark"
                                  ? "#27272a"
                                  : "#f3f4f6",
                          }}
                        />
                        <Text
                          className={`mt-2 text-[7px] font-black uppercase ${item.isToday ? "text-amber-400" : "text-gray-400 dark:text-zinc-600"}`}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </MotiView>

              {/* Summary Card */}
              <MotiView
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: "spring", delay: 400 }}
                className="w-[48.5%] bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-gray-50 dark:border-zinc-800 shadow-sm justify-between"
              >
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {t(
                        timeRange === "today"
                          ? "today"
                          : timeRange === "week"
                            ? "this_week"
                            : "this_month",
                      )}
                    </Text>
                    {trendUp ? (
                      <ArrowUp size={12} color="#10b981" strokeWidth={3} />
                    ) : (
                      <ArrowDown size={12} color="#ef4444" strokeWidth={3} />
                    )}
                  </View>
                  <View className="flex-row items-baseline">
                    <Text
                      style={{ color: trendColor }}
                      className="text-[34px] font-black"
                    >
                      {(rangeMinsTotal / 3600).toFixed(1)}
                    </Text>
                    <Text className="text-[10px] font-black text-gray-300 dark:text-zinc-600 ml-1">
                      {t("hrs")}
                    </Text>
                  </View>
                </View>

                {/* THE TOGGLE */}
                <ToggleBar value={timeRange} onChange={setTimeRange} style={{ width: "100%" }} />
              </MotiView>
            </View>

            {/* Categories Card */}
            {categoryStats.length > 0 &&
              (() => {
                const isDark = colorScheme === "dark";
                const cardBg = isDark ? "#1e1208" : "#FFF3EC";
                return (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", delay: 600 }}
                    style={{
                      paddingHorizontal: 24,
                      marginBottom: 28,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Pressable
                      onPress={() => router.push("/categories")}
                      style={{
                        width: "48.5%",
                        backgroundColor: cardBg,
                        borderRadius: 32,
                        padding: 20,
                      }}
                    >
                      {/* Header row: icon + label + chevron */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 14,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <View
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 9,
                              backgroundColor: isDark ? "#2d1f0e" : "#FFE4D0",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CategoryIcon
                              name="layers"
                              size={13}
                              color="#FBBF24"
                            />
                          </View>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "800",
                              color: isDark ? "#fff" : "#1a1a1a",
                            }}
                          >
                            {t("categories")}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#FBBF24",
                            fontWeight: "700",
                          }}
                        >
                          ›
                        </Text>
                      </View>

                      {/* Count — small */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "baseline",
                          marginBottom: 14,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "900",
                            color: isDark ? "#fff" : "#1a1a1a",
                          }}
                        >
                          {categoryStats.length}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: isDark ? "#71717a" : "#9ca3af",
                            marginLeft: 4,
                          }}
                        >
                          {categoryStats.length === 1
                            ? "category"
                            : "categories"}
                        </Text>
                      </View>

                      {/* Top 3 list */}
                      {categoryStats.slice(0, 3).map((stat: any, i: number) => {
                        const totalSecs = stat.totalMins; // named misleadingly — it's actually seconds
                        const hrs = Math.floor(totalSecs / 3600);
                        const mins = Math.floor((totalSecs % 3600) / 60);
                        const timeStr =
                          hrs > 0
                            ? `${hrs}h ${mins > 0 ? mins + "m" : ""}`.trim()
                            : `${mins}m`;
                        return (
                          <View
                            key={stat.id}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 7,
                              borderTopWidth: i === 0 ? 0 : 1,
                              borderTopColor: isDark ? "#2d2008" : "#FFE4D0",
                            }}
                          >
                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 7,
                                backgroundColor: `${stat.color}22`,
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 8,
                              }}
                            >
                              <CategoryIcon
                                name={stat.iconName}
                                size={11}
                                color={stat.color}
                              />
                            </View>
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 11,
                                fontWeight: "700",
                                color: isDark ? "#d4d4d8" : "#374151",
                              }}
                              numberOfLines={1}
                            >
                              {t(stat.id as any) || stat.label}
                            </Text>
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "800",
                                color: isDark ? "#fff" : "#1a1a1a",
                              }}
                            >
                              {timeStr}
                            </Text>
                          </View>
                        );
                      })}
                    </Pressable>

                    {/* Goals Card */}
                    <Pressable
                      onPress={() => router.push("/goals")}
                      style={{
                        width: "48.5%",
                        backgroundColor: isDark ? "#0f2e2b" : "#f0fdfa",
                        borderRadius: 32,
                        padding: 20,
                      }}
                    >
                      {/* Header row: icon + label + chevron */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 14,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <View
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 9,
                              backgroundColor: isDark ? "#134e4a" : "#ccfbf1",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Target size={13} color="#14b8a6" />
                          </View>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "800",
                              color: isDark ? "#fff" : "#1a1a1a",
                            }}
                          >
                            {t("goals")}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#14b8a6",
                            fontWeight: "700",
                          }}
                        >
                          ›
                        </Text>
                      </View>

                      {/* Count */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "baseline",
                          marginBottom: 14,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "900",
                            color: isDark ? "#fff" : "#1a1a1a",
                          }}
                        >
                          {activeGoalsCount}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: isDark ? "#71717a" : "#9ca3af",
                            marginLeft: 4,
                          }}
                        >
                          {activeGoalsCount === 1
                            ? t("goal")
                            : t("goals_plural")}
                        </Text>
                      </View>

                      {/* Top 3 goals */}
                      {customGoals
                        ?.filter((g) => g.endDate >= Date.now())
                        .slice(0, 3)
                        .map((goal, i) => {
                          const loggedSecs = activities
                            .filter(
                              (a) =>
                                a.title === goal.name &&
                                a.category === goal.categoryId &&
                                a.start_time >= goal.startDate &&
                                a.start_time <= goal.endDate,
                            )
                            .reduce((sum, a) => sum + (a.duration || 0), 0);
                          const loggedMins = Math.floor(loggedSecs / 60);
                          const progress = Math.min(
                            1,
                            loggedMins / goal.targetMins,
                          );
                          const isComplete = loggedMins >= goal.targetMins;

                          const fmtTime = (mins: number) => {
                            if (mins >= 60)
                              return `${(mins / 60).toFixed(1).replace(".0", "")}h`;
                            return `${mins}m`;
                          };

                          return (
                            <View
                              key={goal.id}
                              style={{
                                paddingVertical: 7,
                                borderTopWidth: i === 0 ? 0 : 1,
                                borderTopColor: isDark ? "#134e4a" : "#ccfbf1",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: "800",
                                  color: isDark ? "#fff" : "#1a1a1a",
                                  marginBottom: 4,
                                }}
                                numberOfLines={1}
                              >
                                {goal.name}
                              </Text>
                              {/* Progress bar */}
                              <ProgressBar
                                progress={progress}
                                color={isComplete ? "#22c55e" : "#14b8a6"}
                                trackColor={isDark ? "#134e4a" : "#ccfbf1"}
                                height={4}
                                className="mb-1"
                              />
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 9,
                                    fontWeight: "700",
                                    color: isComplete
                                      ? "#22c55e"
                                      : isDark
                                        ? "#a1a1aa"
                                        : "#14b8a6",
                                  }}
                                >
                                  {isComplete
                                    ? "Complete!"
                                    : `${fmtTime(loggedMins)} of ${fmtTime(goal.targetMins)}`}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 9,
                                    fontWeight: "700",
                                    color: isDark ? "#71717a" : "#9ca3af",
                                  }}
                                >
                                  {Math.max(
                                    0,
                                    Math.ceil(
                                      (goal.endDate - Date.now()) /
                                        (1000 * 60 * 60 * 24),
                                    ),
                                  )}
                                  d left
                                </Text>
                              </View>
                            </View>
                          );
                        })}

                      {activeGoalsCount === 0 && (
                        <View style={{ marginTop: "auto" }}>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: isDark ? "#71717a" : "#9ca3af",
                              lineHeight: 16,
                            }}
                          >
                            No active goals right now. Let's set some!
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </MotiView>
                );
              })()}

            {/* Logs List */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", delay: 800 }}
              style={{ paddingHorizontal: 24, marginBottom: 16 }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "900",
                  color: "#FBBF24",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {t("logs")}
              </Text>
            </MotiView>

            <View className="px-6 mb-28">
              {activities.slice(0, 5).map((log: Activity) => {
                const cat = categories.find((c) => c.id === log.category);
                return (
                  <LogCard
                    key={log.id}
                    log={log}
                    categoryColor={cat?.color || "#6b7280"}
                    categoryLabel={cat?.label || t("personal")}
                    categoryIconName={cat?.iconName || "tag"}
                    onPressMore={() => setSelectedActionLogId(log.id)}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <LogActionSheet
        visible={selectedActionLogId !== null}
        onClose={() => setSelectedActionLogId(null)}
        onEdit={() => {
          if (selectedActionLogId) {
            router.push({
              pathname: "/modal",
              params: { editId: selectedActionLogId },
            });
            setSelectedActionLogId(null);
          }
        }}
        onDuplicate={() =>
          selectedActionLogId && duplicateActivity(selectedActionLogId)
        }
        onDelete={() =>
          selectedActionLogId && deleteActivity(selectedActionLogId)
        }
      />
    </SafeAreaView>
  );
});
