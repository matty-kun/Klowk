import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Modal, TextInput, Animated, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, Trophy, Flame, Plus, X, Calendar as CalendarIcon, Clock, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTracking, Activity, Category, CustomGoal } from '@/context/TrackingContext';
import { CategoryIcon } from '@/components/CategoryIcon';
import LogActionSheet from '@/components/LogActionSheet';
import * as Haptics from 'expo-haptics';
import { View as MotiView } from 'moti';

const { width, height } = Dimensions.get('window');

export default function GoalsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { activities, categories, customGoals, addCustomGoal, editCustomGoal, deleteCustomGoal } = useTracking();

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [goalName, setGoalName] = useState('');
  const [targetHrs, setTargetHrs] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  
  const [startDate, setStartDate] = useState(new Date());
  
  const initialEndDate = new Date();
  initialEndDate.setDate(initialEndDate.getDate() + 7);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Calendar State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateType, setActiveDateType] = useState<'start' | 'end' | null>(null);
  const [viewedMonth, setViewedMonth] = useState(new Date());

  // Action Sheet State
  const [selectedActionGoalId, setSelectedActionGoalId] = useState<string | null>(null);

  const sheetSlide = useRef(new Animated.Value(800)).current;
  const sheetBackdrop = useRef(new Animated.Value(0)).current;

  // Auto-select first category if available
  useEffect(() => {
    if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories, selectedCatId]);

  // Helpers
  const formatHrs = (mins: number) => (mins / 60).toFixed(1).replace('.0', '');

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
      setGoalName('');
      setTargetHrs('');
      setStartDate(new Date());
      const endD = new Date();
      endD.setDate(endD.getDate() + 7);
      setEndDate(endD);
    }

    setShowAddModal(true);
    Animated.parallel([
      Animated.timing(sheetBackdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheetSlide, { toValue: 0, tension: 40, friction: 9, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetBackdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetSlide, { toValue: 800, duration: 220, useNativeDriver: true }),
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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeSheet();
  };

  // Gamification Streak (Placeholder based on general activity)
  const currentStreak = useMemo(() => {
     if (activities.length === 0) return 0;
     return 1; // Simplistic active streak
  }, [activities]);

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysArr = [];
    for (let i = 0; i < firstDay; i++) daysArr.push(null);
    for (let i = 1; i <= daysInMonth; i++) daysArr.push(new Date(year, month, i));
    return daysArr;
  };
  const calendarDays = getDaysInMonth(viewedMonth);
  const calendarMonthName = viewedMonth.toLocaleString('default', { month: 'long' });
  const calendarYearName = viewedMonth.getFullYear();
  const changeMonth = (offset: number) => {
    const newMonth = new Date(viewedMonth.setMonth(viewedMonth.getMonth() + offset));
    setViewedMonth(new Date(newMonth));
  };


  // Render Empty State
  if (customGoals.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]" edges={['top']}>
        <View className="flex-row items-center justify-between mb-6 mt-8 px-6">
          <Text className="text-4xl font-black text-[#121212] dark:text-white">Goals</Text>
        </View>

        <View className="flex-1 items-center justify-center px-10 pb-20">
          <View className="w-24 h-24 bg-[#FF5A00]/10 rounded-full items-center justify-center mb-8">
            <Target size={48} color="#FF5A00" strokeWidth={1.5} />
          </View>
          <Text className="text-2xl font-black text-[#121212] dark:text-white mb-3 text-center">No Goals Yet</Text>
          <Text className="text-[14px] font-bold text-gray-400 dark:text-zinc-500 text-center mb-10 leading-6">
            Track your progress on long term projects bounded by dates and limits.
          </Text>

          <Pressable 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openSheet(); }}
            className="w-full bg-[#FF5A00] py-4 rounded-[20px] items-center justify-center shadow-lg shadow-[#FF5A00]/30"
          >
            <Text className="text-white font-black text-[15px] tracking-wider uppercase">Create New Goal</Text>
          </Pressable>
        </View>

        {renderAddGoalModal()}
      </SafeAreaView>
    );
  }

  // Render Actual Goals UI
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]" edges={['top']}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6 mt-8">
          <Text className="text-4xl font-black text-[#121212] dark:text-white">Goals</Text>
          <Pressable 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openSheet(); }}
            className="w-10 h-10 bg-[#FF5A00]/10 rounded-full items-center justify-center"
          >
            <Plus size={20} color="#FF5A00" strokeWidth={3} />
          </Pressable>
        </View>

        {/* The Streak */}
        <View className="mb-6">
          <Text className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-zinc-500 mb-3 ml-1">
            Activity
          </Text>
          <MotiView 
              from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100 }}
              className="w-full bg-[#FFF5F0] dark:bg-[#2A1608] p-5 rounded-[28px] flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 bg-white dark:bg-[#1A0D05] rounded-[18px] items-center justify-center mr-4 shadow-sm">
                <Flame size={28} color="#f43f5e" fill="#f43f5e" />
              </View>
              <View>
                <Text className="text-[13px] font-bold text-[#f43f5e] uppercase tracking-wider mb-0.5">Focus Streak</Text>
                <Text className="text-2xl font-black text-[#121212] dark:text-white leading-tight">
                  {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                </Text>
              </View>
            </View>
          </MotiView>
        </View>

        {/* Custom Goals List */}
        <Text className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-zinc-500 mb-3 ml-1">
          Active Objectives
        </Text>
        <View className="gap-4">
          {customGoals.map((goal, idx) => {
            const catData = categories.find((c: Category) => c.id === goal.categoryId);
            if (!catData) return null;

            // Calculate progress for this goal
            const currentMins = activities
              .filter((a: Activity) => a.category === goal.categoryId && a.start_time >= goal.startDate && a.start_time <= goal.endDate)
              .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);

            const pct = Math.min(100, (currentMins / goal.targetMins) * 100) || 0;
            const isCompleted = pct >= 100;

            const daysRemaining = Math.max(0, Math.ceil((goal.endDate - Date.now()) / (1000 * 60 * 60 * 24)));
            
            return (
              <MotiView 
                key={goal.id}
                from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200 + (idx * 50) }}
                className="bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm p-5"
              >
                <View className="flex-row items-center justify-between mb-4">
                   <View className="flex-row items-center flex-1 pr-4">
                      <View style={{ backgroundColor: `${catData.color}15` }} className="w-12 h-12 rounded-[16px] items-center justify-center mr-4">
                         <CategoryIcon name={catData.iconName} size={22} color={catData.color} />
                      </View>
                      <View className="flex-1">
                         <Text className="text-lg font-black text-[#121212] dark:text-white leading-tight mb-1" numberOfLines={1}>
                            {goal.name}
                         </Text>
                         <View className="flex-row items-center">
                            <Text className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-zinc-500">
                               {catData.label}
                            </Text>
                         </View>
                      </View>
                   </View>
                   <View className="items-end">
                      <Pressable 
                        hitSlop={15} 
                        style={{ marginBottom: 4 }}
                        onPress={() => setSelectedActionGoalId(goal.id)}
                      >
                         <MoreHorizontal size={18} color={isDark ? '#52525b' : '#9ca3af'} />
                      </Pressable>
                      <Text className="text-xs font-black text-[#121212] dark:text-white">
                         {formatHrs(currentMins)} <Text className="text-gray-400">/ {formatHrs(goal.targetMins)}h</Text>
                      </Text>
                      <Text className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                        {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Left
                      </Text>
                   </View>
                </View>

                {/* Progress bar line */}
                <View className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <View style={{ width: `${pct}%`, backgroundColor: isCompleted ? '#10b981' : catData.color }} className="h-full rounded-full" />
                </View>
              </MotiView>
            )
          })}
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Action Sheet mapping Note: We re-use LogActionSheet but passing custom handlers */}
      <LogActionSheet
        title="Goal Actions"
        visible={selectedActionGoalId !== null}
        onClose={() => setSelectedActionGoalId(null)}
        onEdit={() => {
          if (selectedActionGoalId) {
            const goalToEdit = customGoals.find(g => g.id === selectedActionGoalId);
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }}
      />

      {renderAddGoalModal()}
    </SafeAreaView>
  );

  function renderAddGoalModal() {
    const isFormValid = goalName.trim() && targetHrs.trim() && !isNaN(parseFloat(targetHrs)) && selectedCatId;

    return (
      <Modal visible={showAddModal} transparent animationType="none" onRequestClose={closeSheet}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)', opacity: sheetBackdrop }}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
          <Animated.View style={{ transform: [{ translateY: sheetSlide }] }}>
            <Pressable onPress={e => e.stopPropagation()} style={{ backgroundColor: isDark ? '#1C1C1E' : '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: 48, maxHeight: height * 0.9 }}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              
                  {/* Sheet header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: isDark ? '#fff' : '#121212' }}>{editId ? 'Edit Goal' : 'New Goal'}</Text>
                    <Pressable
                      onPress={closeSheet}
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#2c2c2e' : '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={18} color={isDark ? '#fff' : '#121212'} />
                    </Pressable>
                  </View>

                  {/* Goal Name Input */}
                  <Text style={{ fontSize: 11, fontWeight: '900', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                    Goal Name
                  </Text>
                  <View style={{ backgroundColor: isDark ? '#2c2c2e' : '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#f3f4f6', marginBottom: 24 }}>
                    <TextInput
                      value={goalName}
                      onChangeText={setGoalName}
                      placeholder="e.g. Feed Klowk"
                      placeholderTextColor={isDark ? '#52525b' : '#d1d5db'}
                      style={{ padding: 18, fontSize: 16, fontWeight: '700', color: isDark ? '#fff' : '#121212' }}
                    />
                  </View>

                  {/* Select Category */}
                  <Text style={{ fontSize: 11, fontWeight: '900', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                    Category
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {categories.map((cat: Category) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => { setSelectedCatId(cat.id); Haptics.selectionAsync(); }}
                          style={{
                             flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14,
                             backgroundColor: selectedCatId === cat.id ? `${cat.color}20` : (isDark ? '#2c2c2e' : '#f9fafb'),
                             borderWidth: 1.5,
                             borderColor: selectedCatId === cat.id ? cat.color : 'transparent',
                          }}
                        >
                          <CategoryIcon name={cat.iconName} size={14} color={selectedCatId === cat.id ? cat.color : (isDark ? '#a1a1aa' : '#9ca3af')} />
                          <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: '700', color: selectedCatId === cat.id ? (isDark ? '#fff' : '#121212') : (isDark ? '#a1a1aa' : '#9ca3af') }}>
                            {cat.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Hours Target Input */}
                  <Text style={{ fontSize: 11, fontWeight: '900', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                    Target
                  </Text>
                  <View style={{ backgroundColor: isDark ? '#2c2c2e' : '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#f3f4f6', marginBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
                     <View style={{ paddingLeft: 18, marginRight: -8 }}>
                        <Clock size={16} color={isDark ? '#52525b' : '#9ca3af'} />
                     </View>
                    <TextInput
                      value={targetHrs}
                      onChangeText={setTargetHrs}
                      placeholder="Total Hours (e.g. 50)"
                      placeholderTextColor={isDark ? '#52525b' : '#d1d5db'}
                      keyboardType="numeric"
                      style={{ flex: 1, padding: 18, fontSize: 16, fontWeight: '700', color: isDark ? '#fff' : '#121212' }}
                    />
                  </View>

                  {/* Date Range Row */}
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                     <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                          Start Date
                        </Text>
                        <Pressable 
                          onPress={() => {
                            setActiveDateType('start');
                            setViewedMonth(startDate);
                            setShowDatePicker(true);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          style={{ backgroundColor: isDark ? '#2c2c2e' : '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#f3f4f6', flexDirection: 'row', alignItems: 'center', height: 50, paddingHorizontal: 14 }}
                        >
                           <CalendarIcon size={14} color={isDark ? '#52525b' : '#9ca3af'} />
                           <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: isDark ? '#fff' : '#121212' }}>
                              {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                           </Text>
                        </Pressable>
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                          End Date
                        </Text>
                        <Pressable 
                          onPress={() => {
                            setActiveDateType('end');
                            setViewedMonth(endDate);
                            setShowDatePicker(true);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          style={{ backgroundColor: isDark ? '#2c2c2e' : '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#f3f4f6', flexDirection: 'row', alignItems: 'center', height: 50, paddingHorizontal: 14 }}
                        >
                           <CalendarIcon size={14} color={isDark ? '#52525b' : '#9ca3af'} />
                           <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: isDark ? '#fff' : '#121212' }}>
                              {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                           </Text>
                        </Pressable>
                     </View>
                  </View>

                  {/* Create button */}
                  <Pressable
                    onPress={handleSaveGoal}
                    disabled={!isFormValid}
                    style={{
                      paddingVertical: 18, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: !isFormValid ? (isDark ? '#2c2c2e' : '#f3f4f6') : '#FF5A00',
                      marginBottom: 16
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '900', color: !isFormValid ? (isDark ? '#71717a' : '#9ca3af') : '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {editId ? 'Save Changes' : 'Save Goal'}
                    </Text>
                  </Pressable>

              </ScrollView>
            </Pressable>
          </Animated.View>
        </Animated.View>
        </KeyboardAvoidingView>

        {/* Custom Date Picker Modal Component */}
        <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }} onPress={() => setShowDatePicker(false)}>
            <Pressable style={{ width: '100%', backgroundColor: isDark ? '#1C1C1E' : '#fff', padding: 24, borderRadius: 32 }} onPress={e => e.stopPropagation()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <Pressable onPress={() => changeMonth(-1)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#2c2c2e' : '#f3f4f6', borderRadius: 12 }}>
                  <ChevronLeft size={18} color="#FF5A00" />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ textAlign: 'center', fontWeight: '900', fontSize: 18, color: isDark ? '#fff' : '#121212' }}>{calendarMonthName}</Text>
                  <Text style={{ textAlign: 'center', fontSize: 10, fontWeight: '700', color: isDark ? '#71717a' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 2 }}>{calendarYearName}</Text>
                </View>
                <Pressable onPress={() => changeMonth(1)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#2c2c2e' : '#f3f4f6', borderRadius: 12 }}>
                  <ChevronRight size={18} color="#FF5A00" />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <Text key={i} style={{ width: '14.2%', textAlign: 'center', fontSize: 9, fontWeight: '900', color: isDark ? '#71717a' : '#d1d5db', marginBottom: 16 }}>{d}</Text>
                ))}
                {calendarDays.map((d, i) => {
                  const targetCompareDate = activeDateType === 'start' ? startDate : endDate;
                  const isSelected = d && d.toDateString() === targetCompareDate.toDateString();
                  const isToday = d && d.toDateString() === new Date().toDateString();
                  
                  return (
                    <Pressable 
                      key={i} 
                      onPress={() => { 
                        if(d){ 
                          if (activeDateType === 'start') setStartDate(d);
                          else setEndDate(d);
                          setShowDatePicker(false); 
                        }
                      }}
                      style={{ 
                        width: '14.2%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
                        backgroundColor: isSelected ? '#FF5A00' : 'transparent'
                      }}
                    >
                      <Text style={{ 
                        fontWeight: '900', 
                        color: isSelected ? '#fff' : (isToday ? '#FF5A00' : (isDark ? '#a1a1aa' : '#121212')) 
                      }}>
                        {d ? d.getDate() : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </Modal>
    );
  }
}
