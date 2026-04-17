import CategoryPillScroller from "@/components/CategoryPillScroller";
import { computeStreak } from "@/utils/streak";
import DatePickerModal from "@/components/DatePickerModal";
import EmptyState from "@/components/EmptyState";
import GoalCard from "@/components/GoalCard";
import SectionHeader from "@/components/SectionHeader";
import LogActionSheet from "@/components/LogActionSheet";
import { useLanguage } from "@/context/LanguageContext";
import {
  Activity,
  Category,
  CustomGoal,
  useTracking,
} from "@/context/TrackingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import {
  Calendar as CalendarIcon,
  Clock,
  Flame,
  Plus,
  Target,
  X
} from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function GoalsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    activities,
    categories,
    customGoals,
    addCustomGoal,
    editCustomGoal,
    deleteCustomGoal,
  } = useTracking();
  const { t } = useLanguage();

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [goalName, setGoalName] = useState("");
  const [targetHrs, setTargetHrs] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>("");

  const [startDate, setStartDate] = useState(new Date());

  const initialEndDate = new Date();
  initialEndDate.setDate(initialEndDate.getDate() + 7);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Calendar State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateType, setActiveDateType] = useState<"start" | "end" | null>(
    null,
  );
  // Action Sheet State
  const [selectedActionGoalId, setSelectedActionGoalId] = useState<
    string | null
  >(null);

  const sheetSlide = useRef(new Animated.Value(800)).current;
  const sheetBackdrop = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        Animated.timing(keyboardOffset, {
          toValue: e.endCoordinates.height,
          duration: Platform.OS === "ios" ? e.duration : 200,
          useNativeDriver: false,
        }).start();
      }
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: Platform.OS === "ios" ? e.duration : 200,
          useNativeDriver: false,
        }).start();
      }
    );
    return () => { show.remove(); hide.remove(); };
  }, [keyboardOffset]);

  // Auto-select first category if available
  useEffect(() => {
    if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories, selectedCatId]);

  // Helpers
  const formatHrs = (mins: number) => (mins / 60).toFixed(1).replace(".0", "");

  const openSheet = (existingGoal?: CustomGoal) => {
    if (existingGoal) {
      setEditId(existingGoal.id);
      setGoalName(existingGoal.name);
      setTargetHrs((existingGoal.targetMins / 60).toString());
      setSelectedCatId(existingGoal.categoryId);
      setStartDate(new Date(existingGoal.startDate));
      setEndDate(new Date(existingGoal.endDate));
    } else {
      setEditId(null);
      setGoalName("");
      setTargetHrs("");
      setStartDate(new Date());
      const endD = new Date();
      endD.setDate(endD.getDate() + 7);
      setEndDate(endD);
    }

    setShowAddModal(true);
    Animated.parallel([
      Animated.timing(sheetBackdrop, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(sheetSlide, {
        toValue: 0,
        tension: 40,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetBackdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetSlide, {
        toValue: 800,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAddModal(false);
    });
  };

  const handleSaveGoal = () => {
    const hrs = parseFloat(targetHrs);
    if (!goalName.trim() || isNaN(hrs) || hrs <= 0 || !selectedCatId) return;

    // ensure end time is end of day
    const fixedEnd = new Date(endDate);
    fixedEnd.setHours(23, 59, 59, 999);

    if (editId) {
      editCustomGoal({
        id: editId,
        name: goalName.trim(),
        targetMins: Math.round(hrs * 60),
        categoryId: selectedCatId,
        startDate: startDate.getTime(),
        endDate: fixedEnd.getTime(),
      });
    } else {
      addCustomGoal({
        id: Date.now().toString(),
        name: goalName.trim(),
        targetMins: Math.round(hrs * 60),
        categoryId: selectedCatId,
        startDate: startDate.getTime(),
        endDate: fixedEnd.getTime(),
      });
    }

    notification(NotificationFeedbackType.Success);
    closeSheet();
  };

  const currentStreak = useMemo(() => computeStreak(activities), [activities]);

  const now = Date.now();
  const activeGoals = useMemo(
    () => customGoals.filter((g) => g.endDate >= now),
    [customGoals],
  );
  const pastGoals = useMemo(
    () => customGoals.filter((g) => g.endDate < now).sort((a, b) => b.endDate - a.endDate),
    [customGoals],
  );


  // Render Empty State
  if (customGoals.length === 0 && pastGoals.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-[#121212]"
        edges={["top"]}
      >
        <View className="flex-row items-center justify-between mb-6 mt-8 px-6">
          <Text className="text-4xl font-black text-[#121212] dark:text-white">
            {t("goals")}
          </Text>
        </View>

        <EmptyState
          icon={<Target size={48} color="#14b8a6" strokeWidth={1.5} />}
          iconBg="rgba(20,184,166,0.1)"
          title={t("no_goals_yet")}
          description={t("no_goals_desc")}
          action={{ label: t("create_new_goal"), onPress: openSheet }}
        />

        {renderAddGoalModal()}
      </SafeAreaView>
    );
  }

  // Render Actual Goals UI
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]" edges={["top"]}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6 mt-8">
          <Text className="text-4xl font-black text-[#121212] dark:text-white">
            {t("goals")}
          </Text>
          <Pressable
            onPress={() => {
              impact(ImpactFeedbackStyle.Light);
              openSheet();
            }}
            className="w-10 h-10 bg-teal-500/10 rounded-full items-center justify-center"
          >
            <Plus size={20} color="#14b8a6" strokeWidth={3} />
          </Pressable>
        </View>

        {/* The Streak */}
        <View className="mb-6">
          <SectionHeader label={t("activity")} />
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100 }}
            className="w-full bg-teal-50 dark:bg-teal-950/40 p-5 rounded-[28px] flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 bg-white dark:bg-teal-900/30 rounded-[18px] items-center justify-center mr-4 shadow-sm">
                <Flame size={28} color="#f43f5e" fill="#f43f5e" />
              </View>
              <View>
                <Text className="text-[13px] font-bold text-[#f43f5e] uppercase tracking-wider mb-0.5">
                  {t("focus_streak")}
                </Text>
                <Text className="text-2xl font-black text-[#121212] dark:text-white leading-tight">
                  {currentStreak} {currentStreak === 1 ? t("day") : t("days")}
                </Text>
              </View>
            </View>
          </MotiView>
        </View>

        {/* Active Goals List */}
        {activeGoals.length > 0 && (
          <>
            <SectionHeader label={t("active_objectives")} />
            <View className="gap-4">
              {activeGoals.map((goal, idx) => {
                const catData = categories.find((c: Category) => c.id === goal.categoryId);
                if (!catData) return null;
                const currentMins = activities
                  .filter((a: Activity) =>
                    a.category === goal.categoryId &&
                    a.start_time >= goal.startDate &&
                    a.start_time <= goal.endDate,
                  )
                  .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    catData={catData}
                    currentMins={currentMins}
                    index={idx}
                    onPressMore={() => setSelectedActionGoalId(goal.id)}
                  />
                );
              })}
            </View>
          </>
        )}

        {/* Past Goals */}
        {pastGoals.length > 0 && (
          <View className="mt-8">
            <SectionHeader label="Past Goals" />
            <View className="gap-3">
              {pastGoals.map((goal) => {
                const catData = categories.find((c: Category) => c.id === goal.categoryId);
                const loggedMins = activities
                  .filter((a: Activity) =>
                    a.category === goal.categoryId &&
                    a.start_time >= goal.startDate &&
                    a.start_time <= goal.endDate,
                  )
                  .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
                const pct = Math.min(100, Math.round((loggedMins / goal.targetMins) * 100));
                const achieved = loggedMins >= goal.targetMins;
                const loggedHrs = (loggedMins / 60).toFixed(1);
                const targetHrsVal = (goal.targetMins / 60).toFixed(1);
                return (
                  <View
                    key={goal.id}
                    className="bg-gray-50 dark:bg-zinc-900 rounded-[24px] p-4 flex-row items-center border border-gray-100 dark:border-zinc-800"
                  >
                    <View
                      style={{ backgroundColor: `${catData?.color || "#999"}20` }}
                      className="w-10 h-10 rounded-[12px] items-center justify-center mr-3"
                    >
                      <Target size={18} color={catData?.color || "#999"} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-klowk-black dark:text-white text-sm" numberOfLines={1}>
                        {goal.name}
                      </Text>
                      <Text className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 mt-0.5">
                        {loggedHrs}h of {targetHrsVal}h · {new Date(goal.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${achieved ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                      <Text className={`text-[10px] font-black ${achieved ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {achieved ? "✓ Done" : `${pct}%`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Action Sheet mapping Note: We re-use LogActionSheet but passing custom handlers */}
      <LogActionSheet
        title="Goal Actions"
        visible={selectedActionGoalId !== null}
        onClose={() => setSelectedActionGoalId(null)}
        onEdit={() => {
          if (selectedActionGoalId) {
            const goalToEdit = customGoals.find(
              (g) => g.id === selectedActionGoalId,
            );
            setSelectedActionGoalId(null);
            if (goalToEdit) {
              setTimeout(() => openSheet(goalToEdit), 300); // Wait for sheet to close
            }
          }
        }}
        onDelete={() => {
          if (selectedActionGoalId) {
            deleteCustomGoal(selectedActionGoalId);
            setSelectedActionGoalId(null);
            notification(NotificationFeedbackType.Success);
          }
        }}
      />

      {renderAddGoalModal()}
    </SafeAreaView>
  );

  function renderAddGoalModal() {
    const isFormValid =
      goalName.trim() &&
      targetHrs.trim() &&
      !isNaN(parseFloat(targetHrs)) &&
      selectedCatId;

    return (
      <Modal
        visible={showAddModal}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <View style={{ flex: 1 }}>
          <Animated.View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.6)",
              opacity: sheetBackdrop,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={closeSheet} />
            <Animated.View style={{ marginBottom: keyboardOffset }}>
            <Animated.View style={{ transform: [{ translateY: sheetSlide }] }}>
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: isDark ? "#1C1C1E" : "#fff",
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                  padding: 32,
                  paddingBottom: 48,
                  maxHeight: height * 0.9,
                }}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Sheet header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 28,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "900",
                        color: isDark ? "#fff" : "#121212",
                      }}
                    >
                      {editId ? t("edit_goal") : t("new_goal")}
                    </Text>
                    <Pressable
                      onPress={closeSheet}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={18} color={isDark ? "#fff" : "#121212"} />
                    </Pressable>
                  </View>

                  {/* Goal Name Input */}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900",
                      color: isDark ? "#71717a" : "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      marginBottom: 12,
                    }}
                  >
                    {t("goal_name")}
                  </Text>
                  <View
                    style={{
                      backgroundColor: isDark ? "#2c2c2e" : "#f9fafb",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isDark ? "#3a3a3c" : "#f3f4f6",
                      marginBottom: 24,
                    }}
                  >
                    <TextInput
                      value={goalName}
                      onChangeText={setGoalName}
                      placeholder="e.g. Feed Flow"
                      placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                      style={{
                        padding: 18,
                        fontSize: 16,
                        fontWeight: "700",
                        color: isDark ? "#fff" : "#121212",
                      }}
                    />
                  </View>

                  {/* Select Category */}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900",
                      color: isDark ? "#71717a" : "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      marginBottom: 12,
                    }}
                  >
                    {t("category_label")}
                  </Text>
                  <View style={{ marginBottom: 24 }}>
                    <CategoryPillScroller
                      categories={categories}
                      selectedId={selectedCatId}
                      onSelect={setSelectedCatId}
                      layout="scroll"
                    />
                  </View>

                  {/* Hours Target Input */}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900",
                      color: isDark ? "#71717a" : "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      marginBottom: 12,
                    }}
                  >
                    Target
                  </Text>
                  <View
                    style={{
                      backgroundColor: isDark ? "#2c2c2e" : "#f9fafb",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isDark ? "#3a3a3c" : "#f3f4f6",
                      marginBottom: 24,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ paddingLeft: 18, marginRight: -8 }}>
                      <Clock size={16} color={isDark ? "#52525b" : "#9ca3af"} />
                    </View>
                    <TextInput
                      value={targetHrs}
                      onChangeText={setTargetHrs}
                      placeholder="Total Hours (e.g. 50)"
                      placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                      keyboardType="numeric"
                      style={{
                        flex: 1,
                        padding: 18,
                        fontSize: 16,
                        fontWeight: "700",
                        color: isDark ? "#fff" : "#121212",
                      }}
                    />
                  </View>

                  {/* Date Range Row */}
                  <View
                    style={{ flexDirection: "row", gap: 16, marginBottom: 32 }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "900",
                          color: isDark ? "#71717a" : "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: 2,
                          marginBottom: 12,
                        }}
                      >
                        Start Date
                      </Text>
                      <Pressable
                        onPress={() => {
                          setActiveDateType("start");
                          setShowDatePicker(true);
                          impact(ImpactFeedbackStyle.Light);
                        }}
                        style={{
                          backgroundColor: isDark ? "#2c2c2e" : "#f9fafb",
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: isDark ? "#3a3a3c" : "#f3f4f6",
                          flexDirection: "row",
                          alignItems: "center",
                          height: 50,
                          paddingHorizontal: 14,
                        }}
                      >
                        <CalendarIcon
                          size={14}
                          color={isDark ? "#52525b" : "#9ca3af"}
                        />
                        <Text
                          style={{
                            flex: 1,
                            marginLeft: 10,
                            fontSize: 14,
                            fontWeight: "700",
                            color: isDark ? "#fff" : "#121212",
                          }}
                        >
                          {startDate.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "900",
                          color: isDark ? "#71717a" : "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: 2,
                          marginBottom: 12,
                        }}
                      >
                        End Date
                      </Text>
                      <Pressable
                        onPress={() => {
                          setActiveDateType("end");
                          setShowDatePicker(true);
                          impact(ImpactFeedbackStyle.Light);
                        }}
                        style={{
                          backgroundColor: isDark ? "#2c2c2e" : "#f9fafb",
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: isDark ? "#3a3a3c" : "#f3f4f6",
                          flexDirection: "row",
                          alignItems: "center",
                          height: 50,
                          paddingHorizontal: 14,
                        }}
                      >
                        <CalendarIcon
                          size={14}
                          color={isDark ? "#52525b" : "#9ca3af"}
                        />
                        <Text
                          style={{
                            flex: 1,
                            marginLeft: 10,
                            fontSize: 14,
                            fontWeight: "700",
                            color: isDark ? "#fff" : "#121212",
                          }}
                        >
                          {endDate.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Create button */}
                  <Pressable
                    onPress={handleSaveGoal}
                    disabled={!isFormValid}
                    style={{
                      paddingVertical: 18,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: !isFormValid
                        ? isDark
                          ? "rgba(251,191,36,0.15)"
                          : "#f3f4f6"
                        : "#FBBF24",
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "900",
                        color: !isFormValid
                          ? isDark
                            ? "rgba(251,191,36,0.4)"
                            : "#9ca3af"
                          : "#fff",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {editId ? "Save Changes" : "Save Goal"}
                    </Text>
                  </Pressable>
                </ScrollView>
              </Pressable>
            </Animated.View>
            </Animated.View>
          </Animated.View>
        </View>

        <DatePickerModal
          visible={showDatePicker}
          selected={activeDateType === "start" ? startDate : endDate}
          onSelect={(d) => {
            if (activeDateType === "start") setStartDate(d);
            else setEndDate(d);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      </Modal>
    );
  }
}
