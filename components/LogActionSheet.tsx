import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated, Easing } from 'react-native';
import { Edit2, Copy, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type LogActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export default function LogActionSheet({ visible, onClose, onEdit, onDuplicate, onDelete }: LogActionSheetProps) {
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
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(18, 18, 18, 0.4)', justifyContent: 'flex-end', opacity: backdropAnim }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
        />
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 40,
            }}
          >
          {/* Handle Bar */}
          <View style={{ alignSelf: 'center', width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 24 }} />

          <Text style={{ fontSize: 20, fontWeight: '900', color: '#121212', fontStyle: 'italic', marginBottom: 20 }}>
            Log Actions
          </Text>

          {/* Edit */}
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); onEdit(); }}>
            {({ pressed }) => (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderRadius: 16,
                backgroundColor: pressed ? '#f3f4f6' : 'transparent',
              }}>
                <Edit2 size={20} color="#121212" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#121212', marginLeft: 16 }}>Edit details</Text>
              </View>
            )}
          </Pressable>

          <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 }} />

          {/* Duplicate */}
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); onDuplicate(); }}>
            {({ pressed }) => (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderRadius: 16,
                backgroundColor: pressed ? '#f3f4f6' : 'transparent',
              }}>
                <Copy size={20} color="#4b5563" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#121212', marginLeft: 16 }}>Duplicate activity</Text>
              </View>
            )}
          </Pressable>

          <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 }} />

          {/* Delete */}
          <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onClose(); onDelete(); }}>
            {({ pressed }) => (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderRadius: 16,
                backgroundColor: pressed ? '#fef2f2' : 'transparent',
              }}>
                <Trash2 size={20} color="#ef4444" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#ef4444', marginLeft: 16 }}>Delete forever</Text>
              </View>
            )}
          </Pressable>

          {/* Cancel */}
          <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 8 }} />
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}>
            {({ pressed }) => (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: pressed ? '#f3f4f6' : 'transparent',
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#9ca3af' }}>Cancel</Text>
              </View>
            )}
          </Pressable>

          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
