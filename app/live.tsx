import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Clock, 
  Tag, 
  Zap,
  Check,
  Briefcase,
  Heart,
  BookOpen,
  Coffee
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTracking, Category } from '@/context/TrackingContext';
import { useColorScheme } from 'nativewind';
import { CategoryIcon } from '@/components/CategoryIcon';

export default function LiveSessionPage() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { startTracker, categories } = useTracking();
  
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [category, setCategory] = useState('work');

  const handleStart = async () => {
    if (!title) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const plannedSecs = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    const description = plannedSecs > 0 ? `Target: ${Math.floor(plannedSecs/60)}m ${plannedSecs%60}s` : undefined;
    
    await startTracker(title, category, description, plannedSecs);
    router.replace('/tracker');
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center mb-8">
            <Pressable 
              onPress={() => router.back()}
              className="w-12 h-12 items-center justify-center rounded-[16px] bg-gray-50 dark:bg-zinc-900 mr-4"
            >
              <ArrowLeft size={24} color={isDark ? '#fff' : '#121212'} />
            </Pressable>
            <Text className="text-[28px] font-black text-klowk-black dark:text-white">Live Session</Text>
          </View>
          
          {/* Title Input */}
          <View className="mb-8">
            <View className="flex-row items-center mb-3">
              <Zap size={14} color="#FF5A00" />
              <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Focus Target</Text>
            </View>
            <View className="bg-gray-50 dark:bg-zinc-900 rounded-[20px] border border-gray-100 dark:border-zinc-800">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What are you working on?"
                placeholderTextColor={isDark ? '#3f3f46' : '#9ca3af'}
                className="p-5 text-base font-bold text-klowk-black dark:text-white"
              />
            </View>
          </View>

          {/* Duration Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <Clock size={14} color="#9ca3af" />
              <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Duration</Text>
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <TextInput
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? '#3f3f46' : '#d1d5db'}
                  className="bg-gray-50 dark:bg-zinc-900 py-4.5 rounded-[20px] text-base font-black text-klowk-black dark:text-white text-center border border-gray-100 dark:border-zinc-800"
                />
                <Text className="text-center mt-2 text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">Hrs</Text>
              </View>
              <View className="flex-1">
                <TextInput
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? '#3f3f46' : '#d1d5db'}
                  className="bg-gray-50 dark:bg-zinc-900 py-4.5 rounded-[20px] text-base font-black text-klowk-black dark:text-white text-center border border-gray-100 dark:border-zinc-800"
                />
                <Text className="text-center mt-2 text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">Min</Text>
              </View>
              <View className="flex-1">
                <TextInput
                  value={seconds}
                  onChangeText={setSeconds}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? '#3f3f46' : '#d1d5db'}
                  className="bg-gray-50 dark:bg-zinc-900 py-4.5 rounded-[20px] text-base font-black text-klowk-black dark:text-white text-center border border-gray-100 dark:border-zinc-800"
                />
                <Text className="text-center mt-2 text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">Sec</Text>
              </View>
            </View>
          </View>

          {/* Category Selection */}
          <View className="mb-10">
            <View className="flex-row items-center mb-4">
              <Tag size={14} color="#9ca3af" />
              <Text className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Category</Text>
            </View>
            <View className="flex-row flex-wrap gap-2.5">
              {categories.map((cat: Category) => {
                const isSelected = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setCategory(cat.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={`px-4 py-2.5 rounded-xl flex-row items-center border ${isSelected ? 'border-transparent' : 'border-gray-50 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900'}`}
                    style={{ backgroundColor: isSelected ? cat.color : undefined }}
                  >
                    <CategoryIcon name={cat.iconName} size={14} color={isSelected ? '#fff' : cat.color} />
                    <Text className={`ml-2 text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Start Button */}
        <View className="p-6 border-t border-gray-50 dark:border-zinc-900 bg-white dark:bg-klowk-black">
          <Pressable 
            onPress={handleStart}
            disabled={!title}
            className={`py-5 rounded-[24px] flex-row items-center justify-center shadow-lg ${!title ? 'bg-gray-100 dark:bg-zinc-900' : 'bg-klowk-black dark:bg-white'}`}
          >
            <Check size={20} color={!title ? '#9ca3af' : (isDark ? '#121212' : '#fff')} className="mr-3" />
            <Text className={`font-black uppercase tracking-wider ${!title ? 'text-gray-400' : (isDark ? 'text-klowk-black' : 'text-white')}`}>Launch Focus</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
