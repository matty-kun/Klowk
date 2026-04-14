import LogActionSheet from '@/components/LogActionSheet';
import { CATEGORIES } from '@/constants/Categories';
import { Activity, useTracking } from '@/context/TrackingContext';
import { formatLogDuration, formatTimestamp } from '@/utils/time';
import {
    BookOpen,
    Briefcase,
    Coffee,
    Heart,
    MoreHorizontal,
    Search,
    Tag,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';

export default React.memo(function LogsScreen() {
  const { activities, deleteActivity, duplicateActivity } = useTracking();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  
  // Filter activities by search (memoized)
  const filtered = React.useMemo(() => {
    return search.trim()
      ? activities.filter((a: Activity) => {
          const q = search.toLowerCase();
          const cat = CATEGORIES.find(c => c.id === a.category);
          return a.title.toLowerCase().includes(q) || (cat?.label || '').toLowerCase().includes(q);
        })
      : activities;
  }, [search, activities]);

  // Group by date (memoized)
  const grouped = React.useMemo(() => {
    return filtered.reduce((acc, curr: Activity) => {
      const date = new Date(curr.created_at).toLocaleDateString(undefined, {
         weekday: 'short', month: 'short', day: 'numeric' 
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {} as Record<string, Activity[]>);
  }, [filtered]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black" edges={['top']}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-4xl font-black text-klowk-black dark:text-white mb-6">{t('history')}</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900 rounded-2xl px-4 py-3 mb-8 border border-gray-100 dark:border-zinc-800">
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('search_logs')}
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-3 text-[13px] font-semibold text-klowk-black dark:text-white"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

      {Object.entries(grouped).length === 0 && search.trim() ? (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <Text style={{ color: '#d1d5db', fontWeight: '700', fontSize: 14 }}>{t('no_logs')} "{search}"</Text>
        </View>
      ) : null}

       {Object.entries(grouped).map(([date, logs]) => (
        <View key={date} className="mb-8">
          <View className="flex-row items-center mb-6">
             <Text className="text-gray-400 dark:text-gray-500 font-bold text-[11px] uppercase tracking-[3px]">{date}</Text>
             <View className="h-[2px] flex-1 bg-gray-50 dark:bg-zinc-900 ml-4 rounded-full" />
          </View>

          {logs.map((log) => {
            const category = CATEGORIES.find(c => c.id === log.category);
            const catColor = category?.color || '#6b7280';
            const Icon = {
              briefcase: Briefcase,
              heart: Heart,
              'book-open': BookOpen,
              coffee: Coffee,
            }[category?.iconName as string] || Tag;

            return (
              <View key={log.id} className="mb-4 bg-white dark:bg-zinc-900 p-5 rounded-[28px] border border-gray-50 dark:border-zinc-800 shadow-sm flex-row items-center">
                  <View style={{ backgroundColor: `${catColor}10` }} className="w-12 h-12 rounded-[16px] items-center justify-center mr-4">
                    <Icon size={20} color={catColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-klowk-black dark:text-white font-bold text-base mb-1">{log.title || t('untitled_session')}</Text>
                    <View className="flex-row items-center">
                      <Text style={{ color: catColor }} className="text-[10px] font-black uppercase mr-2">
                        {t(category?.label.toLowerCase() as any) || t('personal')}
                      </Text>
                      <View className="w-1 h-1 rounded-full bg-gray-100 dark:bg-zinc-800 mr-2" />
                      <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">{formatTimestamp(log.start_time)}</Text>
                    </View>
                  </View>
                  <View className="items-end ml-4">
                    <Text className="text-klowk-black dark:text-white font-black text-lg mb-1">
                      {formatLogDuration(log.start_time, log.end_time, log.duration)}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setSelectedActionLogId(log.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="p-1"
                    >
                      <MoreHorizontal size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={{ height: 160 }} />
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
