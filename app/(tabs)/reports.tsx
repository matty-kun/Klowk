import { Image } from 'expo-image';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Animated, Pressable, Dimensions, View, ScrollView, Platform, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Rect, Path, Polyline, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTracking } from '@/context/TrackingContext';
import { CATEGORIES } from '@/constants/Categories';
import { formatDuration, formatTimestamp, formatDate } from '@/utils/time';
import LogActionSheet from '@/components/LogActionSheet';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '@/context/LanguageContext';
import { View as MotiView } from 'moti';
import {
  Tag, 
  TrendingUp as TrendIcon,
  ChevronRight,
  Sparkles,
  Zap,
  Clock,
  X,
  Calendar,
  ArrowLeft,
  MoreHorizontal,
  Brain,
  Target,
  ArrowRight,
  BarChart,
  Plus,
  Briefcase,
  Heart,
  BookOpen,
  Coffee as CoffeeIcon,
  Users,
  Code,
  Music,
  Camera,
  Layers,
  Check
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Activity, Category } from '@/context/TrackingContext';

const { width } = Dimensions.get('window');

const CategoryIcon = ({ name, size, color }: { name: string, size: number, color: string }) => {
  const icons: Record<string, any> = {
    'briefcase': Briefcase,
    'heart': Heart,
    'book-open': BookOpen,
    'coffee': CoffeeIcon,
    'zap': Zap,
    'target': Target,
    'brain': Brain,
    'tag': Tag,
    'users': Users,
    'code': Code,
    'music': Music,
    'camera': Camera,
    'layers': Layers,
  };
  const IconComponent = icons[name] || Tag;
  return <IconComponent size={size} color={color} />;
};

