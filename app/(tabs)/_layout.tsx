import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Text, Animated, Easing } from 'react-native';
import { Tabs } from 'expo-router';
import { Plus, Square, Home, History, BarChart3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTracking } from '@/context/TrackingContext';
import ActionSheet from '@/components/ActionSheet';

// Smart Plus Button with tap/long-press dual behavior
function SmartPlusButton() {
  const { currentActivity, startTracker, stopTracker } = useTracking();
  const [showSheet, setShowSheet] = useState(false);
  const isTimerRunning = !!currentActivity;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTimerRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTimerRunning]);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: showSheet ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 12
    }).start();
  }, [showSheet]);

  const handleTap = async () => {
    if (isTimerRunning) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await stopTracker();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await startTracker('Focus Session', 'work');
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowSheet(true);
  };

  return (
    <>
      {showSheet && (
        <Pressable
          onPress={() => setShowSheet(false)}
          style={{ position: 'absolute', top: -1000, bottom: 0, left: -1000, right: -1000, zIndex: 1 }}
        />
      )}

      <View style={{ zIndex: 2 }}>
        <ActionSheet
          visible={showSheet}
          onClose={() => setShowSheet(false)}
          onTalkToKala={() => console.log('Talk to Kala')}
        />

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            onPress={showSheet ? () => setShowSheet(false) : handleTap}
            onLongPress={handleLongPress}
            delayLongPress={400}
            style={{
              width: 68,
              height: 68,
              backgroundColor: isTimerRunning && !showSheet ? '#121212' : '#FF5A00',
              borderRadius: 34,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: isTimerRunning && !showSheet ? '#121212' : '#FF5A00',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 15,
              elevation: 10,
            }}
          >
            {isTimerRunning && !showSheet ? (
              <Square size={24} color="#ffffff" fill="#ffffff" strokeWidth={0} />
            ) : (
                <Animated.View
                  style={{
                    transform: [{
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '45deg']
                      })
                    }]
                  }}
                >
                  <Plus size={showSheet ? 30 : 32} color="#ffffff" strokeWidth={3} />
                </Animated.View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}

// Custom Tab Bar using standard styles to prevent Interop crashes
function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View 
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
        <View 
            style={{
                flex: 1,
                height: 68,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 34,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
                elevation: 8,
                marginRight: 12,
            }}
        >
        {state.routes.map((route: any, index: number) => {
            const iconMap: Record<string, any> = { index: Home, history: History, reports: BarChart3 };
            const labelMap: Record<string, string> = { index: 'Home', history: 'History', reports: 'Data' };

            if (!labelMap[route.name]) return null;

            const isFocused = state.index === index;
            const onPress = () => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                }
            };

            const Icon = iconMap[route.name] || Home;
            const color = isFocused ? '#FF5A00' : '#121212';
            const label = labelMap[route.name];

            return (
              <Pressable 
                key={route.key} 
                onPress={onPress} 
                style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}
              >
                  <Icon size={22} color={color} />
                  <Text style={{ color, fontSize: 8, fontWeight: isFocused ? '900' : '600', marginTop: 2, textTransform: 'uppercase' }}>
                      {label}
                  </Text>
              </Pressable>
            );
        })}
        </View>

        <SmartPlusButton />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="reports" options={{ title: 'Data' }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
