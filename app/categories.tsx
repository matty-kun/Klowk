import { CategoryIcon } from "@/components/CategoryIcon";
import ActionSheet from "@/components/ActionSheet";
import EditCategorySheet from "@/components/EditCategorySheet";
import NewCategorySheet from "@/components/NewCategorySheet";
import { Activity, Category, useTracking } from "@/context/TrackingContext";
import { impact } from "@/utils/haptics";
import { formatDate, formatTimestamp } from "@/utils/time";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router } from "expo-router";
import { ArrowLeft, Copy, Edit2, MoreHorizontal, Plus, Trash2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function CategoriesScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    activities,
    categories,
    deleteActivity,
    deleteCategory,
    duplicateActivity,
  } = useTracking();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionCategoryId, setActionCategoryId] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(width)).current;

  const categoryStats = useMemo(() => {
    return categories.map((cat: Category) => {
      const logs = activities.filter((a: Activity) => a.category === cat.id);
      const totalSecs = logs.reduce(
        (sum: number, a: Activity) => sum + (a.duration || 0),
        0,
      );
      const totalMins = Math.floor(totalSecs / 60);
      return { ...cat, totalMins, sessionCount: logs.length };
    });
  }, [activities, categories]);

  const selectedCatData = useMemo(
    () =>
      selectedCategory
        ? categories.find((c: Category) => c.id === selectedCategory)
        : null,
    [selectedCategory, categories],
  );

  const selectedCatLogs = useMemo(
    () =>
      selectedCategory
        ? activities.filter((a: Activity) => a.category === selectedCategory)
        : [],
    [selectedCategory, activities],
  );

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedCategory ? 0 : width,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [selectedCategory]);

  const formatTime = (totalMins: number) => {
    if (totalMins === 0) return "--";
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0
      ? `${hrs}h ${mins > 0 ? mins + "m" : ""}`.trim()
      : `${mins}m`;
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#fff" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#18181b" : "#f9fafb",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
        </Pressable>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: isDark ? "#fff" : "#121212",
          }}
        >
          Categories
        </Text>
        <Pressable
          onPress={() => {
            impact(ImpactFeedbackStyle.Medium);
            setShowAddCategory(true);
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#18181b" : "#f9fafb",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={20} color="#FBBF24" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Category List */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24 }}>
          {categoryStats.map((stat: any, i: number) => (
            <Pressable
              key={stat.id}
              onPress={() => {
                impact(ImpactFeedbackStyle.Light);
                setSelectedCategory(stat.id);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                borderBottomWidth: i < categoryStats.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? "#27272a" : "#f3f4f6",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${stat.color}22`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <CategoryIcon
                  name={stat.iconName}
                  size={22}
                  color={stat.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: isDark ? "#fff" : "#1a1a1a",
                    marginBottom: 2,
                  }}
                >
                  {stat.label}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#71717a" : "#9ca3af",
                    fontWeight: "600",
                  }}
                >
                  {stat.sessionCount === 0
                    ? "No sessions"
                    : `${stat.sessionCount} ${stat.sessionCount === 1 ? "session" : "sessions"}`}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: isDark ? "#fff" : "#1a1a1a" }}>
                  {formatTime(stat.totalMins)}
                </Text>
                <Pressable
                  onPress={() => { impact(ImpactFeedbackStyle.Medium); setActionCategoryId(stat.id); }}
                  hitSlop={10}
                  style={{ padding: 2 }}
                >
                  <MoreHorizontal size={16} color={isDark ? "#52525b" : "#9ca3af"} />
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Category Detail Slide-In Overlay */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDark ? "#121212" : "#fff",
          zIndex: 100,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#27272a" : "#f3f4f6",
            }}
          >
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? "#18181b" : "#f9fafb",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
            </Pressable>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: isDark ? "#fff" : "#121212",
              }}
            >
              {selectedCatData?.label}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View
              style={{
                alignItems: "center",
                paddingVertical: 32,
                paddingHorizontal: 24,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 28,
                  backgroundColor: `${selectedCatData?.color}18`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <CategoryIcon
                  name={selectedCatData?.iconName || "tag"}
                  size={36}
                  color={selectedCatData?.color || "#FBBF24"}
                />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                  color: isDark ? "#fff" : "#121212",
                  marginBottom: 4,
                }}
              >
                {selectedCatData?.label}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: isDark ? "#71717a" : "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: 3,
                }}
              >
                {selectedCatLogs.length}{" "}
                {selectedCatLogs.length === 1 ? "session" : "sessions"} total
              </Text>
            </View>

            <View style={{ paddingHorizontal: 24 }}>
              {selectedCatLogs.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 48 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 22,
                      backgroundColor: isDark ? "#18181b" : "#f9fafb",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <CategoryIcon
                      name={selectedCatData?.iconName || "tag"}
                      size={28}
                      color={isDark ? "#3f3f46" : "#d1d5db"}
                    />
                  </View>
                  <Text
                    style={{
                      color: isDark ? "#52525b" : "#d1d5db",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    No sessions yet
                  </Text>
                  <Text
                    style={{
                      color: isDark ? "#3f3f46" : "#e5e7eb",
                      fontWeight: "600",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    Log a session to see it here
                  </Text>
                </View>
              ) : (
                selectedCatLogs.map((log: Activity) => (
                  <View
                    key={log.id}
                    style={{
                      backgroundColor: isDark ? "#18181b" : "#fff",
                      padding: 20,
                      borderRadius: 24,
                      marginBottom: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderWidth: 1,
                      borderColor: isDark ? "#27272a" : "#f3f4f6",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: isDark ? "#fff" : "#121212",
                          marginBottom: 4,
                        }}
                      >
                        {log.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: isDark ? "#52525b" : "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {formatDate(log.start_time)} •{" "}
                        {formatTimestamp(log.start_time)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "900",
                          color: isDark ? "#fff" : "#121212",
                        }}
                      >
                        {formatTime(log.duration || 0)}
                      </Text>
                      <Pressable
                        onPress={() => setSelectedActionLogId(log.id)}
                        hitSlop={10}
                        style={{ padding: 4, marginTop: 4 }}
                      >
                        <MoreHorizontal size={15} color="#9ca3af" />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      <NewCategorySheet visible={showAddCategory} onClose={() => setShowAddCategory(false)} />
      <EditCategorySheet category={editingCategory} onClose={() => setEditingCategory(null)} />
      <ActionSheet
        visible={actionCategoryId !== null}
        onClose={() => setActionCategoryId(null)}
        title="Category Actions"
        actions={[
          {
            label: "Edit category",
            icon: <Edit2 size={20} color={isDark ? "#e5e7eb" : "#121212"} />,
            onPress: () => {
              const cat = categories.find((c: Category) => c.id === actionCategoryId);
              setEditingCategory(cat || null);
              setActionCategoryId(null);
            },
          },
          {
            label: "Delete category",
            icon: <Trash2 size={20} color="#ef4444" />,
            destructive: true,
            onPress: () => {
              Alert.alert("Delete category?", "Sessions logged here will remain but won't be grouped.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => { deleteCategory(actionCategoryId!); setActionCategoryId(null); } },
              ]);
            },
          },
        ]}
      />

      <ActionSheet
        visible={selectedActionLogId !== null}
        onClose={() => setSelectedActionLogId(null)}
        title="Log Actions"
        actions={[
          {
            label: "Edit details",
            icon: <Edit2 size={20} color={isDark ? "#e5e7eb" : "#121212"} />,
            onPress: () => {
              if (selectedActionLogId) {
                router.push({ pathname: "/logmanual", params: { editId: selectedActionLogId } });
                setSelectedActionLogId(null);
              }
            },
          },
          {
            label: "Duplicate activity",
            icon: <Copy size={20} color={isDark ? "#9ca3af" : "#4b5563"} />,
            onPress: () => { if (selectedActionLogId) { duplicateActivity(selectedActionLogId); setSelectedActionLogId(null); } },
          },
          {
            label: "Delete forever",
            icon: <Trash2 size={20} color="#ef4444" />,
            destructive: true,
            onPress: () => { if (selectedActionLogId) { deleteActivity(selectedActionLogId); setSelectedActionLogId(null); } },
          },
        ]}
      />
    </SafeAreaView>
  );
}
