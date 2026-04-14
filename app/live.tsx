import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Clock, 
  Tag, 
  Zap,
  Check,
  Briefcase,
  Heart,
  BookOpen,
  Coffee
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTracking } from '@/context/TrackingContext';
import { CATEGORIES } from '@/constants/Categories';

export default function LiveSessionPage() {
  const router = useRouter();
  const { startTracker } = useTracking();
  
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [category, setCategory] = useState('work');

  const handleStart = async () => {
    if (!title) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const plannedSecs = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    const description = plannedSecs > 0 ? `Target: ${Math.floor(plannedSecs/60)}m ${plannedSecs%60}s` : undefined;
    
    await startTracker(title, category, description, plannedSecs);
    router.replace('/tracker');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <Pressable 
              onPress={() => router.back()}
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#f9fafb', marginRight: 16 }}
            >
              <ArrowLeft size={24} color="#121212" />
            </Pressable>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#121212' }}>Live Session</Text>
          </View>
          
          {/* Title Input */}
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Zap size={14} color="#FF5A00" />
              <Text style={{ marginLeft: 8, fontSize: 10, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Focus Target</Text>
            </View>
            <View style={{ backgroundColor: '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: '#f3f4f6' }}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What are you working on?"
                placeholderTextColor="#9ca3af"
                style={{ padding: 20, fontSize: 16, fontWeight: '700', color: '#121212' }}
              />
            </View>
          </View>

          {/* Duration Section */}
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Clock size={14} color="#9ca3af" />
              <Text style={{ marginLeft: 8, fontSize: 10, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Duration</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  style={{ backgroundColor: '#f9fafb', paddingVertical: 18, paddingHorizontal: 0, borderRadius: 20, fontSize: 16, fontWeight: '900', color: '#121212', textAlign: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}
                />
                <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 8, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Hrs</Text>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  style={{ backgroundColor: '#f9fafb', paddingVertical: 18, paddingHorizontal: 0, borderRadius: 20, fontSize: 16, fontWeight: '900', color: '#121212', textAlign: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}
                />
                <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 8, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Min</Text>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={seconds}
                  onChangeText={setSeconds}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  style={{ backgroundColor: '#f9fafb', paddingVertical: 18, paddingHorizontal: 0, borderRadius: 20, fontSize: 16, fontWeight: '900', color: '#121212', textAlign: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}
                />
                <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 8, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Sec</Text>
              </View>
            </View>
          </View>

          {/* Category Selection */}
          <View style={{ marginBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Tag size={14} color="#9ca3af" />
              <Text style={{ marginLeft: 8, fontSize: 10, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Category</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {CATEGORIES.map((cat) => {
                const Icon = { briefcase: Briefcase, heart: Heart, 'book-open': BookOpen, coffee: Coffee }[cat.iconName as string] || Tag;
                const isSelected = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setCategory(cat.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
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
                    <Icon size={14} color={isSelected ? '#fff' : cat.color} />
                    <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '700', color: isSelected ? '#fff' : '#6b7280' }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Start Button */}
        <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: '#f9fafb' }}>
          <Pressable 
            onPress={handleStart}
            disabled={!title}
            style={{ 
              backgroundColor: !title ? '#f3f4f6' : '#121212',
              paddingVertical: 20,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: !title ? 0 : 0.1,
              shadowRadius: 10,
              elevation: !title ? 0 : 5
            }}
          >
            <Check size={20} color={!title ? '#9ca3af' : '#fff'} style={{ marginRight: 12 }} />
            <Text style={{ color: !title ? '#9ca3af' : '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Launch Focus</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
