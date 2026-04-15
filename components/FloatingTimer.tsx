import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  PanResponder, 
  Animated, 
  Dimensions, 
  Pressable,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTracking } from '@/context/TrackingContext';
import { Image } from 'expo-image';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_WIDTH = 120;
const BUBBLE_HEIGHT = 48;

export default function FloatingTimer() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentActivity, isMinimized, setIsMinimized } = useTracking();
  const [elapsed, setElapsed] = useState(0);

  // Separate values for X and Y to avoid ValueXY complexities with Native Driver
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH - BUBBLE_WIDTH - 20)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Track absolute values for offset logic
  const lastOffset = useRef({ x: SCREEN_WIDTH - BUBBLE_WIDTH - 20, y: 100 });

  useEffect(() => {
    if (isMinimized && currentActivity) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.5, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isMinimized, currentActivity]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentActivity) {
      setElapsed(Math.floor((Date.now() - currentActivity.start_time) / 1000));
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - currentActivity.start_time) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentActivity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger if movement is significant (avoids blocking taps)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateX.setOffset((translateX as any)._value);
        translateY.setOffset((translateY as any)._value);
        translateX.setValue(0);
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        { useNativeDriver: true }
      ),
      onPanResponderRelease: () => {
        translateX.flattenOffset();
        translateY.flattenOffset();
        
        let nx = (translateX as any)._value;
        let ny = (translateY as any)._value;

        // Snap to boundaries
        if (nx < 20) nx = 20;
        if (nx > SCREEN_WIDTH - BUBBLE_WIDTH - 20) nx = SCREEN_WIDTH - BUBBLE_WIDTH - 20;
        if (ny < 50) ny = 50;
        if (ny > SCREEN_HEIGHT - 120) ny = SCREEN_HEIGHT - 120;

        Animated.spring(translateX, { toValue: nx, useNativeDriver: true }).start();
        Animated.spring(translateY, { toValue: ny, useNativeDriver: true }).start();
        lastOffset.current = { x: nx, y: ny };
      }
    })
  ).current;

  if (!isMinimized || !currentActivity) return null;

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const h = Math.floor(m / 60);
  
  let timeStr = '';
  const targetSecs = currentActivity.target_duration || 0;
  
  if (targetSecs > 0) {
    const remaining = Math.max(0, targetSecs - elapsed);
    const rm = Math.floor(remaining / 60);
    const rs = remaining % 60;
    const rh = Math.floor(rm / 60);
    timeStr = rh > 0 
      ? `${rh}:${(rm % 60).toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`
      : `${rm.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  } else {
    timeStr = h > 0 
      ? `${h}:${(m % 60).toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMinimized(false);
    router.push('/tracker');
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        zIndex: 9999,
        width: BUBBLE_WIDTH,
        height: BUBBLE_HEIGHT,
        opacity,
        transform: [
          { translateX },
          { translateY },
          { scale }
        ]
      }}
    >
      <Pressable 
        onPress={handlePress}
        style={{
            width: '100%',
            height: '100%',
            borderRadius: 24,
            backgroundColor: isDark ? '#1C1C1E' : '#fff',
            borderWidth: 1.5,
            borderColor: '#FF5A00',
            shadowColor: '#FF5A00',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 15,
            elevation: 10,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
        }}
      >
        <Image 
            source={require('../assets/images/idle-mascot.svg')} 
            style={{ width: 28, height: 28, marginRight: 8 }} 
            contentFit="contain" 
        />
        <View className="flex-1">
            <Text 
                numberOfLines={1}
                className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-tighter"
            >
                {currentActivity.title}
            </Text>
            <Text className="text-klowk-black dark:text-white font-black text-[14px] leading-tight" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {timeStr}
            </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
