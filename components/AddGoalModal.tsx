import CategoryPillScroller from "@/components/CategoryPillScroller";
import DatePickerModal from "@/components/DatePickerModal";
import { useLanguage } from "@/context/LanguageContext";
import { useTracking } from "@/context/TrackingContext";
import { impact, notification } from "@/utils/haptics";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
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
  View,
} from "react-native";

const { height } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AddGoalModal({ visible, onClose }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { categories, addCustomGoal } = useTracking();
  const { t } = useLanguage();

  const [goalName, setGoalName] = useState("");
  const [targetVal, setTargetVal] = useState("");
  const [targetUnit, setTargetUnit] = useState<"hrs" | "mins">("hrs");
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateType, setActiveDateType] = useState<"start" | "end">("start");

  const sheetSlide = useRef(new Animated.Value(800)).current;
  const sheetBackdrop = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => Animated.timing(keyboardOffset, { toValue: e.endCoordinates.height, duration: Platform.OS === "ios" ? e.duration : 200, useNativeDriver: false }).start()
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => Animated.timing(keyboardOffset, { toValue: 0, duration: Platform.OS === "ios" ? e.duration : 200, useNativeDriver: false }).start()
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (visible) {
      setGoalName("");
      setTargetVal("");
      setTargetUnit("hrs");
      setStartDate(new Date());
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setEndDate(d);
      Animated.parallel([
        Animated.timing(sheetBackdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetSlide, { toValue: 0, tension: 40, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetBackdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetSlide, { toValue: 800, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSave = () => {
    const val = parseFloat(targetVal);
    if (!goalName.trim() || isNaN(val) || val <= 0 || !selectedCatId) return;
    const targetMins = targetUnit === "hrs" ? Math.round(val * 60) : Math.round(val);
    const fixedEnd = new Date(endDate);
    fixedEnd.setHours(23, 59, 59, 999);
    addCustomGoal({
      id: Date.now().toString(),
      name: goalName.trim(),
      targetMins,
      categoryId: selectedCatId,
      startDate: startDate.getTime(),
      endDate: fixedEnd.getTime(),
    });
    notification(NotificationFeedbackType.Success);
    onClose();
  };

  const isFormValid = goalName.trim() && targetVal.trim() && !isNaN(parseFloat(targetVal)) && selectedCatId;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)", opacity: sheetBackdrop }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <Animated.View style={{ marginBottom: keyboardOffset }}>
            <Animated.View style={{ transform: [{ translateY: sheetSlide }] }}>
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{ backgroundColor: isDark ? "#1C1C1E" : "#fff", borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: 48, maxHeight: height * 0.9 }}
              >
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  {/* Header */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <Text style={{ fontSize: 24, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>
                      {t("new_goal")}
                    </Text>
                    <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6", alignItems: "center", justifyContent: "center" }}>
                      <X size={18} color={isDark ? "#fff" : "#121212"} />
                    </Pressable>
                  </View>

                  {/* Goal Name */}
                  <Text style={{ fontSize: 11, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
                    {t("goal_name")}
                  </Text>
                  <View style={{ backgroundColor: isDark ? "#2c2c2e" : "#f9fafb", borderRadius: 20, borderWidth: 1, borderColor: isDark ? "#3a3a3c" : "#f3f4f6", marginBottom: 24 }}>
                    <TextInput
                      value={goalName}
                      onChangeText={setGoalName}
                      placeholder="e.g. Feed Flow"
                      placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                      style={{ padding: 18, fontSize: 16, fontWeight: "700", color: isDark ? "#fff" : "#121212" }}
                    />
                  </View>

                  {/* Category */}
                  <Text style={{ fontSize: 11, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
                    {t("category_label")}
                  </Text>
                  <View style={{ marginBottom: 24 }}>
                    <CategoryPillScroller categories={categories} selectedId={selectedCatId} onSelect={setSelectedCatId} layout="scroll" />
                  </View>

                  {/* Target */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2 }}>
                      Target
                    </Text>
                    <View style={{ flexDirection: "row", backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6", borderRadius: 12, padding: 3 }}>
                      {(["hrs", "mins"] as const).map((unit) => (
                        <Pressable key={unit} onPress={() => setTargetUnit(unit)} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: targetUnit === unit ? "#FBBF24" : "transparent" }}>
                          <Text style={{ fontSize: 11, fontWeight: "900", color: targetUnit === unit ? "#fff" : isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase" }}>
                            {unit}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={{ backgroundColor: isDark ? "#2c2c2e" : "#f9fafb", borderRadius: 20, borderWidth: 1, borderColor: isDark ? "#3a3a3c" : "#f3f4f6", marginBottom: 24, flexDirection: "row", alignItems: "center" }}>
                    <View style={{ paddingLeft: 18, marginRight: -8 }}>
                      <Clock size={16} color={isDark ? "#52525b" : "#9ca3af"} />
                    </View>
                    <TextInput
                      value={targetVal}
                      onChangeText={setTargetVal}
                      placeholder={targetUnit === "hrs" ? "Total hours (e.g. 10)" : "Total minutes (e.g. 90)"}
                      placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                      keyboardType="numeric"
                      style={{ flex: 1, padding: 18, fontSize: 16, fontWeight: "700", color: isDark ? "#fff" : "#121212" }}
                    />
                  </View>

                  {/* Date Range */}
                  <View style={{ flexDirection: "row", gap: 16, marginBottom: 32 }}>
                    {(["start", "end"] as const).map((type) => (
                      <View key={type} style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
                          {type === "start" ? "Start Date" : "End Date"}
                        </Text>
                        <Pressable
                          onPress={() => { setActiveDateType(type); setShowDatePicker(true); impact(ImpactFeedbackStyle.Light); }}
                          style={{ backgroundColor: isDark ? "#2c2c2e" : "#f9fafb", borderRadius: 20, borderWidth: 1, borderColor: isDark ? "#3a3a3c" : "#f3f4f6", flexDirection: "row", alignItems: "center", height: 50, paddingHorizontal: 14 }}
                        >
                          <CalendarIcon size={14} color={isDark ? "#52525b" : "#9ca3af"} />
                          <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: "700", color: isDark ? "#fff" : "#121212" }}>
                            {(type === "start" ? startDate : endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Save */}
                  <Pressable
                    onPress={handleSave}
                    disabled={!isFormValid}
                    style={{ paddingVertical: 18, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: !isFormValid ? (isDark ? "rgba(251,191,36,0.15)" : "#f3f4f6") : "#FBBF24", marginBottom: 16 }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "900", color: !isFormValid ? (isDark ? "rgba(251,191,36,0.4)" : "#9ca3af") : "#fff", textTransform: "uppercase", letterSpacing: 1 }}>
                      Save Goal
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
        onSelect={(d) => { if (activeDateType === "start") setStartDate(d); else setEndDate(d); }}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
}
