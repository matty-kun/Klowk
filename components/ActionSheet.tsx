import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { MessageCircle, ClipboardEdit } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type ActionWidgetProps = {
  visible: boolean;
  onClose: () => void;
  onTalkToKala: () => void;
  onLogManually: () => void;
};

export default function ActionWidget({ visible, onClose, onTalkToKala, onLogManually }: ActionWidgetProps) {
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

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 80,
        right: 0,
        opacity: opacityAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        ],
      }}
    >
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 8,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        // Use a wide explicit minimum width to ensure no text wrapping constraints
        minWidth: 220, 
      }}>
        {/* Talk to Kloe */}
        <Pressable onPress={handleTalkToKala}>
          {({ pressed }) => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: pressed ? '#FFF7F0' : 'transparent',
            }}>
              <MessageCircle size={20} color="#FF5A00" />
              <Text 
                numberOfLines={1} 
                style={{ 
                  fontSize: 16, 
                  fontWeight: '700', 
                  color: '#121212', 
                  marginLeft: 16 
                }}
              >
                Talk to Kloe
              </Text>
            </View>
          )}
        </Pressable>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 12, marginVertical: 2 }} />

        {/* Log manually */}
        <Pressable onPress={handleLogManually}>
          {({ pressed }) => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: pressed ? '#f9fafb' : 'transparent',
            }}>
              <ClipboardEdit size={20} color="#4b5563" />
              <Text 
                numberOfLines={1} 
                style={{ 
                  fontSize: 16, 
                  fontWeight: '700', 
                  color: '#121212', 
                  marginLeft: 16 
                }}
              >
                Log manually
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}
