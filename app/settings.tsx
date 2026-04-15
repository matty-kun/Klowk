import React from 'react';
import { View, ScrollView, Pressable, Text, Switch, Platform, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { View as MotiView, AnimatePresence } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Moon, Sun, Info, ChevronRight, Shield, Bell, Heart, Globe, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');

const SettingItem = ({ icon: Icon, label, value, type = 'info', onPress, color = '#FF5A00', destructive = false, isDark, t }: any) => {
    const iconBg = destructive ? (isDark ? '#450a0a' : '#FEF2F2') : '#FF5A0015';
    const iconColor = destructive ? '#EF4444' : '#FF5A00';

    return (
    <Pressable 
        onPress={() => {
            if (type === 'action') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress?.();
            } else if (type === 'switch') {
                onPress?.();
            }
        }}
        className={`flex-row items-center justify-between py-5 px-6 bg-white dark:bg-zinc-900 border-b border-gray-50 dark:border-zinc-800 ${type === 'action' ? 'active:bg-gray-100 dark:active:bg-zinc-800' : ''}`}
    >
        <View className="flex-row items-center flex-1 mr-4">
            <View style={{ backgroundColor: iconBg }} className="w-10 h-10 rounded-xl items-center justify-center mr-4">
                <Icon size={20} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className={`text-base font-bold ${destructive ? 'text-red-500' : 'text-klowk-black dark:text-white'}`}>{label}</Text>
                {label === t('clear_logs') && <Text className="text-[11px] text-red-400 font-medium mt-0.5" numberOfLines={1}>{t('clear_logs_desc')}</Text>}
                {label === t('push_notifications') && <Text className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5" numberOfLines={1}>{t('notifications_desc')}</Text>}
                {label === t('app_version') && <Text className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5" numberOfLines={1}>{t('app_version_desc')}</Text>}
            </View>
        </View>
        <View className="items-end">
            {type === 'switch' ? (
                <View className="w-12 h-6 bg-gray-100 dark:bg-zinc-800 rounded-full p-1 justify-center">
                    <MotiView 
                        animate={{ 
                            translateX: value ? 24 : 0,
                            backgroundColor: value ? '#FF5A00' : (isDark ? '#3f3f46' : '#d1d5db')
                        }}
                        transition={{ type: 'spring', damping: 15, stiffness: 120 }}
                        className="w-4 h-4 rounded-full"
                    />
                </View>
            ) : value ? (
                <Text className="text-gray-400 dark:text-gray-500 font-bold text-sm">{value}</Text>
            ) : null}
        </View>
    </Pressable>
    );
};

import { registerForPushNotificationsAsync } from '@/utils/notifications';
import { useTracking } from '@/context/TrackingContext';

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme, setColorScheme } = useColorScheme();
  const { t, language, setLanguage } = useLanguage();
  const { clearAllActivities } = useTracking();
  const isDarkMode = colorScheme === 'dark';
  const [localIsDark, setLocalIsDark] = React.useState(isDarkMode);
  const [localLang, setLocalLang] = React.useState(language);

  React.useEffect(() => setLocalIsDark(isDarkMode), [isDarkMode]);
  React.useEffect(() => setLocalLang(language), [language]);
  const [notifications, setNotifications] = React.useState(false);
  const [langToggleWidth, setLangToggleWidth] = React.useState(0);
  const [themeToggleWidth, setThemeToggleWidth] = React.useState(0);
  const [notifToggleWidth, setNotifToggleWidth] = React.useState(0);

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            setNotifications(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(t('notifications_enabled'), t('notifications_enabled_desc'));
        }
    } else {
        setNotifications(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-klowk-black" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900">
          <ArrowLeft size={20} color={isDarkMode ? '#fff' : '#121212'} />
        </Pressable>
        <Text className="text-lg font-black text-klowk-black dark:text-white">{t('settings_title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 bg-gray-50/30 dark:bg-klowk-black" showsVerticalScrollIndicator={false}>
        <View className="py-8 items-center bg-white dark:bg-klowk-black mb-8">
            <View className="w-24 h-24 rounded-[32px] bg-gray-50 dark:bg-zinc-900 items-center justify-center mb-4 overflow-hidden border border-gray-100 dark:border-zinc-800">
                <Image source={require('../assets/images/idle-mascot.svg')} style={{ width: 80, height: 80 }} contentFit="contain" />
            </View>
            <Text className="text-2xl font-black text-klowk-black dark:text-white">Klowk</Text>
        </View>

        <View className="mb-8">
            <Text className="px-6 mb-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('appearance_stats')}</Text>
            <View className="bg-white dark:bg-klowk-black border-y border-gray-50 dark:border-zinc-800">
                
                {/* Theme Dual Buttons */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
                    <View style={{ backgroundColor: '#FF5A0015' }} className="w-10 h-10 rounded-[12px] items-center justify-center mr-4">
                        <Moon size={20} color="#FF5A00" />
                    </View>
                    <View className="flex-1 mr-4">
                        <Text className="text-sm font-bold text-klowk-black dark:text-white">{t('dark_mode')}</Text>
                        <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t('dark_mode_desc')}</Text>
                    </View>
                    <View 
                        onLayout={(e) => setThemeToggleWidth(e.nativeEvent.layout.width)}
                        className="w-[120px] flex-row bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-2xl relative"
                    >
                        <MotiView 
                            animate={{ 
                                translateX: (localIsDark ? 1 : 0) * ((themeToggleWidth - 8) / 2)
                            }}
                            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                            style={{ 
                                position: 'absolute', 
                                top: 4, 
                                bottom: 4, 
                                left: 4, 
                                width: (themeToggleWidth - 8) / 2 || '48%', 
                                backgroundColor: isDarkMode ? '#3f3f46' : '#fff', 
                                borderRadius: 12,
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4
                            }}
                        />
                        <TouchableOpacity 
                            onPress={() => {
                                if (!localIsDark) return;
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLocalIsDark(false);
                                setTimeout(() => setColorScheme('light'), 200);
                            }}
                            className="flex-1 py-3 items-center z-10"
                        >
                            <Text className={`text-xs font-black uppercase ${!localIsDark ? 'text-klowk-orange' : 'text-gray-400'}`}>Light</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => {
                                if (localIsDark) return;
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLocalIsDark(true);
                                setTimeout(() => setColorScheme('dark'), 200);
                            }}
                            className="flex-1 py-3 items-center z-10"
                        >
                            <Text className={`text-xs font-black uppercase ${localIsDark ? 'text-klowk-orange' : 'text-gray-400'}`}>Dark</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Language Dual Buttons */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
                    <View style={{ backgroundColor: '#FF5A0015' }} className="w-10 h-10 rounded-[12px] items-center justify-center mr-4">
                        <Globe size={20} color="#FF5A00" />
                    </View>
                    <View className="flex-1 mr-4">
                        <Text className="text-sm font-bold text-klowk-black dark:text-white">{t('default_language')}</Text>
                        <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t('language_desc')}</Text>
                    </View>
                    <View 
                        onLayout={(e) => setLangToggleWidth(e.nativeEvent.layout.width)}
                        className="w-[120px] flex-row bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-2xl relative"
                    >
                        <MotiView 
                            animate={{ 
                                translateX: (localLang === 'en' ? 0 : 1) * ((langToggleWidth - 8) / 2)
                            }}
                            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                            style={{
                                position: 'absolute',
                                top: 4,
                                bottom: 4,
                                left: 4,
                                width: (langToggleWidth - 8) / 2 || '48%',
                                backgroundColor: isDarkMode ? '#3f3f46' : '#fff', 
                                borderRadius: 12,
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4
                            }}
                        />
                        <TouchableOpacity 
                            onPress={() => {
                                if (localLang === 'en') return;
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLocalLang('en');
                                setTimeout(() => setLanguage('en'), 200);
                            }}
                            className="flex-1 py-3 items-center z-10"
                        >
                            <Text className={`text-xs font-black uppercase ${localLang === 'en' ? 'text-klowk-orange' : 'text-gray-400'}`}>English</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => {
                                if (localLang === 'tl') return;
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLocalLang('tl');
                                setTimeout(() => setLanguage('tl'), 200);
                            }}
                            className="flex-1 py-3 items-center z-10"
                        >
                            <Text className={`text-xs font-black uppercase ${localLang === 'tl' ? 'text-klowk-orange' : 'text-gray-400'}`}>Filipino</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Notifications Dual Buttons */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
                    <View style={{ backgroundColor: '#FF5A0015' }} className="w-10 h-10 rounded-[12px] items-center justify-center mr-4">
                        <Bell size={20} color="#FF5A00" />
                    </View>
                    <View className="flex-1 mr-4">
                        <Text className="text-sm font-bold text-klowk-black dark:text-white">{t('push_notifications')}</Text>
                        <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t('notifications_desc')}</Text>
                    </View>
                    <View 
                        onLayout={(e) => setNotifToggleWidth(e.nativeEvent.layout.width)}
                        className="w-[120px] flex-row bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-2xl relative"
                    >
                        <MotiView 
                            animate={{ 
                                translateX: (notifications ? 1 : 0) * ((notifToggleWidth - 8) / 2)
                            }}
                            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                            style={{ 
                                position: 'absolute', 
                                top: 4, 
                                bottom: 4, 
                                left: 4, 
                                width: (notifToggleWidth - 8) / 2 || '48%', 
                                backgroundColor: isDarkMode ? '#3f3f46' : '#fff', 
                                borderRadius: 12,
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4
                            }}
                        />
                        <TouchableOpacity 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleToggleNotifications(false);
                            }}
                            className="flex-1 py-3 items-center z-10"
                        >
                            <Text className={`text-[10px] font-black uppercase ${!notifications ? 'text-klowk-orange' : 'text-gray-400'}`}>Off</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleToggleNotifications(true);
                            }}
                            className="flex-1 py-3 items-center z-10"
                        >
                            <Text className={`text-[10px] font-black uppercase ${notifications ? 'text-klowk-orange' : 'text-gray-400'}`}>On</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>

        <View className="mb-8">
            <Text className="px-6 mb-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('about_klowk')}</Text>
            <View className="bg-white dark:bg-klowk-black border-y border-gray-50 dark:border-zinc-800">
                <SettingItem 
                    icon={Info} 
                    label={t('app_version')} 
                    value="1.0.4 (24)" 
                    type="info"
                    isDark={isDarkMode}
                    t={t}
                />
            </View>
        </View>

        <View className="mb-20">
            <View className="bg-white dark:bg-klowk-black border-y border-gray-50 dark:border-zinc-800">
                <SettingItem 
                    icon={Trash2} 
                    label={t('clear_logs')} 
                    destructive 
                    type="action"
                    isDark={isDarkMode}
                    t={t}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        Alert.alert(t('clear_data_title'), t('clear_data_desc'), [
                            { text: t('cancel'), style: 'cancel' },
                            { text: t('delete'), style: 'destructive', onPress: () => clearAllActivities() }
                        ]);
                    }}
                />
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
