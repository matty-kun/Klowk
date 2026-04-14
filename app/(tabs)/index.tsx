import LogActionSheet from '@/components/LogActionSheet';
import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { CATEGORIES } from '@/constants/Categories';
import { Activity, useTracking } from '@/context/TrackingContext';
import { formatDate, formatDuration, formatLiveDuration, formatLogDuration, formatTimestamp } from '@/utils/time';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Briefcase,
  Coffee,
  Heart,
  MoreHorizontal,
  Settings2,
  Tag
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { View as MotiView } from 'moti';
import { Animated, Dimensions, Pressable, TouchableOpacity, ScrollView, View, Text, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');

export default React.memo(function TabOneScreen() {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const { activities, currentActivity, stopTracker, getTotalFocusTimeToday, deleteActivity, duplicateActivity } = useTracking();
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [toggleWidth, setToggleWidth] = useState(0);
  
  const handleRangeChange = (r: 'today' | 'week' | 'month') => {
    setTimeRange(r);
  };

  const now = new Date();
  
  const getPeriodTotal = (range: 'today' | 'week' | 'month', offset: number = 0) => {
    const ref = new Date(now);
    const startOfRange = new Date(ref);
    const endOfRange = new Date(ref);
    
    if (range === 'today') {
      startOfRange.setDate(ref.getDate() + offset);
      startOfRange.setHours(0,0,0,0);
      endOfRange.setDate(ref.getDate() + offset);
      endOfRange.setHours(23,59,59,999);
    } else if (range === 'week') {
      const day = ref.getDay();
      startOfRange.setDate(ref.getDate() - day + (offset * 7));
      startOfRange.setHours(0,0,0,0);
      endOfRange.setDate(startOfRange.getDate() + 6);
      endOfRange.setHours(23,59,59,999);
    } else if (range === 'month') {
      startOfRange.setMonth(ref.getMonth() + offset, 1);
      startOfRange.setHours(0,0,0,0);
      endOfRange.setMonth(ref.getMonth() + offset + 1, 0);
      endOfRange.setHours(23,59,59,999);
    }
    
    return activities
      .filter((a: Activity) => {
        const t = new Date(a.start_time).getTime();
        return t >= startOfRange.getTime() && t <= endOfRange.getTime();
      })
      .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
  };

  const rangeMinsTotal = React.useMemo(() => getPeriodTotal(timeRange, 0), [timeRange, activities]);
  const prevRangeMinsTotal = React.useMemo(() => getPeriodTotal(timeRange, -1), [timeRange, activities]);
  const trendUp = rangeMinsTotal > prevRangeMinsTotal;
  const isNeutral = rangeMinsTotal === prevRangeMinsTotal;
  const trendColor = isNeutral ? '#121212' : (trendUp ? '#10b981' : '#ef4444');
  
  const todayMinsTotal = React.useMemo(() => activities
    .filter((a: Activity) => new Date(a.start_time).toDateString() === now.toDateString())
    .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0), [activities]);
    
  const dailyChartData = React.useMemo(() => [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = new Date(now);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay() + i);
    const dayStr = d.toDateString();
    const isToday = dayStr === now.toDateString();
    const label = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const mins = activities
      .filter((a: Activity) => new Date(a.start_time).toDateString() === dayStr)
      .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
    return { mins, label, isToday };
  }), [activities]);

  const { dayOfWeek, dayOfMonth, greetingKey } = React.useMemo(() => {
    const d = new Date();
    const w = d.toLocaleDateString(undefined, { weekday: 'long' });
    const m = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
    let gk = 'good_evening';
    if (d.getHours() < 12) gk = 'good_morning';
    else if (d.getHours() < 17) gk = 'good_afternoon';
    return { dayOfWeek: w, dayOfMonth: m, greetingKey: gk };
  }, [activities]);
  
  const maxWeeklyMins = React.useMemo(() => Math.max(...dailyChartData.map(d => d.mins), 1), [dailyChartData]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentActivity) {
      setNowMs(Date.now());
      interval = setInterval(() => setNowMs(Date.now()), 1000);
    }
    return () => clearInterval(interval);
  }, [currentActivity]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        
        {/* Header */}
        <MotiView 
            from={{ opacity: 0, scale: 0.9, translateY: -20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 700 }}
            className="px-6 py-2 mb-2 flex-row justify-end items-center"
        >
          <TouchableOpacity 
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('settings');
            }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full"
          >
            <Settings2 size={20} color={colorScheme === 'dark' ? '#fff' : '#121212'} />
          </TouchableOpacity>
        </MotiView>

        {/* Greeting Section */}
        <View className="px-6 mb-8 mt-3">
            <Text className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-[1.5px] mb-1">
                {dayOfWeek}, {dayOfMonth}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" className="text-[26px] font-black text-klowk-black dark:text-white mb-10">
                {t(greetingKey as any)} <Text className="text-klowk-orange">User!</Text>
            </Text>

            <View className="relative items-center justify-center">
                <View className="absolute -left-6 -right-6 h-[60px] bg-klowk-orange top-[45%]" />
                <View className="flex-row items-center">
                    <View className="w-[130px] h-[130px] mr-2 items-center justify-center">
                        <Image 
                            source={require('../../assets/images/idle-mascot.svg')} 
                            style={{ width: 120, height: 120 }}
                            contentFit="contain"
                        />
                    </View>
                    <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <Text className="text-xs text-klowk-black dark:text-white font-semibold leading-5">
                            {todayMinsTotal > 0 
                            ? t('focus_win').replace('{time}', formatDuration(todayMinsTotal))
                            : t('focus_ready')}
                        </Text>
                        <View className="absolute -left-1.5 top-10 w-4 h-4 bg-white dark:bg-zinc-900 border-l border-b border-gray-100 dark:border-zinc-800 rotate-[45deg]" />
                    </View>
                </View>
            </View>
        </View>

        {/* Analytics Section */}
        <View className="px-6 flex-row justify-between mb-8">
          {/* Intensity Card */}
          <MotiView 
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', delay: 400 }}
            className="w-[48.5%] bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-gray-50 dark:border-zinc-800 shadow-sm"
          >
            <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">{t('intensity')}</Text>
            <View className="flex-row items-end justify-between h-16">
              {dailyChartData.map((item, i) => {
                const intensity = (item.mins / maxWeeklyMins) || 0;
                const barHeight = Math.max(4, intensity * 40);
                return (
                  <View key={i} className="w-[12%] items-center justify-end h-full">
                    <MotiView 
                        from={{ height: 0 }}
                        animate={{ height: barHeight }}
                        transition={{ type: 'spring', delay: 600 + (i * 50) }}
                        style={{ 
                            width: 10, 
                            borderRadius: 5, 
                            backgroundColor: item.isToday ? '#FF5A00' : (intensity > 0.05 ? `rgba(255, 90, 0, ${0.15 + intensity * 0.7})` : (colorScheme === 'dark' ? '#27272a' : '#f3f4f6')) 
                        }} 
                    />
                    <Text className={`mt-2 text-[7px] font-black uppercase ${item.isToday ? 'text-klowk-orange' : 'text-gray-400 dark:text-zinc-600'}`}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </MotiView>

          {/* Summary Card */}
          <MotiView 
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', delay: 400 }}
            className="w-[48.5%] bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-gray-50 dark:border-zinc-800 shadow-sm justify-between"
          >
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {t(timeRange === 'today' ? 'today' : timeRange === 'week' ? 'this_week' : 'this_month')}
                </Text>
                {trendUp ? <ArrowUp size={12} color="#10b981" strokeWidth={3} /> : <ArrowDown size={12} color="#ef4444" strokeWidth={3} />}
              </View>
              <View className="flex-row items-baseline">
                <Text style={{ color: trendColor }} className="text-[34px] font-black">{(rangeMinsTotal / 60).toFixed(1)}</Text>
                <Text className="text-[10px] font-black text-gray-300 dark:text-zinc-600 ml-1">{t('hrs')}</Text>
              </View>
            </View>

            {/* THE TOGGLE */}
            <View 
                onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    if (w > 0) setToggleWidth(w);
                }}
                className="flex-row bg-gray-50 dark:bg-zinc-800 p-1 rounded-[16px] relative overflow-hidden"
            >
                <MotiView 
                    animate={{ 
                        translateX: (timeRange === 'today' ? 0 : timeRange === 'week' ? 1 : 2) * ((toggleWidth - 8) / 3)
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                    style={{ 
                        position: 'absolute', 
                        top: 4, 
                        bottom: 4, 
                        left: 4, 
                        width: (toggleWidth - 8) / 3 || '31.5%', 
                        backgroundColor: colorScheme === 'dark' ? '#3f3f46' : '#fff', 
                        borderRadius: 12, 
                        shadowColor: '#000', 
                        shadowOffset: { width: 0, height: 2 }, 
                        shadowOpacity: 0.05, 
                        shadowRadius: 4, 
                        elevation: 2 
                    }}
                />
                {(['today', 'week', 'month'] as const).map((r) => (
                    <TouchableOpacity 
                        key={r}
                        activeOpacity={0.7}
                        onPress={() => handleRangeChange(r)}
                        className="flex-1 items-center py-2 z-10"
                    >
                        <Text className={`text-[7px] font-black uppercase ${timeRange === r ? 'text-klowk-orange' : 'text-gray-400 dark:text-zinc-500'}`}>{t(r === 'week' ? 'this_week' : r === 'month' ? 'this_month' : 'today')}</Text>
                    </TouchableOpacity>
                ))}
            </View>
          </MotiView>
        </View>

        {/* Logs List */}
        <MotiView 
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 800 }}
            style={{ paddingHorizontal: 24, marginBottom: 16 }}
        >
             <Text style={{ fontSize: 10, fontWeight: '900', color: '#FF5A00', textTransform: 'uppercase', letterSpacing: 2 }}>{t('logs')}</Text>
        </MotiView>

        <View className="px-6 mb-32">
          {activities.slice(0, 5).map((log: Activity) => {
            const category = CATEGORIES.find(c => c.id === log.category);
            const catColor = category?.color || '#6b7280';
            const Icon = { briefcase: Briefcase, heart: Heart, 'book-open': BookOpen, coffee: Coffee }[category?.iconName as string] || Tag;

            return (
              <View key={log.id} className="bg-white dark:bg-zinc-900 rounded-[24px] p-4 mb-3 flex-row items-center border border-gray-50 dark:border-zinc-800 shadow-sm">
                <View style={{ backgroundColor: `${catColor}15` }} className="w-10 h-10 rounded-[12px] items-center justify-center mr-4">
                   <Icon size={18} color={catColor} />
                </View>
                <View className="flex-1">
                   <Text className="font-bold text-klowk-black dark:text-white" numberOfLines={1}>{log.title || t('untitled_session')}</Text>
                   <View className="flex-row items-center">
                    <Text style={{ color: catColor }} className="text-[10px] font-black uppercase mr-2">{t(category?.label.toLowerCase() as any) || t('personal')}</Text>
                    <Text className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase">{formatDate(log.start_time)} • {formatTimestamp(log.start_time)}</Text>
                   </View>
                </View>
                 <View className="items-end ml-4">
                   <Text className="font-black text-klowk-black dark:text-white mb-1">{formatLogDuration(log.start_time, log.end_time, log.duration)}</Text>
                   <Pressable hitSlop={10} onPress={() => setSelectedActionLogId(log.id)} className="p-1">
                     <MoreHorizontal size={16} color="#9ca3af" />
                   </Pressable>
                 </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <LogActionSheet
        visible={selectedActionLogId !== null}
        onClose={() => setSelectedActionLogId(null)}
        onEdit={() => console.log('Edit:', selectedActionLogId)}
        onDuplicate={() => selectedActionLogId && duplicateActivity(selectedActionLogId)}
        onDelete={() => selectedActionLogId && deleteActivity(selectedActionLogId)}
      />
    </SafeAreaView>
  );
});
