import { CategoryIcon } from "@/components/CategoryIcon";
import ProgressBar from "@/components/ProgressBar";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/context/TrackingContext";
import { MoreHorizontal } from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  goal: {
    id: string;
    name: string;
    targetMins: number;
    categoryId: string;
    startDate: number;
    endDate: number;
  };
  catData: Category;
  currentMins: number;
  index?: number;
  onPressMore: () => void;
};

export default function GoalCard({ goal, catData, currentMins, index = 0, onPressMore }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();

  const formatHrs = (mins: number) => (mins / 60).toFixed(1).replace(".0", "");
  const pct = Math.min(100, (currentMins / goal.targetMins) * 100) || 0;
  const isCompleted = pct >= 100;
  const daysRemaining = Math.max(
    0,
    Math.ceil((goal.endDate - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 200 + index * 50 }}
      className="bg-white dark:bg-teal-950/30 rounded-[32px] border border-teal-100 dark:border-teal-900/50 shadow-sm p-5"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1 pr-4">
          <View
            style={{ backgroundColor: `${catData.color}15` }}
            className="w-12 h-12 rounded-[16px] items-center justify-center mr-4"
          >
            <CategoryIcon name={catData.iconName} size={22} color={catData.color} />
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-black text-[#121212] dark:text-white leading-tight mb-1"
              numberOfLines={1}
            >
              {goal.name}
            </Text>
            <Text className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-zinc-500">
              {t(catData.id as any) || catData.label}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Pressable hitSlop={15} style={{ marginBottom: 4 }} onPress={onPressMore}>
            <MoreHorizontal size={18} color={isDark ? "#52525b" : "#9ca3af"} />
          </Pressable>
          <Text className="text-xs font-black text-[#121212] dark:text-white">
            {formatHrs(currentMins)}{" "}
            <Text className="text-gray-400">/ {formatHrs(goal.targetMins)}h</Text>
          </Text>
          <Text className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
            {daysRemaining} {daysRemaining === 1 ? t("day_left") : t("days_left")}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={pct / 100}
        color={isCompleted ? "#10b981" : catData.color}
        trackColor={isDark ? "#27272a" : "#f3f4f6"}
        height={8}
      />
    </MotiView>
  );
}
