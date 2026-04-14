import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Text, Animated, Easing, PanResponder, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Square, Home, History, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useTracking } from '@/context/TrackingContext';
import ActionSheet from '@/components/ActionSheet';
import { View as MotiView } from 'moti';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useColorScheme } from 'nativewind';

// Import our tab screens directly
import TabOneScreen from './index';
import LogsScreen from './history';
import ReportsScreen from './reports';

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

// Draggable Floating Widget
function FloatingTrackerWidget() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { currentActivity } = useTracking();
  const [nowMs, setNowMs] = useState(Date.now());
  
  const pan = useRef(new Animated.ValueXY({ x: 50, y: 100 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value || 0,
          y: (pan.y as any)._value || 0
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentActivity) {
      interval = setInterval(() => setNowMs(Date.now()), 1000);
    }
    return () => clearInterval(interval);
  }, [currentActivity]);

  if (!currentActivity) return null;

  const elapsed = Math.floor((nowMs - currentActivity.start_time) / 1000);
  let timeStr = '';
  if (currentActivity.target_duration) {
    const remaining = Math.max(0, currentActivity.target_duration - elapsed);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          position: 'absolute',
          zIndex: 9999,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          left: -110,
        }
      ]}
    >
      <MotiView from={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/tracker');
          }}
          style={{
            backgroundColor: isDark ? '#1C1C1E' : '#fff',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? '#2c2c2e' : '#eee',
            shadowColor: '#FF5A00',
            shadowOpacity: 0.15,
            shadowRadius: 15,
            elevation: 10
          }}
        >
          <MotiView animate={{ translateY: [0, -4, 0] }} transition={{ loop: true, duration: 2000, type: 'timing' }}>
            <Image source={require('../../assets/images/idle-mascot.svg')} style={{ width: 30, height: 30, marginRight: 8 }} contentFit="contain" />
          </MotiView>
          <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#fff' : '#121212', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
            {timeStr}
          </Text>
        </Pressable>
      </MotiView>
    </Animated.View>
  );
}

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

          const icons: Record<string, any> = { index: Home, history: History, reports: BarChart3 };
          const labels: Record<string, string> = { index: 'Home', history: 'History', reports: 'Data' };
          
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
      <FloatingTrackerWidget />
      
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
            <Tab.Screen name="history" component={TabLogsWrapper} />
            <Tab.Screen name="reports" component={TabReportsWrapper} />
        </Tab.Navigator>
    </View>
  );
}

// Wrappers to ensure screens are treated as components for the Navigator
function TabLogsWrapper() { return <LogsScreen />; }
function TabReportsWrapper() { return <ReportsScreen />; }
