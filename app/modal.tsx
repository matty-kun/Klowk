import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Clock, 
  Calendar as CalendarIcon, 
  Tag, 
  AlignLeft, 
  Zap,
  Check,
  Briefcase,
  Heart,
  BookOpen,
  Coffee,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTracking } from '@/context/TrackingContext';
import { CATEGORIES } from '@/constants/Categories';

export default function EntryModal() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const { addManualActivity, startTracker, editActivity, activities } = useTracking();
  
  // Form State
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('work');
  const [description, setDescription] = useState('');

  // Initial Data Population for Edit Mode
  useEffect(() => {
    if (editId) {
      const activityToEdit = activities.find(a => a.id === Number(editId));
      if (activityToEdit) {
        setTitle(activityToEdit.title);
        setCategory(activityToEdit.category || 'work');
        setDescription(activityToEdit.description || '');
        setDate(new Date(activityToEdit.start_time));
        if (activityToEdit.duration) {
          setHours(Math.floor(activityToEdit.duration / 3600).toString());
          setMinutes(Math.floor((activityToEdit.duration % 3600) / 60).toString());
          setSeconds((activityToEdit.duration % 60).toString());
        }
      }
    }
  }, [editId]);
  
  // Custom Calendar Logic
  const [viewedMonth, setViewedMonth] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const days = getDaysInMonth(viewedMonth);
  const monthName = viewedMonth.toLocaleString('default', { month: 'long' });
  const yearName = viewedMonth.getFullYear();

  const changeMonth = (offset: number) => {
    const newMonth = new Date(viewedMonth.setMonth(viewedMonth.getMonth() + offset));
    setViewedMonth(new Date(newMonth));
  };
  
  const handleSave = async () => {
    if (!title) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const totalSecs = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    
    if (editId && typeof editId === 'string') {
      await editActivity(Number(editId), title, category, totalSecs, description, date);
    } else if (totalSecs > 0) {
      await addManualActivity(title, category, totalSecs, description, date);
    } else {
      await startTracker(title, category, description);
    }
    
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
          {/* Header Area */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <Pressable 
              onPress={() => router.back()}
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#f9fafb', marginRight: 16 }}
            >
              <ArrowLeft size={24} color="#121212" />
            </Pressable>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#121212' }}>{editId ? 'Edit Log' : 'New Log'}</Text>
          </View>
          
          {/* Form Fields */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Manual Details</Text>
            
            {/* Title */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Zap size={14} color="#9ca3af" />
                <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '700', color: '#6b7280' }}>What did you do?</Text>
              </View>
              <View style={{ backgroundColor: '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: '#f3f4f6' }}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What are you focusing on?"
                  style={{ padding: 16, fontSize: 16, fontWeight: '700', color: '#121212' }}
                />
              </View>
            </View>

            {/* Duration Row */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Clock size={12} color="#9ca3af" />
                  <Text style={{ marginLeft: 4, fontSize: 8, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase' }}>Hrs</Text>
                </View>
                <TextInput
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  style={{ backgroundColor: '#f9fafb', height: 54, borderRadius: 16, fontSize: 14, fontWeight: '900', color: '#121212', textAlign: 'center', borderWidth: 1, borderColor: '#f3f4f6', paddingHorizontal: 0 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Clock size={12} color="#9ca3af" />
                  <Text style={{ marginLeft: 4, fontSize: 8, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase' }}>Min</Text>
                </View>
                <TextInput
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  style={{ backgroundColor: '#f9fafb', height: 54, borderRadius: 16, fontSize: 14, fontWeight: '900', color: '#121212', textAlign: 'center', borderWidth: 1, borderColor: '#f3f4f6', paddingHorizontal: 0 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Clock size={12} color="#9ca3af" />
                  <Text style={{ marginLeft: 4, fontSize: 8, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase' }}>Sec</Text>
                </View>
                <TextInput
                  value={seconds}
                  onChangeText={setSeconds}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  style={{ backgroundColor: '#f9fafb', height: 54, borderRadius: 16, fontSize: 14, fontWeight: '900', color: '#121212', textAlign: 'center', borderWidth: 1, borderColor: '#f3f4f6', paddingHorizontal: 0 }}
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <CalendarIcon size={12} color="#9ca3af" />
                  <Text style={{ marginLeft: 4, fontSize: 8, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase' }}>Date</Text>
                </View>
                <Pressable 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker(true);
                  }}
                  style={{ backgroundColor: '#f9fafb', height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#121212' }}>
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Modal visible={showDatePicker} transparent animationType="fade">
              <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }} onPress={() => setShowDatePicker(false)}>
                <Pressable style={{ width: '100%', backgroundColor: '#fff', padding: 24, borderRadius: 32 }} onPress={e => e.stopPropagation()}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                    <Pressable onPress={() => changeMonth(-1)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 12 }}>
                      <ChevronLeft size={18} color="#FF5A00" />
                    </Pressable>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ textAlign: 'center', fontWeight: '900', fontSize: 18, color: '#121212' }}>{monthName}</Text>
                      <Text style={{ textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{yearName}</Text>
                    </View>
                    <Pressable onPress={() => changeMonth(1)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 12 }}>
                      <ChevronRight size={18} color="#FF5A00" />
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {['S','M','T','W','T','F','S'].map(d => (
                      <Text key={d} style={{ width: '14.2%', textAlign: 'center', fontSize: 9, fontWeight: '900', color: '#d1d5db', marginBottom: 16 }}>{d}</Text>
                    ))}
                    {days.map((d, i) => (
                      <Pressable 
                        key={i} 
                        onPress={() => { if(d){ setDate(d); setShowDatePicker(false); }}}
                        style={{ width: '14.2%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4, backgroundColor: d?.toDateString() === date.toDateString() ? '#FF5A00' : 'transparent' }}
                      >
                        <Text style={{ fontWeight: '900', color: d?.toDateString() === date.toDateString() ? '#fff' : (d?.toDateString() === new Date().toDateString() ? '#FF5A00' : '#121212') }}>{d ? d.getDate() : ''}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Description */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <AlignLeft size={14} color="#9ca3af" />
                <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '700', color: '#6b7280' }}>Description (Optional)</Text>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="How did it go?"
                multiline
                numberOfLines={3}
                style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f3f4f6', height: 100, textAlignVertical: 'top', fontSize: 14, fontWeight: '600', color: '#121212' }}
              />
            </View>

            {/* Category */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Tag size={14} color="#9ca3af" />
                <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '700', color: '#6b7280' }}>Category</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const Icon = { briefcase: Briefcase, heart: Heart, 'book-open': BookOpen, coffee: Coffee, 'more-horizontal': MoreHorizontal }[cat.iconName as string] || Tag;
                  const isSelected = category === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategory(cat.id)}
                      style={{ 
                        backgroundColor: isSelected ? cat.color : '#f9fafb',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: isSelected ? cat.color : '#f3f4f6'
                      }}
                    >
                      <Icon size={12} color={isSelected ? '#fff' : cat.color} />
                      <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '700', color: isSelected ? '#fff' : '#6b7280' }}>{cat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: '#f9fafb' }}>
          <Pressable 
            onPress={handleSave}
            disabled={!title}
            style={{ 
              backgroundColor: !title ? '#f3f4f6' : '#121212',
              paddingVertical: 20,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Check size={20} color={!title ? '#9ca3af' : '#fff'} style={{ marginRight: 12 }} />
            <Text style={{ color: !title ? '#9ca3af' : '#fff', fontWeight: '900', textTransform: 'uppercase' }}>
              {editId ? 'Save Changes' : ( (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 > 0 ? 'Save Entry' : 'Launch Session')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
