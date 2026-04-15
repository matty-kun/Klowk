import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, Modal, Dimensions } from 'react-native';
import { MessageCircle, ClipboardEdit, Timer } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '@/context/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ActionWidgetProps = {
  visible: boolean;
  onClose: () => void;
  onTalkToKala: () => void;
  onLogManually: () => void;
  onStartLiveSession: () => void;
};

export default function ActionWidget({ visible, onClose, onTalkToKala, onLogManually, onStartLiveSession }: ActionWidgetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();
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

  const handleStartLive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onStartLiveSession();
  };

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
        <Pressable 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: 100, 
            right: 20,
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            ],
            zIndex: 10000,
          }}
        >
          <View className="bg-white dark:bg-zinc-900 rounded-[28px] p-2.5 border border-black/5 dark:border-white/5 shadow-2xl min-w-[240px]">
            {/* Start Live Session */}
            <Pressable onPress={handleStartLive}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-start py-4 px-5 rounded-2xl ${pressed ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                  <View className="w-9 h-9 bg-orange-100 dark:bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                    <Timer size={20} color="#FF5A00" strokeWidth={2.5} />
                  </View>
                  <Text className="text-base font-black text-klowk-black dark:text-white">
                    {t('start_live_session')}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Divider */}
            <View className="h-[1px] bg-gray-50 dark:bg-zinc-800 mx-3 my-1" />

            {/* Talk to Kloe */}
            <Pressable onPress={handleTalkToKala}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-start py-4 px-5 rounded-2xl ${pressed ? 'bg-gray-50 dark:bg-zinc-800' : ''}`}>
                   <View className="w-9 h-9 bg-gray-50 dark:bg-zinc-800 rounded-xl items-center justify-center mr-4">
                    <MessageCircle size={20} color={isDark ? '#9ca3af' : '#4b5563'} strokeWidth={2} />
                  </View>
                  <Text className="text-base font-bold text-klowk-black dark:text-white">
                    {t('talk_to_kloe')}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Log manually */}
            <Pressable onPress={handleLogManually}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-start py-4 px-5 rounded-2xl ${pressed ? 'bg-gray-50 dark:bg-zinc-800' : ''}`}>
                   <View className="w-9 h-9 bg-gray-50 dark:bg-zinc-800 rounded-xl items-center justify-center mr-4">
                    <ClipboardEdit size={20} color={isDark ? '#9ca3af' : '#4b5563'} strokeWidth={2} />
                  </View>
                  <Text className="text-base font-bold text-klowk-black dark:text-white">
                    {t('log_manually')}
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
