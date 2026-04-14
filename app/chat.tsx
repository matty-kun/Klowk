import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Dimensions, Animated, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Send, Sparkles, Mic, Paperclip } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'klowk';
  timestamp: Date;
}

export default function ChatScreen() {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const isDark = colorScheme === 'dark';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey! I'm Klowk, your personal focus coach. How can I help you stay on track today?",
      sender: 'klowk',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate Klowk typing
    setIsTyping(true);
    setTimeout(() => {
        const klowkResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: getKlowkResponse(inputText),
            sender: 'klowk',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, klowkResponse]);
        setIsTyping(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  const getKlowkResponse = (text: string) => {
    const input = text.toLowerCase();
    if (input.includes('focus')) return "Focus is a muscle! Try a 25-minute sprint with me right now. Shall we start?";
    if (input.includes('tired') || input.includes('exhausted')) return "It sounds like you need a strategic recovery session. Have you tried the 5-minute deep breathing technique?";
    if (input.includes('hello') || input.includes('hi')) return "Hello! Ready to conquer your goals today?";
    return "That's an interesting perspective. How does that align with your deep work sessions today?";
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
      >
        <View className="flex-1 bg-white dark:bg-klowk-black">
            {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900">
            <ArrowLeft size={20} color={isDark ? '#fff' : '#121212'} />
          </Pressable>
          <View className="items-center">
            <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-lg font-black text-klowk-black dark:text-white">{t('talk_to_klowk')}</Text>
            </View>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6 pt-6 bg-white dark:bg-klowk-black"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => (
            <Animated.View 
              key={msg.id} 
              style={{ opacity: fadeAnim }}
              className={`mb-6 flex-row ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'klowk' && (
                <View className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-900 mr-3 items-center justify-center overflow-hidden border border-gray-100 dark:border-zinc-800">
                    <Image source={require('../assets/images/idle-mascot.svg')} style={{ width: 24, height: 24 }} contentFit="contain" />
                </View>
              )}
              
              <View 
                className={`max-w-[80%] p-4 rounded-[24px] ${
                  msg.sender === 'user' 
                    ? 'bg-klowk-black dark:bg-zinc-800 rounded-tr-none' 
                    : 'bg-gray-50 dark:bg-zinc-900 rounded-tl-none'
                }`}
              >
                <Text className={`text-sm font-semibold leading-5 ${msg.sender === 'user' ? 'text-white' : 'text-klowk-black dark:text-white'}`}>
                  {msg.text}
                </Text>
              </View>
            </Animated.View>
          ))}

          {isTyping && (
             <View className="mb-6 flex-row justify-start">
                <View className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-900 mr-3 items-center justify-center border border-gray-100 dark:border-zinc-800">
                    <Image source={require('../assets/images/idle-mascot.svg')} style={{ width: 24, height: 24 }} contentFit="contain" />
                </View>
                <View className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-[24px] rounded-tl-none">
                    <Text className="text-gray-400 dark:text-zinc-600 font-black">...</Text>
                </View>
             </View>
          )}
          <View className="h-10" />
        </ScrollView>

        {/* Input Bar */}
        <View className="p-6 border-t border-gray-50 dark:border-zinc-800 pb-10 bg-white dark:bg-klowk-black">
          <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900 rounded-[30px] px-5 py-3 border border-gray-100 dark:border-zinc-800">
            <TextInput 
              className="flex-1 text-sm font-bold text-klowk-black dark:text-white"
              placeholder={t('ask_anything')}
              placeholderTextColor={isDark ? '#52525b' : '#9ca3af'}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            {inputText.trim().length > 0 && (
                <Pressable 
                    onPress={handleSend}
                    className="w-10 h-10 rounded-full bg-klowk-orange items-center justify-center ml-2"
                >
                    <Send size={18} color="white" />
                </Pressable>
            )}
          </View>
          <Text className="text-center text-[8px] font-bold text-gray-300 dark:text-zinc-700 mt-4 uppercase tracking-[1px]">
            {t('klowk_mistakes')}
          </Text>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
