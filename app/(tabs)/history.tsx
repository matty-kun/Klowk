import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { useTracking } from '@/context/TrackingContext';
import { formatDuration, formatTimestamp } from '@/utils/time';
import { 
  Tag,
  Briefcase,
  Heart,
  BookOpen,
  Coffee,
  MoreHorizontal
} from 'lucide-react-native';
import { CATEGORIES } from '@/constants/Categories';

export default function LogsScreen() {
  const { activities, getTotalFocusTimeToday } = useTracking();
  
  const totalMinsToday = getTotalFocusTimeToday();
  const totalHours = (totalMinsToday / 60).toFixed(1);

  // Group by date
  const grouped = activities.reduce((acc, curr) => {
    const date = new Date(curr.created_at).toLocaleDateString(undefined, {
       weekday: 'short', month: 'short', day: 'numeric' 
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, typeof activities>);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-4xl font-extrabold text-klowk-black mb-8">History</Text>

      {/* Bento Box Dashboard */}
      <View className="flex-row flex-wrap justify-between mb-8">
        <View className="w-[48%] bg-klowk-black p-5 rounded-[32px] mb-4 h-44 justify-between relative overflow-hidden shadow-xl">
           {/* Glass Shine */}
           <View 
            className="absolute -top-10 -right-10 w-32 h-32 bg-white/5" 
            style={{ transform: [{ rotate: '45deg' }] }}
           />
          <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Focus Today</Text>
          <View>
            <Text className="text-white text-5xl font-black italic pr-1">{totalHours}</Text>
            <Text className="text-klowk-orange text-xs font-black uppercase tracking-widest mt-1">Hours</Text>
          </View>
        </View>

        <View className="w-[48%] bg-klowk-orange p-5 rounded-[32px] mb-4 h-44 justify-between relative overflow-hidden shadow-xl shadow-klowk-orange/20">
          <Text className="text-white/60 text-[10px] font-black uppercase tracking-widest">Total Sessions</Text>
          <View>
            <Text className="text-white text-5xl font-black italic pr-1">{activities.length}</Text>
            <Text className="text-white/80 text-xs font-black uppercase tracking-widest mt-1">Logs</Text>
          </View>
        </View>

        <View className="w-full bg-white p-6 rounded-[32px] h-32 flex-row items-center justify-between border border-gray-50 shadow-sm">
          <View>
            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Weekly Momentum</Text>
            <Text className="text-klowk-black text-2xl font-black italic pr-2">4 Day Streak</Text>
          </View>
          <View className="flex-row">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <View 
                key={d} 
                className={`w-6 h-8 rounded-lg mr-1.5 ${d <= 4 ? 'bg-klowk-orange' : 'bg-gray-100'}`} 
              />
            ))}
          </View>
        </View>
      </View>

      <Text className="text-sm font-black text-klowk-orange uppercase tracking-widest mb-6">Detailed Logs</Text>
      
      {Object.entries(grouped).map(([date, logs]) => (
        <View key={date} className="mb-8">
          <View className="flex-row items-center mb-6">
             <Text className="text-gray-400 font-extrabold text-[11px] uppercase tracking-[3px]">{date}</Text>
             <View className="h-[2px] flex-1 bg-gray-50 ml-4 rounded-full" />
          </View>

          {logs.map((log) => {
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
              <View key={log.id} className="mb-4 bg-white p-5 rounded-[28px] shadow-sm border border-gray-50 flex-row items-center">
                  <View 
                    style={{ backgroundColor: `${catColor}10` }} 
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                  >
                    <Icon size={20} color={catColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-klowk-black font-bold text-base mb-0.5" numberOfLines={1}>{log.title}</Text>
                    <View className="flex-row items-center">
                      <Text style={{ color: catColor }} className="text-[10px] font-black uppercase tracking-tighter mr-2">
                        {category?.label || 'Uncategorized'}
                      </Text>
                      <View className="w-1 h-1 rounded-full bg-gray-200 mr-2" />
                      <Text className="text-[10px] text-gray-400 font-bold uppercase">{formatTimestamp(log.start_time)}</Text>
                    </View>
                  </View>
                  <View className="items-end ml-2">
                    <Text className="text-klowk-black font-black text-lg italic pr-1">{formatDuration(log.duration || 0)}</Text>
                  </View>
              </View>
            );
          })}
        </View>
      ))}

      {/* Bottom Spacer for Floating Navbar */}
      <View className="h-40 bg-transparent" />
      </ScrollView>
    </SafeAreaView>
  );
}