const Coffee = ({ size, color }: { size: number, color: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <Path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <Path d="M6 2v2" />
        <Path d="M10 2v2" />
        <Path d="M14 2v2" />
    </Svg>
);

// --- Helper Components for Charts ---

const DonutChart = ({ data, total }: { data: any[], total: number }) => {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const size = 160;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  let currentOffsetCount = 0;

  return (
    <View className="items-center justify-center bg-transparent mb-8">
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colorScheme === 'dark' ? '#1c1c1e' : '#f9fafb'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {data.map((item) => {
            if (item.totalMins <= 0 || total <= 0) return null;
            const percentage = item.totalMins / total;
            
            // Adding a small gap for spacing
            const gapDegrees = 4; 
            const activeSegments = data.filter(d => d.totalMins > 0).length;
            const totalGaps = activeSegments > 1 ? activeSegments * gapDegrees : 0;
            const availableDegrees = 360 - totalGaps;
            
            const segmentDegrees = percentage * availableDegrees;
            const strokeDashoffset = circumference - (segmentDegrees / 360) * circumference;
            
            const rotation = (currentOffset / total) * availableDegrees + (currentOffsetCount * gapDegrees);
            currentOffset += item.totalMins;
            currentOffsetCount++;

            return (
              <Circle
                key={item.id}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                transform={`rotate(${rotation}, ${center}, ${center})`}
              />
            );
          })}
        </G>
      </Svg>
      <View className="absolute items-center bg-transparent">
        <Text className="text-gray-400 dark:text-gray-500 font-black text-[8px] uppercase tracking-widest mb-1">{t('focused')}</Text>
        <Text className="text-2xl font-black text-klowk-black dark:text-white">{Math.floor(total / 3600)}h</Text>
      </View>
    </View>
  );
};

const WeeklyLineChart = ({ activities }: { activities: any[] }) => {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const now = new Date();
  const currentDay = now.getDay();
  const dailyData = days.map((_, i) => {
    const d = new Date(now);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay() + i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    const ms = activities.filter(a => a.start_time >= dayStart && a.start_time < dayEnd)
                        .reduce((sum, a) => sum + (a.duration || 0), 0);
    return ms;
  });

  const max = Math.max(...dailyData, 3600); // Max at least 1 hour for scale
  const chartHeight = 100;
  const chartWidth = width - 80;
  
  const points = dailyData.map((val, i) => {
    const x = (i / (days.length - 1)) * chartWidth;
    const y = chartHeight - (val / max) * (chartHeight - 30) - 15; // Closer to base
    return `${x},${y}`;
  }).join(' ');

  return (
    <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm border border-gray-50 dark:border-zinc-800 mb-8 overflow-hidden">
      <View className="flex-row justify-between items-center mb-6 bg-transparent">
        <Text className="font-black text-lg text-klowk-black dark:text-white">{t('weekly_trend')}</Text>
        <TrendIcon size={16} color="#FF5A00" />
      </View>
      
      <View className="h-40 bg-transparent relative">
        <View className="absolute top-0 left-0 right-0 h-[100px] justify-between bg-transparent">
            {[...Array(4)].map((_, i) => (
                <View key={i} className="w-full h-[1px] bg-gray-50 dark:bg-zinc-800" />
            ))}
        </View>

        <View className="h-[100px] bg-transparent mt-2">
            <Svg height={chartHeight} width={chartWidth}>
                <Defs>
                    <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FF5A00" stopOpacity="0.2" />
                        <Stop offset="1" stopColor="#FF5A00" stopOpacity="0" />
                    </SvgGradient>
                </Defs>
                <Path
                    d={`M 0,${chartHeight} ${points.split(' ').map((p, i) => (i === 0 ? `L ${p}` : p)).join(' ')} L ${chartWidth},${chartHeight} Z`}
                    fill="url(#grad)"
                />
                <Polyline
                    points={points}
                    fill="none"
                    stroke="#FF5A00"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {dailyData.map((val, i) => {
                    const x = (i / (days.length - 1)) * chartWidth;
                    const y = chartHeight - (val / max) * (chartHeight - 30) - 15; // Sync with points
                    return (
                        <Circle key={i} cx={x} cy={y} r="4" fill={i === currentDay ? '#FF5A00' : (colorScheme === 'dark' ? '#121212' : 'white')} stroke="#FF5A00" strokeWidth="2" />
                    );
                })}
            </Svg>
        </View>

        <View className="flex-row justify-between items-center bg-transparent mt-8 px-1 pb-2">
            {days.map((day, i) => (
                <Text key={i} className={`text-[10px] font-bold ${i === currentDay ? 'text-klowk-orange' : 'text-gray-400 dark:text-gray-600'}`}>
                    {day}
                </Text>
            ))}
        </View>
      </View>
    </View>
  );
};
// Helper to capitalize first letter
const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
export default React.memo(function ReportsScreen() {
  const { colorScheme } = useColorScheme();
  const { t, language } = useLanguage();
  const isDark = colorScheme === 'dark';
  
  const navigation = useNavigation<any>();
  const { activities, deleteActivity, duplicateActivity, categories, addCategory } = useTracking();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [toggleWidth, setToggleWidth] = useState(0);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('tag');
  const [newCatColor, setNewCatColor] = useState('#FF5A00');

  const slideAnim = useRef(new Animated.Value(width)).current;
  const forecastAnim = useRef(new Animated.Value(width)).current;

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (timeRange === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'week') {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    const startMs = start.getTime();
    const endMs = end.getTime();

    return activities.filter((a: Activity) => {
      const ts = a.start_time;
      return ts >= startMs && ts <= endMs;
    });
  }, [activities, timeRange]);

  // Analytics logic scoped to selected period
  const categoryStats = useMemo(() => {
    return categories.map((cat: Category) => {
      const logs = filteredActivities.filter((a: Activity) => a.category === cat.id);
      const totalMins = logs.reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
      const sessionCount = logs.length;
      return { ...cat, totalMins, sessionCount };
    }).sort((a: any, b: any) => (b.totalMins || 0) - (a.totalMins || 0));
  }, [filteredActivities, categories]);

  const totalTimeRecorded = useMemo(() => {
    return categoryStats.reduce((sum: number, c: any) => sum + (c.totalMins || 0), 0);
  }, [categoryStats]);

  const selectedCatData = useMemo(() => {
    return selectedCategory ? categories.find((c: Category) => c.id === selectedCategory) : null;
  }, [selectedCategory, categories]);

  const selectedCatLogs = useMemo(() => {
    return selectedCategory ? filteredActivities.filter((a: Activity) => a.category === selectedCategory) : [];
  }, [selectedCategory, filteredActivities]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedCategory ? 0 : width,
      useNativeDriver: true,
      tension: 40,
      friction: 8
    }).start();
  }, [selectedCategory]);

  useEffect(() => {
    Animated.spring(forecastAnim, {
      toValue: showForecast ? 0 : width,
      useNativeDriver: true,
      tension: 40,
      friction: 8
    }).start();
  }, [showForecast]);

  const handleAddCategory = () => {
    if (!newCatName) return;
    addCategory(newCatName, newCatIcon, newCatColor);
    setShowAddCategory(false);
    setNewCatName('');
  };

  const ICONS = ['briefcase', 'heart', 'book-open', 'coffee', 'zap', 'target', 'brain', 'tag'];
  const COLORS = ['#FF5A00', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4', '#4b5563'];

  const forecastContent = useMemo(() => {
    return {
        title: t('focus_prime_time'),
        heroText: t('forecast_hero'),
        dataLabel: "Next 24 Hours",
        chartData: [0.2, 0.4, 0.3, 0.9, 0.7, 0.8, 0.5, 0.3],
        chartLabels: ['8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'],
        strategies: [
            { title: t('deep_work_block'), detail: t('deep_work_detail'), icon: Calendar },
            { title: t('caffeine_timing'), detail: t('caffeine_detail'), icon: Coffee }
        ]
    };
  }, [t]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black" edges={['top']}>
      <Animated.ScrollView 
        className="flex-1 bg-white dark:bg-klowk-black" 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* Header Section */}
        <View className="bg-white dark:bg-klowk-black pt-8 pb-4 px-6">
          <View className="flex-row items-center justify-between mb-10">
            <Text className="text-4xl font-extrabold text-klowk-black dark:text-white">{t('data')}</Text>
            <View
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0) setToggleWidth(w);
              }}
              className="bg-gray-50 dark:bg-zinc-900 rounded-[16px] p-1 flex-row relative overflow-hidden"
            >
              <MotiView
                animate={{
                  translateX: (timeRange === 'today' ? 0 : timeRange === 'week' ? 1 : 2) * ((toggleWidth - 8) / 3),
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 180 }}
                style={{
                  position: 'absolute',
                  top: 4,
                  bottom: 4,
                  left: 4,
                  width: (toggleWidth - 8) / 3 || undefined,
                  backgroundColor: isDark ? '#3f3f46' : '#fff',
                  borderRadius: 12,
                }}
              />
              {(['today', 'week', 'month'] as const).map((range) => {
                const isActive = timeRange === range;
                return (
                  <Pressable
                    key={range}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTimeRange(range);
                    }}
                    className="px-3 py-2 rounded-[12px] items-center z-10"
                  >
                    <Text className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-klowk-orange' : 'text-gray-400 dark:text-zinc-500'}`}>
                      {t(range === 'week' ? 'this_week' : range === 'month' ? 'this_month' : 'today')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          
          <View className="relative items-center justify-center">
             <View 
                style={{ backgroundColor: '#FF5A00', height: 60, top: '45%' }} 
                className="absolute left-[-24] right-[-24]" 
             />

            <View className="flex-row items-end justify-between bg-transparent">
                <View className="w-32 h-32 items-center justify-center bg-transparent">
                <Image 
                    source={require('../../assets/images/time-mascot.svg')} 
                    style={{ width: 120, height: 120 }}
                    contentFit="contain"
                />
                </View>

                <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm w-[60%] border border-gray-50 dark:border-zinc-800">
                    <View className="flex-row items-center mb-1 bg-transparent">
                        <Text className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-widest">{t('total_focused')}</Text>
                        <View className="ml-2 w-2 h-2 bg-green-500 rounded-full" />
                    </View>
                    <Text className="text-3xl font-black text-klowk-black dark:text-white leading-8">
                        {Math.floor(totalTimeRecorded / 3600)}h {Math.floor((totalTimeRecorded % 3600) / 60)}m
                    </Text>
                    
                    {filteredActivities.length > 0 && (
                      <Pressable 
                          onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setShowForecast(true);
                          }}
                          className="mt-4 bg-klowk-orange/10 py-2.5 px-4 rounded-xl flex-row items-center justify-center border border-klowk-orange/20"
                      >
                          <Sparkles size={12} color="#FF5A00" />
                          <Text className="ml-2 text-[10px] font-black text-klowk-orange uppercase tracking-wider">{t('forecast')}</Text>
                      </Pressable>
                    )}
                </View>
            </View>
          </View>

          {/* AI Insight only after real tracking data exists */}
          {filteredActivities.length > 0 && (
            <View style={{ marginTop: 24 }} className="bg-white dark:bg-zinc-900 p-6 rounded-[34px] shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
              <View className="flex-row items-center mb-3 bg-transparent">
                <Sparkles size={14} color="#FF5A00" />
                <Text className="ml-2 font-black text-klowk-orange text-[10px] uppercase tracking-[3px]">{t('ai_insight')}</Text>
              </View>
              <Text className="text-klowk-black dark:text-white font-semibold text-sm leading-5">
                {t('ai_insight_body')}
              </Text>
            </View>
          )}
        </View>

        <View className="px-6 mt-4">
           <View className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-sm border border-gray-50 dark:border-zinc-800 mb-8 items-center">
                <DonutChart data={categoryStats} total={totalTimeRecorded} />
                
                <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-3 mt-2">
                    {categoryStats.filter(s => s.totalMins > 0).map((stat: any) => (
                        <View key={stat.id} className="flex-row items-center">
                           <View style={{ backgroundColor: stat.color }} className="w-2 h-2 rounded-full mr-2" />
                           <Text className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{capitalize(t(stat.id as any) || stat.label)}</Text>
                        </View>
                    ))}
                    {categoryStats.filter(s => s.totalMins > 0).length === 0 && (
                      <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('no_activities_yet')}</Text>
                    )}
                </View>
           </View>

           <WeeklyLineChart activities={filteredActivities} />

           <View className="mb-8">
                <View className="flex-row items-center justify-between mb-6 px-1">
                    <Text className="font-black text-xl text-klowk-black dark:text-white">{t('categories')}</Text>
                    <Pressable 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setShowAddCategory(true);
                        }}
                        className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-100 dark:border-zinc-800"
                    >
                        <Plus size={20} color="#FF5A00" strokeWidth={3} />
                    </Pressable>
                </View>

                {categoryStats.map((stat: any, i: number) => {
                    const percentage = totalTimeRecorded > 0 ? (stat.totalMins / totalTimeRecorded) * 100 : 0;
                    if (stat.totalMins === 0 && i > 3) return null;

                    return (
                        <Pressable 
                            key={stat.id} 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedCategory(stat.id);
                            }}
                            className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] mb-4 shadow-sm border border-gray-50 dark:border-zinc-800 active:scale-[0.98] active:bg-gray-50 dark:active:bg-zinc-800 flex-row items-center"
                        >
                            <View style={{ backgroundColor: `${stat.color}10` }} className="w-12 h-12 rounded-2xl items-center justify-center mr-4">
                                <CategoryIcon name={stat.iconName} size={20} color={stat.color} />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between items-end mb-3">
                                    <View>
                                        <Text className="font-black text-klowk-black dark:text-white text-base">
                                          {capitalize(t(stat.label.toLowerCase() as any) || stat.label)}
                                        </Text>
                                        <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">{stat.sessionCount} {t('sessions')}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="font-black text-klowk-black dark:text-white text-lg">{formatDuration(stat.totalMins)}</Text>
                                    </View>
                                </View>
                                <View className="h-1.5 w-full bg-gray-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <View style={{ width: `${Math.max(2, percentage)}%`, backgroundColor: stat.color }} className="h-full rounded-full" />
                                </View>
                            </View>
                            <View className="ml-4">
                                <ChevronRight size={18} color="#e5e7eb" />
                            </View>
                        </Pressable>
                    );
                })}
           </View>

           <View className="h-40 bg-transparent" />
        </View>
      </Animated.ScrollView>

      {/* Category Detail Overlay */}
      <Animated.View 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDark ? '#121212' : '#fff', zIndex: 100, transform: [{ translateX: slideAnim }] }}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black" edges={['top']}>
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
                <Pressable onPress={() => setSelectedCategory(null)} className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-full active:bg-gray-100 dark:active:bg-zinc-800">
                    <ArrowLeft size={20} color={isDark ? '#fff' : '#121212'} />
                </Pressable>
                <Text className="text-lg font-black text-klowk-black dark:text-white">{t('category_detail')}</Text>
                <View className="w-10" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 bg-white dark:bg-klowk-black">
                <View className="items-center py-8">
                    <View style={{ backgroundColor: selectedCatData?.color + '15', padding: 20, borderRadius: 24, marginBottom: 16 }}>
                        <CategoryIcon name={selectedCatData?.iconName || 'tag'} size={40} color={selectedCatData?.color || '#FF5A00'} />
                    </View>
                    <Text className="text-3xl font-black text-klowk-black dark:text-white mb-1">
                      {capitalize(t((selectedCatData?.label || '').toLowerCase() as any) || selectedCatData?.label || '')}
                    </Text>
                    <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[4px]">{selectedCatLogs.length} {t('sessions_total')}</Text>
                </View>

                {selectedCatLogs.map((log: Activity) => (
                    <View key={log.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] mb-4 shadow-sm border border-gray-50 dark:border-zinc-800 flex-row items-center justify-between">
                        <View className="flex-1">
                            <Text className="text-base font-bold text-klowk-black dark:text-white mb-1.5">{log.title}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">{formatDate(log.start_time)} • {formatTimestamp(log.start_time)}</Text>
                            </View>
                        </View>
                        <View className="items-end ml-4">
                            <Text className="text-lg font-black text-klowk-black dark:text-white">{formatDuration(log.duration || 0)}</Text>
                            <Pressable onPress={() => setSelectedActionLogId(log.id)} hitSlop={10} className="p-1 mt-1">
                                <MoreHorizontal size={16} color="#9ca3af" />
                            </Pressable>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {/* Forecast Overlay (Stay on same page) */}
      {filteredActivities.length > 0 && (
        <Animated.View 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDark ? '#121212' : '#fff', zIndex: 110, transform: [{ translateX: forecastAnim }] }}
        >
          <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black" edges={['top']}>
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
                  <Pressable onPress={() => setShowForecast(false)} className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-full active:bg-gray-100 dark:active:bg-zinc-800">
                      <ArrowLeft size={20} color={isDark ? '#fff' : '#121212'} />
                  </Pressable>
                  <Text className="text-lg font-black text-klowk-black dark:text-white">{t('forecast')}</Text>
                  <View className="w-10" />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 bg-white dark:bg-klowk-black">
                  <View className="items-center py-4 mb-2">
                      <View className="bg-klowk-orange/10 w-24 h-24 rounded-[32px] items-center justify-center">
                          <Sparkles size={40} color="#FF5A00" />
                      </View>
                      <Text className="text-3xl font-black text-klowk-black dark:text-white mt-6 text-center">{forecastContent.title}</Text>
                      <Text className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-[3px] mt-2">{t('ai_momentum_engine')}</Text>
                  </View>

                  <LinearGradient colors={['#FF5A00', '#FF8A00']} style={{ borderRadius: 34, padding: 32, marginBottom: 32, marginTop: 24 }}>
                      <Text className="text-white text-2xl font-black leading-9">{forecastContent.heroText}</Text>
                  </LinearGradient>

                  {/* Simplified Chart (Stay under memory/render limit) */}
                  <View className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-zinc-800 mb-8">
                      <Text className="text-lg font-black text-klowk-black dark:text-white mb-8">{t('forecast_trend')}</Text>
                      <View className="h-32 flex-row items-end justify-between px-1">
                          {forecastContent.chartData.map((h, i) => (
                              <View key={i} className="items-center flex-1">
                                  <View style={{ height: h * 80, width: 10, backgroundColor: h > 0.8 ? '#FF5A00' : (isDark ? '#27272a' : '#f3f4f6'), borderRadius: 5 }} />
                                  <Text className="text-[7px] font-black text-gray-300 dark:text-zinc-600 mt-2 uppercase">{forecastContent.chartLabels[i]}</Text>
                              </View>
                          ))}
                      </View>
                  </View>

                  {/* Rich Strategies List */}
                  <View className="mb-8">
                      <Text className="text-xl font-black text-klowk-black dark:text-white mb-6">{t('winning_strategy')}</Text>
                      {forecastContent.strategies.map((s: any, i: number) => {
                          const Icon = s.icon || Target;
                          return (
                              <View key={i} className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-[32px] mb-4 flex-row items-center border border-transparent dark:border-zinc-800">
                                  <View className="bg-white dark:bg-zinc-800 w-12 h-12 rounded-2xl items-center justify-center shadow-sm">
                                      <Icon size={20} color="#FF5A00" />
                                  </View>
                                  <View className="flex-1 ml-4">
                                      <Text className="font-bold text-klowk-black dark:text-white text-base">{s.title}</Text>
                                      <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.detail}</Text>
                                  </View>
                                  <ArrowRight size={16} color={isDark ? '#3f3f46' : '#d1d5db'} />
                              </View>
                          );
                      })}
                  </View>

                  <View className="h-48" />
              </ScrollView>
          </SafeAreaView>
        </Animated.View>
      )}

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

      {/* Add Category Sheet */}
      <Modal
        visible={showAddCategory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCategory(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
           <Pressable className="flex-1" onPress={() => setShowAddCategory(false)} />
           <View className="bg-white dark:bg-klowk-black rounded-t-[40px] p-8 pb-12 shadow-2xl">
              <View className="flex-row justify-between items-center mb-8">
                <Text className="text-2xl font-black text-klowk-black dark:text-white">{t('new_category')}</Text>
                <Pressable onPress={() => setShowAddCategory(false)} className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-full">
                    <X size={20} color={isDark ? '#fff' : '#121212'} />
                </Pressable>
              </View>

              <View className="mb-8">
                <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t('category_name')}</Text>
                <View className="bg-gray-50 dark:bg-zinc-900 rounded-[20px] border border-gray-100 dark:border-zinc-800">
                    <TextInput
                        value={newCatName}
                        onChangeText={setNewCatName}
                        placeholder="e.g. Learning, Workout..."
                        placeholderTextColor={isDark ? '#3f3f46' : '#d1d5db'}
                        autoFocus
                        className="p-5 text-base font-bold text-klowk-black dark:text-white"
                    />
                </View>
              </View>

               <View className="mb-8">
                <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t('select_icon')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {ICONS.map((icon) => (
                        <Pressable 
                            key={icon} 
                            onPress={() => {
                                setNewCatIcon(icon);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            className={`w-12 h-12 items-center justify-center rounded-2xl mr-3 ${newCatIcon === icon ? 'bg-klowk-orange' : 'bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800'}`}
                        >
                            <CategoryIcon name={icon} size={20} color={newCatIcon === icon ? '#fff' : (isDark ? '#52525b' : '#9ca3af')} />
                        </Pressable>
                    ))}
                </ScrollView>
              </View>

              <View className="mb-10">
                <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t('select_color')}</Text>
                <View className="flex-row flex-wrap gap-3">
                    {COLORS.map((color) => (
                        <Pressable 
                            key={color} 
                            onPress={() => {
                                setNewCatColor(color);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={{ backgroundColor: color }}
                            className={`w-10 h-10 rounded-full items-center justify-center border-4 ${newCatColor === color ? 'border-gray-200 dark:border-zinc-700' : 'border-transparent'}`}
                        >
                            {newCatColor === color && <Check size={16} color="#fff" />}
                        </Pressable>
                    ))}
                </View>
              </View>

              <Pressable 
                onPress={handleAddCategory}
                disabled={!newCatName}
                className={`py-5 rounded-[24px] flex-row items-center justify-center shadow-lg ${!newCatName ? 'bg-gray-100 dark:bg-zinc-900' : 'bg-klowk-black dark:bg-white'}`}
              >
                <Plus size={20} color={!newCatName ? '#9ca3af' : (isDark ? '#121212' : '#fff')} className="mr-3" />
                <Text className={`font-black uppercase tracking-wider ${!newCatName ? 'text-gray-400' : (isDark ? 'text-klowk-black' : 'text-white')}`}>{t('create_category')}</Text>
              </Pressable>
           </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
});
