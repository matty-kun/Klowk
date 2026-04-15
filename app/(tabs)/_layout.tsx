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
import { useLanguage } from '@/context/LanguageContext';

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
  const { t } = useLanguage();
  const { currentActivity, stopTracker } = useTracking();
  const [showSheet, setShowSheet] = useState(false);
  const router = useRouter();
  
  const isTimerRunning = !!currentActivity;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // All native-driver — no color interpolation
  const morphAnim = useRef(new Animated.Value(isTimerRunning ? 1 : 0)).current;

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

  useEffect(() => {
    Animated.spring(morphAnim, {
      toValue: isTimerRunning ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [isTimerRunning]);

  const plusOpacity  = morphAnim.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: 'clamp' });
  const plusScale    = morphAnim.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0.3], extrapolate: 'clamp' });
  const stopOpacity  = morphAnim.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const stopScale    = morphAnim.interpolate({ inputRange: [0.6, 1], outputRange: [0.3, 1], extrapolate: 'clamp' });
  const btnRotate    = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  // Fade between the two background layers using native driver
  const orangeOpacity = morphAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });
  const darkOpacity   = morphAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: 'clamp' });

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
        onStartLiveSession={() => { setShowSheet(false); router.push('/live'); }}
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
          const labels: Record<string, string> = { index: t('home'), goals: t('goals'), reports: t('data_tab') };
          
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
        >
          <Animated.View style={{
            width: 68, height: 68, borderRadius: 34,
            overflow: 'hidden',
            elevation: 10,
            transform: [{ rotate: btnRotate }],
          }}>
            {/* Orange layer (plus state) */}
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 34, backgroundColor: '#FF5A00', opacity: orangeOpacity }} />
            {/* Dark/white layer (stop state) */}
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 34, backgroundColor: isDark ? '#ffffff' : '#121212', opacity: darkOpacity }} />

            {/* Plus icon */}
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: plusOpacity, transform: [{ scale: plusScale }] }}>
              <Plus size={32} color="#fff" strokeWidth={3} />
            </Animated.View>
            {/* Stop icon */}
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: stopOpacity, transform: [{ scale: stopScale }] }}>
              <Square size={24} color={isDark ? '#121212' : '#fff'} fill={isDark ? '#121212' : '#fff'} strokeWidth={0} />
            </Animated.View>
          </Animated.View>
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

