import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated, Easing } from 'react-native';
import { Edit2, Copy, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';

type LogActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  title?: string;
};

export default function LogActionSheet({ visible, onClose, onEdit, onDuplicate, onDelete, title }: LogActionSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showModal, setShowModal] = React.useState(visible);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, slideAnim, backdropAnim]);

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end', opacity: backdropAnim }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => { impact(ImpactFeedbackStyle.Light); onClose(); }}
        />
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-t-[32px] px-6 pt-4 pb-10"
          >
            {/* Handle Bar */}
            <View className="self-center w-10 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full mb-6" />

            <Text className="text-xl font-black text-klowk-black dark:text-white italic mb-5">
              {title || 'Log Actions'}
            </Text>

            {/* Edit */}
            <Pressable onPress={() => { impact(ImpactFeedbackStyle.Medium); onClose(); onEdit(); }}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-center py-3.5 px-1 rounded-2xl ${pressed ? 'bg-gray-50 dark:bg-zinc-800' : ''}`}>
                  <Edit2 size={20} color={isDark ? '#e5e7eb' : '#121212'} />
                  <Text className="text-base font-bold text-klowk-black dark:text-white ml-4">Edit details</Text>
                </View>
              )}
            </Pressable>

            {onDuplicate && (
              <>
                <View className="h-[1px] bg-gray-50 dark:bg-zinc-800 my-1" />
                <Pressable onPress={() => { impact(ImpactFeedbackStyle.Medium); onClose(); onDuplicate(); }}>
                  {({ pressed }) => (
                    <View className={`flex-row items-center justify-center py-3.5 px-1 rounded-2xl ${pressed ? 'bg-gray-50 dark:bg-zinc-800' : ''}`}>
                      <Copy size={20} color={isDark ? '#9ca3af' : '#4b5563'} />
                      <Text className="text-base font-bold text-klowk-black dark:text-white ml-4">Duplicate activity</Text>
                    </View>
                  )}
                </Pressable>
              </>
            )}

            <View className="h-[1px] bg-gray-50 dark:bg-zinc-800 my-1" />

            {/* Delete */}
            <Pressable onPress={() => { notification(NotificationFeedbackType.Warning); onClose(); onDelete(); }}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-center py-3.5 px-1 rounded-2xl ${pressed ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                  <Trash2 size={20} color="#ef4444" />
                  <Text className="text-base font-bold text-red-500 ml-4">Delete forever</Text>
                </View>
              )}
            </Pressable>

            {/* Cancel */}
            <View className="h-[1px] bg-gray-50 dark:bg-zinc-800 my-2" />
            <Pressable onPress={() => { impact(ImpactFeedbackStyle.Light); onClose(); }}>
              {({ pressed }) => (
                <View className={`items-center justify-center py-3.5 rounded-2xl ${pressed ? 'bg-gray-50 dark:bg-zinc-800' : ''}`}>
                  <Text className="text-base font-bold text-gray-400 dark:text-zinc-600">Cancel</Text>
                </View>
              )}
            </Pressable>

          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
