import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router } from "expo-router";
import { History, Settings2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { View as MotiView } from "moti";
import { useNavigation } from "@react-navigation/native";

export default function HomeHeader() {
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation<any>();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: -20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 700 }}
      className="px-6 py-2 mb-2 flex-row justify-end items-center"
    >
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          onPress={() => { impact(ImpactFeedbackStyle.Medium); router.push("/history"); }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full mr-2"
        >
          <History size={20} color={colorScheme === "dark" ? "#fff" : "#121212"} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { impact(ImpactFeedbackStyle.Medium); navigation.navigate("settings"); }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full"
        >
          <Settings2 size={20} color={colorScheme === "dark" ? "#fff" : "#121212"} />
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}
