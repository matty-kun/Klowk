import { CategoryIcon } from "@/components/CategoryIcon";
import CategoryPillScroller from "@/components/CategoryPillScroller";
import DatePickerModal from "@/components/DatePickerModal";
import FormField from "@/components/FormField";
import ScreenHeader from "@/components/ScreenHeader";
import TimeInputTrio from "@/components/TimeInputTrio";
import { useLanguage } from "@/context/LanguageContext";
import { Activity, Category, useTracking } from "@/context/TrackingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    AlignLeft,
    Calendar as CalendarIcon,
    Check,
    Clock,
    Tag,
    Target,
    Zap,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EntryModal() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const {
    addManualActivity,
    startTracker,
    editActivity,
    activities,
    categories,
    customGoals,
  } = useTracking();
  const { t } = useLanguage();

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

  // Form State
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState("work");
  const [description, setDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Initial Data Population for Edit Mode
  useEffect(() => {
    if (editId) {
      const activityToEdit = activities.find(
        (a: Activity) => a.id === Number(editId),
      );
      if (activityToEdit) {
        setTitle(activityToEdit.title);
        setCategory(activityToEdit.category || "work");
        setDescription(activityToEdit.description || "");
        setDate(new Date(activityToEdit.start_time));
        if (activityToEdit.duration) {
          setHours(Math.floor(activityToEdit.duration / 3600).toString());
          setMinutes(
            Math.floor((activityToEdit.duration % 3600) / 60).toString(),
          );
          setSeconds((activityToEdit.duration % 60).toString());
        }
      }
    }
  }, [editId]);

  // Custom Calendar Logic
  const [viewedMonth, setViewedMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const days = getDaysInMonth(viewedMonth);
  const monthName = viewedMonth.toLocaleString("default", { month: "long" });
  const yearName = viewedMonth.getFullYear();

  const changeMonth = (offset: number) => {
    const newMonth = new Date(
      viewedMonth.setMonth(viewedMonth.getMonth() + offset),
    );
    setViewedMonth(new Date(newMonth));
  };

  const handleSave = async () => {
    if (!title) return;
    notification(NotificationFeedbackType.Success);

    const totalSecs =
      (parseInt(hours) || 0) * 3600 +
      (parseInt(minutes) || 0) * 60 +
      (parseInt(seconds) || 0);

    if (editId && typeof editId === "string") {
      await editActivity(
        Number(editId),
        title,
        category,
        totalSecs,
        description,
        date,
      );
    } else if (totalSecs > 0) {
      await addManualActivity(title, category, totalSecs, description, date);
    } else {
      await startTracker(title, category, description);
    }

    router.back();
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
          {/* Header Area */}
          <ScreenHeader
            title={editId ? t("edit_log") : t("new_log")}
            onBack={() => router.back()}
          />

          {/* Form Fields */}
          <View className="mb-8">
            <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
              {t("manual_details")}
            </Text>

            {/* Title */}
            <FormField
              icon={<Zap size={14} color="#9ca3af" />}
              label={t("what_did_you_do")}
              className="mb-5"
            >
              <View className="bg-gray-50 dark:bg-zinc-900 rounded-[20px] border border-gray-100 dark:border-zinc-800">
                <TextInput
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    if (selectedGoalId) setSelectedGoalId(null);
                  }}
                  placeholder={t("what_working_on")}
                  placeholderTextColor={
                    colorScheme === "dark" ? "#3f3f46" : "#d1d5db"
                  }
                  className="p-4 text-base font-bold text-klowk-black dark:text-white"
                />
              </View>
            </FormField>

            {/* Duration Row */}
            <View className="mb-5">
              <TimeInputTrio
                hours={hours} minutes={minutes} seconds={seconds}
                onChangeHours={setHours} onChangeMinutes={setMinutes} onChangeSeconds={setSeconds}
              />
            </View>

            {/* Date Picker */}
            <View className="mb-5">
              <View className="flex-row gap-2">
              <View className="flex-[1.2]">
                <View className="flex-row items-center mb-2">
                  <CalendarIcon size={12} color="#9ca3af" />
                  <Text className="ml-1 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">
                    Date
                  </Text>
                </View>
                <Pressable
                  onPress={() => { impact(ImpactFeedbackStyle.Light); setShowDatePicker(true); }}
                  className="bg-gray-50 dark:bg-zinc-900 h-[54px] rounded-2xl border border-gray-100 dark:border-zinc-800 items-center justify-center"
                >
                  <Text className="text-xs font-bold text-klowk-black dark:text-white">
                    {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </Text>
                </Pressable>
              </View>
              </View>
            </View>

            <DatePickerModal
              visible={showDatePicker}
              selected={date}
              onSelect={setDate}
              onClose={() => setShowDatePicker(false)}
            />

            {/* Description */}
            <FormField
              icon={<AlignLeft size={14} color="#9ca3af" />}
              label={t("description_optional")}
              className="mb-6"
            >
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t("how_did_it_go")}
                placeholderTextColor={
                  colorScheme === "dark" ? "#3f3f46" : "#d1d5db"
                }
                multiline
                numberOfLines={3}
                className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-[20px] border border-gray-100 dark:border-zinc-800 h-[100px] text-left text-sm font-bold text-klowk-black dark:text-white"
                style={{ textAlignVertical: "top" }}
              />
            </FormField>

            {/* Goals Selection */}
            <FormField
              icon={<Target size={14} color="#FBBF24" />}
              label={t("active_goals")}
              className="mb-8"
              labelClassName="mb-4"
            >
              {customGoals.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  {customGoals.map((goal) => {
                    const isSelected = selectedGoalId === goal.id;
                    const cat = categories.find(
                      (c) => c.id === goal.categoryId,
                    );

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
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Medium,
                          );
                        }}
                        className={`mr-3 p-4 rounded-[20px] border min-w-[150px] ${isSelected ? "border-[#FBBF24] bg-amber-50 dark:bg-amber-500/10" : "bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"}`}
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
                <View className="bg-gray-50 dark:bg-zinc-900/50 rounded-[20px] p-5 border border-dashed border-gray-200 dark:border-zinc-800 items-center">
                  <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 italic">
                    {t("no_goals_create")}
                  </Text>
                </View>
              )}
            </FormField>

            {/* Category */}
            <FormField
              icon={<Tag size={14} color="#9ca3af" />}
              label={t("category_label")}
              className="mb-8"
              labelClassName="mb-3"
            >
              <CategoryPillScroller
                categories={categories}
                selectedId={category}
                onSelect={setCategory}
                layout="wrap"
              />
            </FormField>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View className="p-6 border-t border-gray-50 dark:border-zinc-900 bg-white dark:bg-klowk-black">
          <Pressable
            onPress={handleSave}
            disabled={!title}
            className={`py-5 rounded-[24px] flex-row items-center justify-center ${!title ? "bg-gray-100 dark:bg-zinc-900" : "bg-klowk-black dark:bg-white"}`}
          >
            <Check
              size={20}
              color={
                !title ? "#939393" : colorScheme === "dark" ? "#121212" : "#fff"
              }
              className="mr-3"
            />
            <Text
              className={`font-black uppercase ${!title ? "text-gray-400" : colorScheme === "dark" ? "text-zinc-900" : "text-white"}`}
            >
              {editId
                ? t("save_changes")
                : (parseInt(hours) || 0) * 3600 +
                      (parseInt(minutes) || 0) * 60 >
                    0
                  ? t("save_entry")
                  : t("launch_session")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
