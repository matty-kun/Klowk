import { Text, View } from '@/components/Themed';
import { CATEGORIES } from '@/constants/Categories';
import { useTracking } from '@/context/TrackingContext';
import { formatDate, formatDuration, formatLiveDuration, formatTimestamp } from '@/utils/time';
import * as Haptics from 'expo-haptics';
import {
  BookOpen,
  Briefcase,
  Coffee,
  Heart,
  History,
  MoreHorizontal,
  Tag,
  Trophy,
  Zap
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function TabOneScreen() {
  const { activities, currentActivity, startTracker, stopTracker, getTotalFocusTimeToday, addManualActivity } = useTracking();
  const [activityTitle, setActivityTitle] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());
  const [isParsing, setIsParsing] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'week' | 'month'>('day');

  // Calculate stats for Period Toggle
  const now = new Date();
  
  const todayMinsTotal = activities
    .filter(a => new Date(a.start_time).toDateString() === now.toDateString())
    .reduce((sum, a) => sum + (a.duration || 0), 0);
    
  const weekMinsTotal = activities
    .filter(a => a.start_time >= now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, a) => sum + (a.duration || 0), 0);
    
  const monthMinsTotal = activities
    .filter(a => a.start_time >= now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .reduce((sum, a) => sum + (a.duration || 0), 0);

  const displayMins = ({
    day: todayMinsTotal,
    week: weekMinsTotal,
    month: monthMinsTotal
  }[summaryPeriod]) || 0;

  // Dynamic Chart Data logic (Last 7 Days)
  const dailyChartData = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const label = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const mins = activities
      .filter(a => new Date(a.start_time).toDateString() === dayStr)
      .reduce((sum, a) => sum + (a.duration || 0), 0);
    return { mins, label };
  });
  
  const maxWeeklyMins = Math.max(...dailyChartData.map(d => d.mins), 1);


  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentActivity) {
      setNowMs(Date.now());
      interval = setInterval(() => setNowMs(Date.now()), 1000);
    }
    return () => clearInterval(interval);
  }, [currentActivity]);

  const totalHoursToday = (getTotalFocusTimeToday() / 60).toFixed(1);

  const handleStartTracker = async () => {
    if (currentActivity) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalTitle = activityTitle.trim() || 'Untitled Session';
    await startTracker(finalTitle, 'Uncategorized');
    setActivityTitle('');
  };

  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const dayOfMonth = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date());

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        
        {/* Top Header Utilities */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-transparent">
          <View className="flex-row">
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-2 shadow-sm border border-gray-100">
              <History size={18} color="#121212" />
            </View>
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
              <Zap size={18} color="#121212" />
            </View>
          </View>
          <Pressable className="bg-white px-4 py-2 rounded-full flex-row items-center border border-gray-100 shadow-sm active:opacity-70">
            <Trophy size={16} color="#FF5A00" />
            <Text className="ml-2 font-bold text-klowk-black">Goal</Text>
          </Pressable>
        </View>

        {/* Greeting Section */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
            {dayOfWeek}, {dayOfMonth}
          </Text>
          <Text className="text-3xl font-black text-klowk-black">
            Good afternoon, <Text className="text-klowk-orange">User!</Text>
          </Text>
        </View>

        {/* Mascot Section with Brand Band */}
        <View className="mb-10 relative">
          {/* Background Brand Band - Cut in half */}
          <View className="absolute top-0 left-0 right-0 h-1/2 bg-klowk-orange/10" />
          
          <View className="px-6 py-6 flex-row items-center">
            {/* Mascot Icon Container */}
            <View className="w-16 h-16 bg-klowk-black rounded-2xl items-center justify-center mr-4 shadow-lg">
              <Zap color="#FF5A00" size={32} />
            </View>

            {/* Speech Bubble */}
            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm relative">
              <Text className="font-extrabold text-klowk-orange text-[10px] mb-1 uppercase tracking-widest leading-3">Klowk Bird</Text>
              <Text className="text-[11px] text-klowk-black font-semibold leading-4">
                {todayMinsTotal > 0 
                  ? `Great progress! You've logged ${formatDuration(todayMinsTotal)} of focus today. Keep that momentum!`
                  : "You haven't logged any focus time today. Want to start a session now?"}
              </Text>
              {/* Little speech bubble tail */}
              <View className="absolute left-[-6] top-6 w-3 h-3 bg-white rotate-45 border-l border-b border-gray-50" />
            </View>
          </View>
        </View>

        {/* Analytics Section Row */}
        <View className="px-6 flex-row justify-between mb-6">
          {/* Last 7 Days Dynamic Heat Chart */}
          <View className="w-[48%] bg-white rounded-3xl p-4 shadow-sm border border-gray-50">
            <Text className="text-[10px] uppercase font-bold text-gray-400 mb-3">Intensity</Text>
            <View className="flex-row items-end justify-between h-20">
              {dailyChartData.map((item, i) => {
                const intensity = (item.mins / maxWeeklyMins) || 0;
                const height = Math.max(12, intensity * 60);

                return (
                  <View key={i} className="items-center flex-1">
                    <View 
                      style={{ 
                        height: height,
                        backgroundColor: intensity > 0.05 ? `rgba(255, 90, 0, ${0.15 + intensity * 0.85})` : '#f3f4f6'
                      }} 
                      className={`w-2.5 rounded-full`} 
                    />
                    <Text className="text-[8px] mt-2 text-gray-300 font-bold">{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Today Summary Card */}
          <View className="w-[48%] bg-white rounded-3xl p-4 shadow-sm border border-gray-50 justify-between">
            <View>
              <Text className="text-[10px] uppercase font-bold text-gray-400 mb-1">Today</Text>
              <View className="flex-row items-baseline mb-2">
                <Text className="text-5xl font-black text-klowk-black italic pr-4">{(todayMinsTotal / 60).toFixed(1)}</Text>
                <Text className="text-[10px] font-bold text-gray-400">HRS</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-klowk-orange mr-2" />
            </View>
          </View>
        </View>

        {/* Action / Tracker Card - Only show when LIVE */}
        {currentActivity && (
          <View className="px-6 mb-8">
             <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 italic">
                <View className="items-center">
                   <Text className="text-klowk-orange font-bold text-lg mb-1">{currentActivity.title}</Text>
                   <Text className="text-4xl font-black text-klowk-black mb-4" style={{ fontFamily: 'SpaceMono' }}>
                     {formatLiveDuration(currentActivity.start_time, nowMs)}
                   </Text>
                   <Pressable 
                    onPress={stopTracker}
                    className="w-full bg-klowk-black py-4 rounded-2xl items-center"
                   >
                     <Text className="text-white font-bold">Stop Timer</Text>
                   </Pressable>
                </View>
             </View>
          </View>
        )}



        {/* Recent Logs List Title */}
        <View className="px-6 mb-4">
             <Text className="text-[10px] font-black text-klowk-orange uppercase tracking-widest">LOGS</Text>
        </View>

        {/* Recent Logs List */}
        <View className="px-6 mb-32">
          {activities.slice(0, 5).map((log) => {
            const category = CATEGORIES.find(c => c.id === log.category);
            const catColor = category?.color || '#6b7280';
            const Icon = {
              briefcase: Briefcase,
              heart: Heart,
              'book-open': BookOpen,
              coffee: Coffee,
              'more-horizontal': MoreHorizontal,
            }[category?.iconName as string] || Tag;

            return (
              <View key={log.id} className="bg-white rounded-[24px] p-4 mb-3 flex-row items-center shadow-sm border border-gray-50">
                <View 
                  style={{ backgroundColor: `${catColor}15` }} 
                  className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                >
                   <Icon size={18} color={catColor} />
                </View>
                <View className="flex-1">
                   <Text className="font-bold text-klowk-black" numberOfLines={1}>{log.title}</Text>
                   <View className="flex-row items-center">
                    <Text style={{ color: catColor }} className="text-[10px] font-black uppercase tracking-tighter mr-2">
                      {category?.label || 'Personal'}
                    </Text>
                    <Text className="text-[8px] text-gray-400 font-bold uppercase">{formatDate(log.start_time)} • {formatTimestamp(log.start_time)}</Text>
                   </View>
                </View>
                <Text className="font-black text-klowk-black">{formatDuration(log.duration || 0)}</Text>
              </View>
            );
          })}
          
          {/* Bottom Spacer for Floating Navbar */}
          <View className="h-32 bg-transparent" />
        </View>

      </ScrollView>

    </SafeAreaView>
  );
}
