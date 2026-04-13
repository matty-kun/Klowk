import { Image } from 'expo-image';
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
  Zap,
  Settings2
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Link } from 'expo-router';
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
    const isToday = d.toDateString() === now.toDateString();
    const label = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const mins = activities
      .filter(a => new Date(a.start_time).toDateString() === dayStr)
      .reduce((sum, a) => sum + (a.duration || 0), 0);
    return { mins, label, isToday };
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
        
        <View className="px-6 py-4 flex-row justify-end items-center bg-transparent">
          <Link href="/(tabs)/settings" asChild>
            <Pressable className="bg-white px-4 py-2 rounded-full flex-row items-center border border-gray-100 shadow-sm active:opacity-70">
              <Settings2 size={16} color="#FF5A00" />
              <Text className="ml-2 font-bold text-klowk-black">Settings</Text>
            </Pressable>
          </Link>
        </View>

        {/* Greeting Section */}
        <View className="px-6 mb-10 mt-6 bg-white">
          <Text className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">
            {dayOfWeek}, {dayOfMonth}
          </Text>
          <Text className="text-3xl font-black text-klowk-black mb-8 italic" numberOfLines={1}>
            Good afternoon, <Text className="text-klowk-orange">User!</Text>
          </Text>

          {/* Mascot + Bubble Inline Row */}
          <View className="flex-row items-center bg-white">
            {/* Mascot on the Left - LARGE */}
            <View style={{ width: 130, height: 130, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                source={require('../../assets/images/idle-mascot.svg')} 
                style={{ width: 120, height: 120 }}
                contentFit="contain"
                transition={200}
              />
            </View>

            {/* Inline Bubble on the Right */}
            <View className="flex-1 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative">
               <Text className="text-[12px] text-klowk-black font-semibold leading-5">
                {todayMinsTotal > 0 
                  ? `You've focused for ${formatDuration(todayMinsTotal)} today. Stellar work!`
                  : "Ready for a deep focus session? I'm here to help you track your wins."}
              </Text>
              <View className="absolute left-[-6] top-10 w-4 h-4 bg-white rotate-45 border-l border-b border-gray-100" />
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
                const height = Math.max(12, intensity * 80);

                return (
                  <View key={i} className="items-center flex-1">
                    <View 
                      style={{ 
                        height: height,
                        backgroundColor: item.isToday 
                          ? '#FF5A00' 
                          : (intensity > 0.05 ? `rgba(255, 90, 0, ${0.15 + intensity * 0.7})` : '#f3f4f6')
                      }} 
                      className={`w-2.5 rounded-full ${item.isToday ? 'shadow-lg' : ''}`} 
                    />
                    <Text className={`text-[8px] mt-2 font-bold ${item.isToday ? 'text-klowk-orange' : 'text-gray-300'}`}>
                      {item.label}
                    </Text>
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
