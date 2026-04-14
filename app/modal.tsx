import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { 
  ArrowLeft, 
  Wand2, 
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
import { useTracking } from '@/context/TrackingContext';
import { parseNaturalLanguage } from '@/services/nlp';
import { CATEGORIES } from '@/constants/Categories';

export default function EntryModal() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const { addManualActivity, startTracker, editActivity, activities } = useTracking();
  
  // Form State
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('work');
  const [description, setDescription] = useState('');

  // Initial Data Population for Edit Mode
  useEffect(() => {
    if (editId) {
      const activityToEdit = activities.find(a => a.id === Number(editId));
      if (activityToEdit) {
        setTitle(activityToEdit.title);
        setCategory(activityToEdit.category || 'work');
        setDescription(activityToEdit.description || '');
        setDate(new Date(activityToEdit.start_time));
        if (activityToEdit.duration) {
          setHours(Math.floor(activityToEdit.duration / 60).toString());
          setMinutes((activityToEdit.duration % 60).toString());
        }
      }
    }
  }, [editId]);
  
  // Custom Calendar Logic (Restored)
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
    
    const totalMins = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    
    if (editId && typeof editId === 'string') {
      await editActivity(Number(editId), title, category, totalMins, description, date);
    } else if (totalMins > 0) {
      await addManualActivity(title, category, totalMins, description, date);
    } else {
      await startTracker(title, category, description);
    }
    
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Header Area: Back Button + Title Linked */}
          <View className="flex-row items-center mb-8">
            <Pressable 
              onPress={() => router.back()}
              className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50 mr-4"
            >
              <ArrowLeft size={24} color="#121212" />
            </Pressable>

            <View className="flex-1">
              <Text className="text-3xl font-black text-klowk-black italic">{editId ? 'Edit Log' : 'New Log'}</Text>
            </View>
          </View>
          
          {/* Form Fields */}
          <View className="mb-8">
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">Manual Details</Text>
            
            {/* Title with Integrated AI */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2 ml-1">
                <Zap size={14} color="#9ca3af" />
                <Text className="ml-2 text-xs font-bold text-gray-500">What did you do?</Text>
              </View>
              <View className="bg-gray-50 rounded-2xl border border-gray-100 flex-row items-center">
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What are you focusing on?"
                  className="flex-1 p-4 font-bold text-klowk-black"
                />
              </View>
            </View>

            {/* Duration & Date Row */}
            <View className="flex-row mb-5" style={{ gap: 10 }}>
              <View className="flex-1">
                <View className="flex-row items-center mb-2 ml-1">
                  <Clock size={14} color="#9ca3af" />
                  <Text className="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hours</Text>
                </View>
                <TextInput
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  placeholder="0"
                  className="bg-gray-50 px-3 py-4 rounded-2xl font-bold text-klowk-black border border-gray-100 h-[58px] text-sm"
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-2 ml-1">
                  <Clock size={14} color="#9ca3af" />
                  <Text className="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Minutes</Text>
                </View>
                <TextInput
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                  placeholder="30"
                  className="bg-gray-50 px-3 py-4 rounded-2xl font-bold text-klowk-black border border-gray-100 h-[58px] text-sm"
                />
              </View>
              <View className="flex-[1.2]">
                <View className="flex-row items-center mb-2 ml-1">
                  <CalendarIcon size={14} color="#9ca3af" />
                  <Text className="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</Text>
                </View>
                <Pressable 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker(!showDatePicker);
                  }}
                  className={`bg-gray-50 px-3 py-4 rounded-2xl border items-center justify-center flex-1 h-[58px] ${showDatePicker ? 'border-klowk-orange' : 'border-gray-100'}`}
                >
                  <Text className="font-bold text-klowk-black text-sm" numberOfLines={1}>
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Modal
              visible={showDatePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <Pressable 
                className="flex-1 bg-klowk-black/40 items-center justify-center px-6"
                onPress={() => setShowDatePicker(false)}
              >
                <Pressable className="w-full bg-white p-6 rounded-[32px] shadow-2xl" onPress={(e) => e.stopPropagation()}>
                  {/* Calendar Header */}
                  <View className="flex-row items-center mb-6">
                    <Pressable onPress={() => changeMonth(-1)} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl">
                      <ChevronLeft size={18} color="#FF5A00" />
                    </Pressable>
                    <View className="flex-1 items-center">
                      <Text className="font-black text-lg text-klowk-black italic text-center leading-5">{monthName}</Text>
                      <Text className="text-[9px] font-black text-gray-400 uppercase tracking-[2px] text-center">{yearName}</Text>
                    </View>
                    <Pressable onPress={() => changeMonth(1)} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl">
                      <ChevronRight size={18} color="#FF5A00" />
                    </Pressable>
                  </View>

                  {/* Days Grid - Strict 7-column layout */}
                  <View className="flex-row flex-wrap">
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <Text key={i} className="w-[14.2%] text-center text-[9px] font-black text-gray-300 mb-4">{d}</Text>
                    ))}
                    {days.map((d, i) => {
                      const isSelected = d && d.toDateString() === date.toDateString();
                      const isToday = d && d.toDateString() === new Date().toDateString();

                      return (
                        <Pressable 
                          key={i} 
                          onPress={() => {
                            if (d) {
                              setDate(d);
                              setShowDatePicker(false);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }
                          }}
                          className={`w-[14.2%] aspect-square items-center justify-center rounded-xl mb-1 ${isSelected ? 'bg-klowk-orange shadow-lg shadow-klowk-orange/40' : ''} ${!d ? 'opacity-0' : ''}`}
                        >
                          <Text className={`font-black text-sm ${isSelected ? 'text-white' : (isToday ? 'text-klowk-orange' : 'text-klowk-black')}`}>
                            {d ? d.getDate() : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable 
                    onPress={() => setShowDatePicker(false)}
                    className="mt-4 py-2 items-center"
                  >
                    <Text className="text-gray-300 font-bold text-[10px] uppercase tracking-widest">Close</Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Description */}
            <View className="mb-8">
              <View className="flex-row items-center mb-2 ml-1">
                <AlignLeft size={14} color="#9ca3af" />
                <Text className="ml-2 text-xs font-bold text-gray-500">Description (Optional)</Text>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="How did it go? Any notes?"
                multiline
                numberOfLines={3}
                className="bg-gray-50 p-4 rounded-2xl font-bold text-klowk-black border border-gray-100 h-24"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Category Selection */}
            <View className="mb-8">
              <View className="flex-row items-center mb-3 ml-1">
                <Tag size={14} color="#9ca3af" />
                <Text className="ml-2 text-xs font-bold text-gray-500">Category</Text>
              </View>
              <View className="flex-row flex-wrap">
                {CATEGORIES.map((cat) => {
                  const Icon = {
                    briefcase: Briefcase,
                    heart: Heart,
                    'book-open': BookOpen,
                    coffee: Coffee,
                    'more-horizontal': MoreHorizontal,
                  }[cat.iconName as string] || Tag;

                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setCategory(cat.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{ 
                        backgroundColor: category === cat.id ? cat.color : '#f9fafb',
                        borderColor: category === cat.id ? cat.color : '#f3f4f6'
                      }}
                      className="px-4 py-2 rounded-full mr-2 mb-2 border flex-row items-center"
                    >
                      <Icon size={12} color={category === cat.id ? 'white' : cat.color} style={{ marginRight: 6 }} />
                      <Text 
                        style={{ color: category === cat.id ? 'white' : '#6b7280' }}
                        className="text-xs font-bold"
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Removed Live/Past Toggle */}

          </View>
        </ScrollView>

        {/* Action Button */}
        <View className="px-6 py-4 bg-white shadow-xl border-t border-gray-100">
          <Pressable 
            onPress={handleSave}
            disabled={!title}
            className={`w-full py-5 rounded-[24px] items-center flex-row justify-center ${!title ? 'bg-gray-200' : 'bg-klowk-black'}`}
          >
            <Check size={20} color={!title ? '#9ca3af' : 'white'} strokeWidth={3} style={{ marginRight: 8 }} />
            <Text className={`font-black uppercase tracking-tighter ${!title ? 'text-gray-400' : 'text-white'}`}>
              {editId ? 'Save Changes' : ((parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0) > 0 ? 'Save Time Entry' : 'Launch Focus Session')}
            </Text>
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
