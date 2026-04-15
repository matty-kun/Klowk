import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Clock, 
  Calendar as CalendarIcon, 
  Tag, 
  AlignLeft, 
  Zap,
  Check,
  Briefcase,
  Heart,
  BookOpen,
  Coffee,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTracking, Activity, Category } from '@/context/TrackingContext';
import { useColorScheme } from 'nativewind';
import { CategoryIcon } from '@/components/CategoryIcon';

export default function EntryModal() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const { addManualActivity, startTracker, editActivity, activities, categories } = useTracking();
  
  // Form State
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('work');
  const [description, setDescription] = useState('');

  // Initial Data Population for Edit Mode
  useEffect(() => {
    if (editId) {
      const activityToEdit = activities.find((a: Activity) => a.id === Number(editId));
      if (activityToEdit) {
        setTitle(activityToEdit.title);
        setCategory(activityToEdit.category || 'work');
        setDescription(activityToEdit.description || '');
        setDate(new Date(activityToEdit.start_time));
        if (activityToEdit.duration) {
          setHours(Math.floor(activityToEdit.duration / 3600).toString());
          setMinutes(Math.floor((activityToEdit.duration % 3600) / 60).toString());
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
  const monthName = viewedMonth.toLocaleString('default', { month: 'long' });
  const yearName = viewedMonth.getFullYear();

  const changeMonth = (offset: number) => {
    const newMonth = new Date(viewedMonth.setMonth(viewedMonth.getMonth() + offset));
    setViewedMonth(new Date(newMonth));
  };
  
  const handleSave = async () => {
    if (!title) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const totalSecs = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    
    if (editId && typeof editId === 'string') {
      await editActivity(Number(editId), title, category, totalSecs, description, date);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Header Area */}
          <View className="flex-row items-center mb-8">
            <Pressable 
              onPress={() => router.back()}
              className="w-12 h-12 items-center justify-center rounded-[16px] bg-gray-50 dark:bg-zinc-900 mr-4"
            >
              <ArrowLeft size={24} color={colorScheme === 'dark' ? '#fff' : '#121212'} />
            </Pressable>
            <Text className="text-[28px] font-black text-klowk-black dark:text-white">{editId ? 'Edit Log' : 'New Log'}</Text>
          </View>
          
          {/* Form Fields */}
          <View className="mb-8">
            <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Manual Details</Text>
            
            {/* Title */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Zap size={14} color="#9ca3af" />
                <Text className="ml-2 text-xs font-bold text-gray-500 dark:text-gray-400">What did you do?</Text>
              </View>
              <View className="bg-gray-50 dark:bg-zinc-900 rounded-[20px] border border-gray-100 dark:border-zinc-800">
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What are you focusing on?"
                  placeholderTextColor={colorScheme === 'dark' ? '#3f3f46' : '#d1d5db'}
                  className="p-4 text-base font-bold text-klowk-black dark:text-white"
                />
              </View>
            </View>

            {/* Duration Row */}
            <View className="flex-row gap-2 mb-5">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Clock size={12} color="#9ca3af" />
                  <Text className="ml-1 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Hrs</Text>
                </View>
                <TextInput
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colorScheme === 'dark' ? '#3f3f46' : '#d1d5db'}
                  className="bg-gray-50 dark:bg-zinc-900 h-[54px] rounded-2xl text-sm font-black text-klowk-black dark:text-white text-center border border-gray-100 dark:border-zinc-800"
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Clock size={12} color="#9ca3af" />
                  <Text className="ml-1 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Min</Text>
                </View>
                <TextInput
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colorScheme === 'dark' ? '#3f3f46' : '#d1d5db'}
                  className="bg-gray-50 dark:bg-zinc-900 h-[54px] rounded-2xl text-sm font-black text-klowk-black dark:text-white text-center border border-gray-100 dark:border-zinc-800"
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Clock size={12} color="#9ca3af" />
                  <Text className="ml-1 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Sec</Text>
                </View>
                <TextInput
                  value={seconds}
                  onChangeText={setSeconds}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colorScheme === 'dark' ? '#3f3f46' : '#d1d5db'}
                  className="bg-gray-50 dark:bg-zinc-900 h-[54px] rounded-2xl text-sm font-black text-klowk-black dark:text-white text-center border border-gray-100 dark:border-zinc-800"
                />
              </View>
              <View className="flex-[1.2]">
                <View className="flex-row items-center mb-2">
                  <CalendarIcon size={12} color="#9ca3af" />
                  <Text className="ml-1 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Date</Text>
                </View>
                <Pressable 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker(true);
                  }}
                  className="bg-gray-50 dark:bg-zinc-900 h-[54px] rounded-2xl border border-gray-100 dark:border-zinc-800 items-center justify-center"
                >
                  <Text className="text-xs font-bold text-klowk-black dark:text-white">
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Modal visible={showDatePicker} transparent animationType="fade">
              <Pressable className="flex-1 bg-black/40 items-center justify-center p-6" onPress={() => setShowDatePicker(false)}>
                <Pressable className="w-full bg-white dark:bg-zinc-900 p-6 rounded-[32px]" onPress={e => e.stopPropagation()}>
                  <View className="flex-row items-center mb-6">
                    <Pressable onPress={() => changeMonth(-1)} className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-xl">
                      <ChevronLeft size={18} color="#FF5A00" />
                    </Pressable>
                    <View className="flex-1 items-center">
                      <Text className="text-center font-black text-lg text-klowk-black dark:text-white">{monthName}</Text>
                      <Text className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{yearName}</Text>
                    </View>
                    <Pressable onPress={() => changeMonth(1)} className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-xl">
                      <ChevronRight size={18} color="#FF5A00" />
                    </Pressable>
                  </View>
                  <View className="flex-row flex-wrap">
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <Text key={i} className="w-[14.2%] text-center text-[9px] font-black text-gray-300 dark:text-zinc-700 mb-4">{d}</Text>
                    ))}
                    {days.map((d, i) => (
                      <Pressable 
                        key={i} 
                        onPress={() => { if(d){ setDate(d); setShowDatePicker(false); }}}
                        className={`w-[14.2%] aspect-square rounded-xl items-center justify-center mb-1 ${d?.toDateString() === date.toDateString() ? 'bg-klowk-orange' : ''}`}
                      >
                        <Text className={`font-black ${d?.toDateString() === date.toDateString() ? 'text-white' : (d?.toDateString() === new Date().toDateString() ? 'text-klowk-orange' : 'text-klowk-black dark:text-zinc-400')}`}>
                          {d ? d.getDate() : ''}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Description */}
            <View className="mb-6">
              <View className="flex-row items-center mb-2">
                <AlignLeft size={14} color="#9ca3af" />
                <Text className="ml-2 text-xs font-bold text-gray-500 dark:text-gray-400">Description (Optional)</Text>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="How did it go?"
                placeholderTextColor={colorScheme === 'dark' ? '#3f3f46' : '#d1d5db'}
                multiline
                numberOfLines={3}
                className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-[20px] border border-gray-100 dark:border-zinc-800 h-[100px] text-left text-sm font-bold text-klowk-black dark:text-white"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Category */}
            <View className="mb-8">
              <View className="flex-row items-center mb-3">
                <Tag size={14} color="#9ca3af" />
                <Text className="ml-2 text-xs font-bold text-gray-500 dark:text-gray-400">Category</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((cat: Category) => {
                  const isSelected = category === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCategory(cat.id);
                      }}
                      className={`px-4 py-2.5 rounded-xl flex-row items-center border ${isSelected ? 'border-transparent' : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900'}`}
                      style={{ backgroundColor: isSelected ? cat.color : undefined }}
                    >
                      <CategoryIcon name={cat.iconName} size={12} color={isSelected ? '#fff' : cat.color} />
                      <Text className={`ml-2 text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{cat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View className="p-6 border-t border-gray-50 dark:border-zinc-900 bg-white dark:bg-klowk-black">
          <Pressable 
            onPress={handleSave}
            disabled={!title}
            className={`py-5 rounded-[24px] flex-row items-center justify-center ${!title ? 'bg-gray-100 dark:bg-zinc-900' : 'bg-klowk-black dark:bg-white'}`}
          >
            <Check size={20} color={!title ? '#939393' : (colorScheme === 'dark' ? '#121212' : '#fff')} className="mr-3" />
            <Text className={`font-black uppercase ${!title ? 'text-gray-400' : (colorScheme === 'dark' ? 'text-zinc-900' : 'text-white')}`}>
              {editId ? 'Save Changes' : ( (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 > 0 ? 'Save Entry' : 'Launch Session')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
