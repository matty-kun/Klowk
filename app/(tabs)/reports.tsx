import { Image } from 'expo-image';
import React, { useRef } from 'react';
import { Animated, Pressable, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Rect, Path, Polyline, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTracking } from '@/context/TrackingContext';
import { CATEGORIES } from '@/constants/Categories';
import { formatDuration } from '@/utils/time';
import { 
  Tag, 
  TrendingUp as TrendIcon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- Helper Components for Charts ---

const DonutChart = ({ data, total }: { data: any[], total: number }) => {
  const size = 160;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;

  return (
    <View className="items-center justify-center bg-transparent mb-8">
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {data.map((item, i) => {
            if (item.totalMins === 0 || total === 0) return null;
            const percentage = item.totalMins / total;
            const strokeDashoffset = circumference - percentage * circumference;
            const rotation = (currentOffset / total) * 360;
            currentOffset += item.totalMins;

            return (
              <Circle
                key={item.id}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
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
        <Text className="text-gray-400 font-bold text-[8px] uppercase tracking-widest">Focused</Text>
        <Text className="text-xl font-black italic text-klowk-black">{Math.round(total / 60)}h</Text>
      </View>
    </View>
  );
};

const WeeklyLineChart = ({ activities }: { activities: any[] }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const now = new Date();
  const currentDay = now.getDay();
  const dailyData = days.map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - currentDay + i);
    const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
    const dayEnd = new Date(d.setHours(23,59,59,999)).getTime();
    const ms = activities.filter(a => a.start_time >= dayStart && a.start_time <= dayEnd)
                        .reduce((sum, a) => sum + (a.duration || 0), 0);
    return ms;
  });

  const max = Math.max(...dailyData, 60);
  const chartHeight = 100;
  const chartWidth = width - 80;
  
  // Calculate points for the line
  const points = dailyData.map((val, i) => {
    const x = (i / (days.length - 1)) * chartWidth;
    const y = chartHeight - (val / max) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 mb-8 overflow-hidden">
      <View className="flex-row justify-between items-center mb-6 bg-transparent">
        <Text className="font-black text-lg text-klowk-black italic">Weekly Trend</Text>
        <TrendIcon size={16} color="#FF5A00" />
      </View>
      
      <View className="h-32 bg-transparent relative">
        <View className="absolute top-0 left-0 right-0 h-full justify-between bg-transparent">
            {[...Array(4)].map((_, i) => (
                <View key={i} className="w-full h-[1px] bg-gray-50" />
            ))}
        </View>

        <View className="flex-1 bg-transparent mt-2">
            <Svg height={chartHeight} width={chartWidth}>
                <Defs>
                    <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FF5A00" stopOpacity="0.2" />
                        <Stop offset="1" stopColor="#FF5A00" stopOpacity="0" />
                    </SvgGradient>
                </Defs>
                {/* Area under the line */}
                <Path
                    d={`M 0,${chartHeight} ${points.split(' ').map((p, i) => (i === 0 ? `L ${p}` : p)).join(' ')} L ${chartWidth},${chartHeight} Z`}
                    fill="url(#grad)"
                />
                {/* The line itself */}
                <Polyline
                    points={points}
                    fill="none"
                    stroke="#FF5A00"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Dots for each day */}
                {dailyData.map((val, i) => {
                    const x = (i / (days.length - 1)) * chartWidth;
                    const y = chartHeight - (val / max) * chartHeight;
                    return (
                        <Circle key={i} cx={x} cy={y} r="4" fill={i === currentDay ? '#FF5A00' : 'white'} stroke="#FF5A00" strokeWidth="2" />
                    );
                })}
            </Svg>
        </View>

        <View className="flex-row justify-between items-center bg-transparent mt-4 px-1">
            {days.map((day, i) => (
                <Text key={i} className={`text-[10px] font-bold ${i === currentDay ? 'text-klowk-orange' : 'text-gray-400'}`}>
                    {day}
                </Text>
            ))}
        </View>
      </View>
    </View>
  );
};

export default function ReportsScreen() {
  const { activities } = useTracking();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Simple analytics logic
  const categoryStats = CATEGORIES.map((cat: any) => {
    const logs = activities.filter((a: any) => a.category === cat.id);
    const totalMins = logs.reduce((sum: number, a: any) => sum + (a.duration || 0), 0);
    const sessionCount = logs.length;
    return { ...cat, totalMins, sessionCount };
  }).sort((a: any, b: any) => b.totalMins - a.totalMins);

  const totalTimeRecorded = categoryStats.reduce((sum: number, c: any) => sum + c.totalMins, 0);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Animated.ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* Fixed Header Section (Mist logic) with Brand Band */}
        <View className="bg-white pt-8 pb-12 px-6">
          <Text className="text-4xl font-extrabold text-klowk-black mb-10">Data</Text>
          
          <View className="relative items-center justify-center">
             {/* The Orange Band - Lowered */}
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

                <View className="bg-white p-6 rounded-[32px] shadow-sm w-[60%]">
                <View className="flex-row items-center mb-1 bg-transparent">
                    <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Total Focused</Text>
                    <View className="ml-2 w-2 h-2 bg-green-500 rounded-full" />
                </View>
                <Text className="text-3xl font-black text-klowk-black italic leading-8 pr-2">
                    {formatDuration(totalTimeRecorded)}
                </Text>
                <Text className="text-[9px] text-gray-400 font-bold mt-1">Focus efficiency is up 5.8%</Text>
                </View>
            </View>
          </View>
        </View>

        <View className="px-6 -mt-6">
          <View className="bg-white p-8 rounded-[40px] shadow-md border border-gray-50 flex-row items-center justify-between mb-8">
            <DonutChart data={categoryStats} total={totalTimeRecorded} />
            <View className="flex-1 ml-6 bg-transparent">
               {categoryStats.slice(0, 3).map((stat: any) => (
                 <View key={stat.id} className="flex-row items-center mb-2 bg-transparent">
                   <View style={{ backgroundColor: stat.color }} className="w-2 h-2 rounded-full mr-2" />
                   <Text className="text-[10px] font-bold text-gray-500">{stat.label}</Text>
                 </View>
               ))}
            </View>
          </View>

          <WeeklyLineChart activities={activities} />

          <View className="bg-white p-6 rounded-[34px] shadow-md border border-gray-50 relative overflow-hidden mb-8">
            <View className="flex-row items-center mb-3 bg-transparent">
              <Text className="font-black text-klowk-orange text-[10px] uppercase tracking-[3px]">Insight</Text>
            </View>
            <Text className="text-klowk-black font-semibold text-sm leading-5">
              That's a solid amount of focus. <Text className="text-gray-400">Very productive, in the best boring and useful way.</Text>
            </Text>
          </View>

          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-6 bg-transparent">
              <Text className="font-black text-lg text-klowk-black italic">Allocations</Text>
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-[9px] font-black text-gray-400 uppercase">Monthly</Text>
              </View>
            </View>

            {categoryStats.map((stat: any, i: number) => {
               const percentage = totalTimeRecorded > 0 ? (stat.totalMins / totalTimeRecorded) * 100 : 0;
               if (stat.totalMins === 0 && i > 2) return null;

               return (
                 <View key={stat.id} className="bg-white p-5 rounded-[28px] mb-4 shadow-sm border border-gray-50">
                   <View className="flex-row justify-between items-center mb-4">
                     <View className="flex-row items-center bg-transparent">
                       <View style={{ backgroundColor: `${stat.color}15` }} className="w-10 h-10 rounded-2xl items-center justify-center mr-4">
                         <Tag size={16} color={stat.color} />
                       </View>
                       <View className="bg-transparent">
                        <Text className="font-black text-klowk-black italic text-base pr-4">{stat.label}</Text>
                       </View>
                     </View>
                     <View className="items-end bg-transparent">
                      <Text className="font-black text-klowk-black text-lg italic pr-4">{formatDuration(stat.totalMins)}</Text>
                      <Text className="text-[9px] text-gray-400 font-bold uppercase">{stat.sessionCount} sessions</Text>
                     </View>
                   </View>
                   
                   <View className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                      <View 
                        style={{ 
                          width: `${Math.max(2, percentage)}%`,
                          backgroundColor: stat.color
                        }} 
                        className="h-full rounded-full" 
                      />
                   </View>
                 </View>
               );
            })}
          </View>
          <View className="h-40 bg-transparent" />
        </View>
      </Animated.ScrollView>

      {/* FIXED Mist Gradient */}
      <LinearGradient
        colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 40,
            zIndex: 10,
        }}
        pointerEvents="none"
      />
    </SafeAreaView>
  );
}
