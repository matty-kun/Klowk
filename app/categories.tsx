import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Dimensions, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreHorizontal, Plus, X, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useTracking, Activity, Category } from '@/context/TrackingContext';
import { CategoryIcon } from '@/components/CategoryIcon';
import { formatDate, formatTimestamp } from '@/utils/time';
import LogActionSheet from '@/components/LogActionSheet';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const ICONS = ['briefcase', 'heart', 'book-open', 'coffee', 'zap', 'target', 'brain', 'tag', 'users', 'code', 'music', 'camera', 'layers'];
const COLORS = ['#FF5A00', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4', '#4b5563'];

export default function CategoriesScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { activities, categories, deleteActivity, duplicateActivity, addCategory } = useTracking();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('tag');
  const [newCatColor, setNewCatColor] = useState('#FF5A00');

  const slideAnim = useRef(new Animated.Value(width)).current;
  const sheetSlide = useRef(new Animated.Value(500)).current;
  const sheetBackdrop = useRef(new Animated.Value(0)).current;

  const categoryStats = useMemo(() => {
    return categories.map((cat: Category) => {
      const logs = activities.filter((a: Activity) => a.category === cat.id);
      const totalMins = logs.reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
      return { ...cat, totalMins, sessionCount: logs.length };
    });
  }, [activities, categories]);

  const selectedCatData = useMemo(() =>
    selectedCategory ? categories.find((c: Category) => c.id === selectedCategory) : null,
    [selectedCategory, categories]);

  const selectedCatLogs = useMemo(() =>
    selectedCategory ? activities.filter((a: Activity) => a.category === selectedCategory) : [],
    [selectedCategory, activities]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedCategory ? 0 : width,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [selectedCategory]);

  const formatTime = (totalMins: number) => {
    if (totalMins === 0) return '--';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins > 0 ? mins + 'm' : ''}`.trim() : `${mins}m`;
  };

  const openSheet = () => {
    setShowAddModal(true);
    setShowAddCategory(true);
    Animated.parallel([
      Animated.timing(sheetBackdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheetSlide, { toValue: 0, tension: 40, friction: 9, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetBackdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetSlide, { toValue: 500, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setShowAddModal(false);
      setShowAddCategory(false);
    });
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatIcon, newCatColor);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeSheet();
    setNewCatName('');
    setNewCatIcon('tag');
    setNewCatColor('#FF5A00');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#fff' }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 16,
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#18181b' : '#f9fafb', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color={isDark ? '#fff' : '#121212'} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#fff' : '#121212' }}>Categories</Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openSheet(); }}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#18181b' : '#f9fafb', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={20} color="#FF5A00" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Category List */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24 }}>
          {categoryStats.map((stat: any, i: number) => (
            <Pressable
              key={stat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(stat.id);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: i < categoryStats.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? '#27272a' : '#f3f4f6',
              }}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: `${stat.color}22`,
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>
                <CategoryIcon name={stat.iconName} size={22} color={stat.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#fff' : '#1a1a1a', marginBottom: 2 }}>
                  {stat.label}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#71717a' : '#9ca3af', fontWeight: '600' }}>
                  {stat.sessionCount === 0
                    ? '0 No sessions'
                    : `${stat.sessionCount} ${stat.sessionCount === 1 ? 'session' : 'sessions'}`}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: isDark ? '#fff' : '#1a1a1a' }}>
                {formatTime(stat.totalMins)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating + Button */}
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddCategory(true); }}
        style={{
          position: 'absolute', bottom: 36, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: '#FF5A00',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#FF5A00', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
        }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </Pressable>

      {/* Category Detail Slide-In Overlay */}
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: isDark ? '#121212' : '#fff',
        zIndex: 100,
        transform: [{ translateX: slideAnim }],
      }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 24, paddingVertical: 16,
            borderBottomWidth: 1, borderBottomColor: isDark ? '#27272a' : '#f3f4f6',
          }}>
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#18181b' : '#f9fafb', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={20} color={isDark ? '#fff' : '#121212'} />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#fff' : '#121212' }}>
              {selectedCatData?.label}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }}>
              <View style={{
                width: 80, height: 80, borderRadius: 28,
                backgroundColor: `${selectedCatData?.color}18`,
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <CategoryIcon name={selectedCatData?.iconName || 'tag'} size={36} color={selectedCatData?.color || '#FF5A00'} />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: isDark ? '#fff' : '#121212', marginBottom: 4 }}>
                {selectedCatData?.label}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 3 }}>
                {selectedCatLogs.length} {selectedCatLogs.length === 1 ? 'session' : 'sessions'} total
              </Text>
            </View>

            <View style={{ paddingHorizontal: 24 }}>
              {selectedCatLogs.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: isDark ? '#18181b' : '#f9fafb', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <CategoryIcon name={selectedCatData?.iconName || 'tag'} size={28} color={isDark ? '#3f3f46' : '#d1d5db'} />
                  </View>
                  <Text style={{ color: isDark ? '#52525b' : '#d1d5db', fontWeight: '700', fontSize: 14 }}>No sessions yet</Text>
                  <Text style={{ color: isDark ? '#3f3f46' : '#e5e7eb', fontWeight: '600', fontSize: 12, marginTop: 4 }}>Log a session to see it here</Text>
                </View>
              ) : (
                selectedCatLogs.map((log: Activity) => (
                  <View
                    key={log.id}
                    style={{
                      backgroundColor: isDark ? '#18181b' : '#fff',
                      padding: 20, borderRadius: 24, marginBottom: 12,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      borderWidth: 1, borderColor: isDark ? '#27272a' : '#f3f4f6',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#fff' : '#121212', marginBottom: 4 }}>
                        {log.title}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#52525b' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {formatDate(log.start_time)} • {formatTimestamp(log.start_time)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#fff' : '#121212' }}>
                        {formatTime(log.duration || 0)}
                      </Text>
                      <Pressable onPress={() => setSelectedActionLogId(log.id)} hitSlop={10} style={{ padding: 4, marginTop: 4 }}>
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

      {/* Add Category Sheet */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <Animated.View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', opacity: sheetBackdrop }}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
          <Animated.View style={{ transform: [{ translateY: sheetSlide }] }}>
            <Pressable onPress={e => e.stopPropagation()} style={{ backgroundColor: isDark ? '#121212' : '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: 48 }}>
              {/* Sheet header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? '#fff' : '#121212' }}>New Category</Text>
                <Pressable
                  onPress={closeSheet}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#27272a' : '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} color={isDark ? '#fff' : '#121212'} />
                </Pressable>
              </View>

              {/* Name input */}
              <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                Category Name
              </Text>
              <View style={{ backgroundColor: isDark ? '#18181b' : '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: isDark ? '#27272a' : '#f3f4f6', marginBottom: 24 }}>
                <TextInput
                  value={newCatName}
                  onChangeText={setNewCatName}
                  placeholder={newCatName.length > 0 ? '' : 'e.g. Learning, Workout...'}
                  placeholderTextColor={isDark ? '#3f3f46' : '#d1d5db'}
                  autoFocus
                  style={{ padding: 18, fontSize: 15, fontWeight: '700', color: isDark ? '#fff' : '#121212' }}
                />
              </View>

              {/* Icon picker */}
              <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                Icon
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {ICONS.map((icon) => (
                    <Pressable
                      key={icon}
                      onPress={() => { setNewCatIcon(icon); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={{
                        width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: newCatIcon === icon ? '#FF5A00' : (isDark ? '#18181b' : '#f9fafb'),
                        borderWidth: 1,
                        borderColor: newCatIcon === icon ? '#FF5A00' : (isDark ? '#27272a' : '#f3f4f6'),
                      }}
                    >
                      <CategoryIcon name={icon} size={20} color={newCatIcon === icon ? '#fff' : (isDark ? '#52525b' : '#9ca3af')} />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Color picker */}
              <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                Color
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
                {COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => { setNewCatColor(color); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: color,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 3,
                      borderColor: newCatColor === color ? (isDark ? '#fff' : '#121212') : 'transparent',
                    }}
                  >
                    {newCatColor === color && <Check size={16} color="#fff" />}
                  </Pressable>
                ))}
              </View>

              {/* Create button */}
              <Pressable
                onPress={handleAddCategory}
                disabled={!newCatName.trim()}
                style={{
                  paddingVertical: 18, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: !newCatName.trim() ? (isDark ? '#27272a' : '#f3f4f6') : '#FF5A00',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '900', color: !newCatName.trim() ? (isDark ? '#52525b' : '#9ca3af') : '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Create Category
                </Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Log Action Sheet */}
      <LogActionSheet
        visible={selectedActionLogId !== null}
        onClose={() => setSelectedActionLogId(null)}
        onEdit={() => {
          if (selectedActionLogId) {
            router.push({ pathname: '/modal', params: { editId: selectedActionLogId } });
            setSelectedActionLogId(null);
          }
        }}
        onDuplicate={() => {
          if (selectedActionLogId) {
            duplicateActivity(selectedActionLogId);
            setSelectedActionLogId(null);
          }
        }}
        onDelete={() => {
          if (selectedActionLogId) {
            deleteActivity(selectedActionLogId);
            setSelectedActionLogId(null);
          }
        }}
      />
    </SafeAreaView>
  );
}
