import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Text, Animated, Easing, PanResponder, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Square, Home, Target, BarChart3, History } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useTracking } from '@/context/TrackingContext';
import ActionSheet from '@/components/ActionSheet';
import { View as MotiView } from 'moti';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useColorScheme } from 'nativewind';

// Import our tab screens directly
import TabOneScreen from './index';
import GoalsScreen from './goals';
import ReportsScreen from './reports';

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');



// Custom Tab Bar component to ensure it looks exactly like our island
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentActivity, stopTracker } = useTracking();
  const [showSheet, setShowSheet] = useState(false);
  const router = useRouter();
  
  const isTimerRunning = !!currentActivity;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTimerRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isTimerRunning]);

  const handlePlusTap = async () => {
    if (isTimerRunning) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await stopTracker();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/live');
    }
  };

  return (
    <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', zIndex: 1000 }}>
       <ActionSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onTalkToKala={() => { setShowSheet(false); navigation.navigate('chat'); }}
        onLogManually={() => { setShowSheet(false); navigation.navigate('modal'); }}
      />

      <View style={{ flex: 1, height: 68, backgroundColor: isDark ? 'rgba(28, 28, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)', borderRadius: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8, marginRight: 12 }}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? '#FF5A00' : (isDark ? '#4b5563' : '#d1d5db');

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          };

          const icons: Record<string, any> = { index: Home, goals: Target, reports: BarChart3 };
          const labels: Record<string, string> = { index: 'Home', goals: 'Goals', reports: 'Data' };
          
          const Icon = icons[route.name] || Home;
          const label = labels[route.name] || 'Home';

          return (
            <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={color} strokeWidth={isFocused ? 3 : 2} />
              <Text style={{ color, fontSize: 8, fontWeight: isFocused ? '900' : '700', marginTop: 4, textTransform: 'uppercase' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPress={handlePlusTap}
          onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setShowSheet(true); }}
          delayLongPress={400}
          style={{ width: 68, height: 68, backgroundColor: isTimerRunning ? (isDark ? '#fff' : '#121212') : '#FF5A00', borderRadius: 34, alignItems: 'center', justifyContent: 'center', elevation: 10 }}
        >
          {isTimerRunning ? <Square size={24} color={isDark ? '#121212' : '#fff'} fill={isDark ? '#121212' : '#fff'} strokeWidth={0} /> : <Plus size={32} color="#fff" strokeWidth={3} />}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff' }}>

      
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            tabBarPosition="bottom"
            screenOptions={{
            swipeEnabled: true,
            lazy: true,
            }}
            initialRouteName="index"
        >
            <Tab.Screen name="index" component={TabOneScreen} />
            <Tab.Screen name="goals" component={GoalsScreen} />
            <Tab.Screen name="reports" component={ReportsScreen} />
        </Tab.Navigator>
    </View>
  );
}

