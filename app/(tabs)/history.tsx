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

export default function LogsScreen() {
  const { activities, deleteActivity, duplicateActivity } = useTracking();
  const [search, setSearch] = useState('');
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  
  // Filter activities by search
  const filtered = search.trim()
    ? activities.filter((a: Activity) => {
        const q = search.toLowerCase();
        const cat = CATEGORIES.find(c => c.id === a.category);
        return a.title.toLowerCase().includes(q) || (cat?.label || '').toLowerCase().includes(q);
      })
    : activities;

  // Group by date
  const grouped = filtered.reduce((acc, curr: Activity) => {
    const date = new Date(curr.created_at).toLocaleDateString(undefined, {
       weekday: 'short', month: 'short', day: 'numeric' 
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 40 }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 36, fontWeight: '900', color: '#121212', marginBottom: 24 }}>History</Text>

        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 16, px: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 32, borderWidth: 1, borderColor: '#f3f4f6' }}>
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search logs..."
            placeholderTextColor="#9ca3af"
            style={{ flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '600', color: '#121212' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

      {Object.entries(grouped).length === 0 && search.trim() ? (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <Text style={{ color: '#d1d5db', fontWeight: '700', fontSize: 14 }}>No logs match "{search}"</Text>
        </View>
      ) : null}

      {Object.entries(grouped).map(([date, logs]) => (
        <View key={date} style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
             <Text style={{ color: '#9ca3af', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3 }}>{date}</Text>
             <View style={{ height: 2, flex: 1, backgroundColor: '#f9fafb', marginLeft: 16, borderRadius: 1 }} />
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
              <View key={log.id} style={{ marginBottom: 16, backgroundColor: '#fff', padding: 20, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#f9fafb', flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ backgroundColor: `${catColor}10`, width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                    <Icon size={20} color={catColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#121212', fontWeight: '700', fontSize: 16, marginBottom: 4 }}>{log.title || 'Focus Session'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: catColor, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginRight: 8 }}>
                        {category?.label || 'Personal'}
                      </Text>
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#f3f4f6', marginRight: 8 }} />
                      <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>{formatTimestamp(log.start_time)}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                    <Text style={{ color: '#121212', fontWeight: '900', fontSize: 18, marginBottom: 4, textAlign: 'right' }}>
                      {formatLogDuration(log.start_time, log.end_time, log.duration)}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setSelectedActionLogId(log.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ padding: 4 }}
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
    </View>
  );
}
