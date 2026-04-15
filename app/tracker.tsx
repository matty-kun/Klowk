import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Play, 
  Pause, 
  Minimize2,
  Square
} from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTracking } from '@/context/TrackingContext';
import { formatLiveDuration } from '@/utils/time';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { View as MotiView } from 'moti';
import { useColorScheme } from 'nativewind';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

export default function TrackerPage() {
  const router = useRouter();
  const { currentActivity, stopTracker } = useTracking();
  const [isPaused, setIsPaused] = useState(false);
  const [accumulatedSecs, setAccumulatedSecs] = useState(0);

  const radius = (CIRCLE_SIZE / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const progressShared = useSharedValue(1);

  // Initialize accumulatedSecs once
  useEffect(() => {
    if (currentActivity) {
      const initialElapsed = Math.floor((Date.now() - currentActivity.start_time) / 1000);
      setAccumulatedSecs(initialElapsed);
    }
  }, []);

  // Sync with main navigation
  useEffect(() => {
    if (!currentActivity) {
      router.replace('/(tabs)');
    }
  }, [currentActivity]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentActivity && !isPaused) {
      interval = setInterval(() => {
        setAccumulatedSecs(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentActivity, isPaused]);

  // Handle Smooth Animation
  useEffect(() => {
    if (currentActivity?.target_duration) {
      const targetSecs = currentActivity.target_duration;
      const p = Math.max(0, 1 - (accumulatedSecs / targetSecs));
      progressShared.value = withTiming(p, { duration: 1000, easing: Easing.linear });
    } else {
      const secInMin = (accumulatedSecs % 60) / 60;
      progressShared.value = withTiming(1 - secInMin, { duration: 1000, easing: Easing.linear });
    }
  }, [accumulatedSecs, currentActivity]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressShared.value)
  }));

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!currentActivity) return null;
  
  const targetSecs = currentActivity.target_duration || 0;
  const isCountdown = targetSecs > 0;
  
  let displayTime = '';
  if (isCountdown) {
    const remaining = Math.max(0, targetSecs - accumulatedSecs);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const h = Math.floor(m / 60);
    displayTime = h > 0 
      ? `${h}:${(m % 60).toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    // Custom formatting for count-up
    const h = Math.floor(accumulatedSecs / 3600);
    const m = Math.floor((accumulatedSecs % 3600) / 60);
    const s = accumulatedSecs % 60;
    displayTime = h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const handleStop = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await stopTracker();
    router.replace('/(tabs)');
  };

  const togglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(!isPaused);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.minimizeBtn}>
          <Minimize2 size={24} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
        </Pressable>
      </View>

      <MotiView 
        from={{ opacity: 0, scale: 0.85, translateY: 30 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        style={styles.content}
      >
        <View style={styles.mascotContainer}>
          <Image source={require('../assets/images/idle-mascot.svg')} style={styles.mascot} contentFit="contain" />
        </View>

        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={radius}
              stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              strokeWidth="10"
              fill="transparent"
            />
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={radius}
              stroke="#FFD700"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="90"
              scaleX={-1}
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>
          
          <View style={styles.timeOverlay}>
            <Text style={[styles.timerText, { color: isDark ? '#fff' : '#121212' }]}>{displayTime}</Text>
            <Text style={styles.titleText}>{currentActivity.title}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable 
            onPress={togglePause}
            style={[styles.controlBtn, { backgroundColor: '#FFD700' }]}
          >
            {isPaused ? <Play size={24} color="#121212" fill="#121212" /> : <Pause size={24} color="#121212" fill="#121212" />}
          </Pressable>
          
          <Pressable 
            onPress={handleStop}
            style={[styles.controlBtn, { backgroundColor: isDark ? '#fff' : '#121212', marginLeft: 20 }]}
          >
            <Square size={20} color={isDark ? '#121212' : '#fff'} fill={isDark ? '#121212' : '#fff'} />
          </Pressable>
        </View>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  minimizeBtn: {
    padding: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  mascotContainer: {
    marginBottom: -40,
    zIndex: 10,
  },
  mascot: {
    width: 140,
    height: 140,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 54,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF5A00',
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 60,
    alignItems: 'center',
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  }
});
