import LogActionSheet from '@/components/LogActionSheet';
import { CATEGORIES } from '@/constants/Categories';
import { Activity, useTracking } from '@/context/TrackingContext';
import { formatDate, formatDuration, formatLiveDuration, formatLogDuration, formatTimestamp } from '@/utils/time';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Animated, Dimensions, Pressable, TouchableOpacity, ScrollView, View, Text } from 'react-native';

const { width } = Dimensions.get('window');

export default function TabOneScreen() {
  const { activities, currentActivity, stopTracker, getTotalFocusTimeToday, deleteActivity, duplicateActivity } = useTracking();
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  
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

  const rangeMinsTotal = getPeriodTotal(timeRange, 0);
  const prevRangeMinsTotal = getPeriodTotal(timeRange, -1);
  const trendUp = rangeMinsTotal > prevRangeMinsTotal;
  const isNeutral = rangeMinsTotal === prevRangeMinsTotal;
  const trendColor = isNeutral ? '#121212' : (trendUp ? '#10b981' : '#ef4444');
  const todayMinsTotal = activities
    .filter((a: Activity) => new Date(a.start_time).toDateString() === now.toDateString())
    .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
    
  const currentDay = now.getDay();
  const dailyChartData = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = new Date(now);
    d.setDate(now.getDate() - currentDay + i);
    const dayStr = d.toDateString();
    const isToday = dayStr === now.toDateString();
    const label = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const mins = activities
      .filter((a: Activity) => new Date(a.start_time).toDateString() === dayStr)
      .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
    return { mins, label, isToday };
  });
  
  const maxWeeklyMins = Math.max(...dailyChartData.map(d => d.mins), 1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentActivity) {
      setNowMs(Date.now());
      interval = setInterval(() => setNowMs(Date.now()), 1000);
    }
    return () => clearInterval(interval);
  }, [currentActivity]);

  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const dayOfMonth = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date());

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 40 }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 8, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Pressable 
                onPress={() => console.log('Settings pressed')}
                style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}
            >
                <Settings2 size={16} color="#FF5A00" />
                <Text style={{ marginLeft: 8, fontWeight: '700', color: '#121212' }}>Settings</Text>
            </Pressable>
        </View>

        {/* Greeting Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32, marginTop: 12 }}>
            <Text style={{ color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>
                {dayOfWeek}, {dayOfMonth}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 26, fontWeight: '900', color: '#121212', marginBottom: 40 }}>
                Good afternoon, <Text style={{ color: '#FF5A00' }}>User!</Text>
            </Text>

            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'absolute', left: -24, right: -24, height: 60, backgroundColor: '#FF5A00', top: '45%' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 130, height: 130, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Image 
                            source={require('../../assets/images/idle-mascot.svg')} 
                            style={{ width: 120, height: 120 }}
                            contentFit="contain"
                        />
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
                        <Text style={{ fontSize: 12, color: '#121212', fontWeight: '600', lineHeight: 20 }}>
                            {todayMinsTotal > 0 
                            ? `You've focused for ${formatDuration(todayMinsTotal)} today. Stellar work!`
                            : "Ready for a deep focus session? I'm here to help you track your wins."}
                        </Text>
                        <View style={{ position: 'absolute', left: -6, top: 40, width: 16, height: 16, backgroundColor: '#fff', transform: [{ rotate: '45deg' }], borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#f3f4f6' }} />
                    </View>
                </View>
            </View>
        </View>

        {/* Analytics Section */}
        <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
          {/* Intensity Card */}
          <View style={{ width: '48.5%', backgroundColor: '#fff', borderRadius: 32, padding: 20, borderWidth: 1, borderColor: '#f9fafb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Intensity</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 64 }}>
              {dailyChartData.map((item, i) => {
                const intensity = (item.mins / maxWeeklyMins) || 0;
                const barHeight = Math.max(4, intensity * 40);
                return (
                  <View key={i} style={{ width: '12%', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <View style={{ 
                        height: barHeight, 
                        width: 10, 
                        borderRadius: 5, 
                        backgroundColor: item.isToday ? '#FF5A00' : (intensity > 0.05 ? `rgba(255, 90, 0, ${0.15 + intensity * 0.7})` : '#f3f4f6') 
                    }} />
                    <Text style={{ marginTop: 8, fontSize: 7, fontWeight: '900', textTransform: 'uppercase', color: item.isToday ? '#FF5A00' : '#d1d5db' }}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Summary Card */}
          <View style={{ width: '48.5%', backgroundColor: '#fff', borderRadius: 32, padding: 20, borderWidth: 1, borderColor: '#f9fafb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'}
                </Text>
                {trendUp ? <ArrowUp size={12} color="#10b981" strokeWidth={3} /> : <ArrowDown size={12} color="#ef4444" strokeWidth={3} />}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontSize: 34, fontWeight: '900', color: trendColor }}>{(rangeMinsTotal / 60).toFixed(1)}</Text>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#d1d5db', marginLeft: 4 }}>HRS</Text>
              </View>
            </View>

            {/* THE TOGGLE */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f9fafb', padding: 4, borderRadius: 16 }}>
                {(['today', 'week', 'month'] as const).map((r) => {
                    const isActive = timeRange === r;
                    return (
                        <TouchableOpacity 
                            key={r}
                            activeOpacity={0.7}
                            onPress={() => handleRangeChange(r)}
                            style={{ 
                                flex: 1, 
                                alignItems: 'center', 
                                paddingVertical: 8, 
                                borderRadius: 12, 
                                backgroundColor: isActive ? '#fff' : 'transparent',
                                shadowColor: isActive ? '#000' : 'transparent',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: isActive ? 1 : 0
                            }}
                        >
                            <Text style={{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', color: isActive ? '#FF5A00' : '#9ca3af' }}>{r}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
          </View>
        </View>

        {/* Live Timer Card */}
        {currentActivity && (
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
             <View style={{ backgroundColor: '#fff', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 }}>
                <View style={{ alignItems: 'center' }}>
                   <Text style={{ color: '#FF5A00', fontWeight: '700', fontSize: 18, marginBottom: 4 }}>{currentActivity.title}</Text>
                   <Text style={{ fontSize: 40, fontWeight: '900', color: '#121212', marginBottom: 16 }}>
                     {formatLiveDuration(currentActivity.start_time, nowMs)}
                   </Text>
                   <TouchableOpacity 
                    onPress={stopTracker}
                    style={{ width: '100%', backgroundColor: '#121212', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
                   >
                     <Text style={{ color: '#fff', fontWeight: '700' }}>Stop Timer</Text>
                   </TouchableOpacity>
                </View>
             </View>
          </View>
        )}

        {/* Logs List */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
             <Text style={{ fontSize: 10, fontWeight: '900', color: '#FF5A00', textTransform: 'uppercase', letterSpacing: 2 }}>LOGS</Text>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 120 }}>
          {activities.slice(0, 5).map((log: Activity) => {
            const category = CATEGORIES.find(c => c.id === log.category);
            const catColor = category?.color || '#6b7280';
            const Icon = { briefcase: Briefcase, heart: Heart, 'book-open': BookOpen, coffee: Coffee }[category?.iconName as string] || Tag;

            return (
              <View key={log.id} style={{ backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f9fafb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 }}>
                <View style={{ backgroundColor: `${catColor}15`, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                   <Icon size={18} color={catColor} />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={{ fontWeight: '700', color: '#121212' }} numberOfLines={1}>{log.title || 'Untitled Session'}</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: catColor, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginRight: 8 }}>{category?.label || 'Personal'}</Text>
                    <Text style={{ fontSize: 8, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>{formatDate(log.start_time)} • {formatTimestamp(log.start_time)}</Text>
                   </View>
                </View>
                 <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                   <Text style={{ fontWeight: '900', color: '#121212', marginBottom: 4, textAlign: 'right' }}>{formatLogDuration(log.start_time, log.end_time, log.duration)}</Text>
                   <Pressable hitSlop={10} onPress={() => setSelectedActionLogId(log.id)} style={{ padding: 4 }}>
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
    </View>
  );
}
