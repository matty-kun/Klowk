import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, Modal, Dimensions } from 'react-native';
import { MessageCircle, ClipboardEdit } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ActionWidgetProps = {
  visible: boolean;
  onClose: () => void;
  onTalkToKala: () => void;
  onLogManually: () => void;
};

export default function ActionWidget({ visible, onClose, onTalkToKala, onLogManually }: ActionWidgetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 15, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 120, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleLogManually = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onLogManually();
  };

  const handleTalkToKala = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onTalkToKala();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Backdrop to capture taps outside */}
        <Pressable 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: 100, // Adjusted to sit above the bottom island
            right: 20,
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            ],
            zIndex: 10000,
          }}
        >
          <View className="bg-white dark:bg-zinc-900 rounded-[24px] p-2 border border-black/5 dark:border-white/5 shadow-2xl min-w-[220px]">
            {/* Talk to Kloe */}
            <Pressable onPress={handleTalkToKala}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-start py-3.5 px-4 rounded-2xl ${pressed ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                  <MessageCircle size={20} color="#FF5A00" />
                  <Text 
                    numberOfLines={1} 
                    className="text-base font-bold text-klowk-black dark:text-white ml-4"
                  >
                    Talk to Kloe
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Divider */}
            <View className="h-[1px] bg-gray-50 dark:bg-zinc-800 mx-3 my-0.5" />

            {/* Log manually */}
            <Pressable onPress={handleLogManually}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-start py-3.5 px-4 rounded-2xl ${pressed ? 'bg-gray-50 dark:bg-zinc-800' : ''}`}>
                  <ClipboardEdit size={20} color={isDark ? '#9ca3af' : '#4b5563'} />
                  <Text 
                    numberOfLines={1} 
                    className="text-base font-bold text-klowk-black dark:text-white ml-4"
                  >
                    Log manually
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
