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
    const date = new Date(curr.created_at).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, typeof activities>);

  return (
    <SafeAreaView className="flex-1 bg-klowk-white">
      <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-4xl font-extrabold text-klowk-black mb-8">History</Text>

      {/* Bento Box Dashboard */}
      <View className="flex-row flex-wrap justify-between mb-8">
        <View className="w-[48%] bg-klowk-black p-5 rounded-3xl mb-4 h-40 justify-between">
          <Text className="text-klowk-white/60 text-xs font-bold uppercase">Focus Today</Text>
          <View>
            <Text className="text-klowk-white text-4xl font-black">{totalHours}</Text>
            <Text className="text-klowk-orange text-lg font-bold">Hours</Text>
          </View>
        </View>

        <View className="w-[48%] bg-klowk-orange p-5 rounded-3xl mb-4 h-40 justify-between">
          <Text className="text-klowk-white/60 text-xs font-bold uppercase">Total Sessions</Text>
          <View>
            <Text className="text-klowk-white text-4xl font-black">{activities.length}</Text>
            <Text className="text-klowk-white/80 text-lg font-bold">Logs</Text>
          </View>
        </View>

        <View className="w-full bg-klowk-gray p-6 rounded-3xl h-32 flex-row items-center justify-between border border-gray-100">
          <View>
            <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Weekly Streak</Text>
            <Text className="text-klowk-black text-2xl font-black">4 Days</Text>
          </View>
          <View className="flex-row">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <View 
                key={d} 
                className={`w-6 h-6 rounded-md mr-1 ${d <= 4 ? 'bg-klowk-orange' : 'bg-gray-200'}`} 
              />
            ))}
          </View>
        </View>
      </View>

      <Text className="text-xl font-extrabold text-klowk-black mb-4">Detailed Logs</Text>
      
      {Object.entries(grouped).map(([date, logs]) => (
        <View key={date} className="mb-8">
          <View className="flex-row items-center mb-4">
             <View className="h-[1px] flex-1 bg-gray-100" />
             <Text className="mx-4 text-gray-400 font-bold text-[10px] uppercase tracking-widest">{date}</Text>
             <View className="h-[1px] flex-1 bg-gray-100" />
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
              <View key={log.id} className="mb-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-50">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center flex-1">
                    <View 
                      style={{ backgroundColor: `${catColor}15` }} 
                      className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                    >
                      <Icon size={18} color={catColor} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-klowk-black font-bold text-base leading-5" numberOfLines={1}>{log.title}</Text>
                      <View className="flex-row items-center">
                        <Text style={{ color: catColor }} className="text-[10px] font-black uppercase tracking-tighter mr-2">
                          {category?.label || 'Uncategorized'}
                        </Text>
                        <Text className="text-[10px] text-gray-400 font-bold uppercase">{formatTimestamp(log.start_time)}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-klowk-black font-black text-lg">{formatDuration(log.duration || 0)}</Text>
                  </View>
                </View>
                
                {log.description && (
                  <View className="mt-2 pt-2 border-t border-gray-50">
                    <Text className="text-gray-500 text-xs italic leading-4">{log.description}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
}
