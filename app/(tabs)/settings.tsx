import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { User, Bell, Shield, CircleHelp, ChevronRight, LogOut } from 'lucide-react-native';

export default function SettingsScreen() {
  const sections = [
    { icon: User, label: 'Profile' },
    { icon: Bell, label: 'Notifications' },
    { icon: Shield, label: 'Privacy & Security' },
    { icon: CircleHelp, label: 'Help & Support' },
    { icon: LogOut, label: 'Sign Out', color: '#ef4444' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-4xl font-extrabold text-klowk-black mb-8">Settings</Text>

        {/* Premium Profile Card */}
        <View className="bg-white rounded-[32px] p-6 mb-8 flex-row items-center border border-gray-100 shadow-sm relative overflow-hidden">
           <View className="absolute top-0 right-0 w-24 h-24 bg-klowk-orange/5 rounded-full -mr-8 -mt-8" />
           <View className="w-16 h-16 bg-klowk-black rounded-2xl items-center justify-center mr-4 shadow-md">
              <User size={30} color="#FF5A00" />
           </View>
           <View className="flex-1">
              <Text className="text-xl font-black text-klowk-black pr-2">Premium User</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Klowk Pro Account</Text>
           </View>
           <View className="bg-klowk-orange/10 px-3 py-1 rounded-full">
              <Text className="text-[10px] font-black text-klowk-orange uppercase">Active</Text>
           </View>
        </View>

        {/* Settings List */}
        <View className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
          {sections.map((item, i) => (
            <Pressable 
              key={i} 
              className={`flex-row items-center justify-between p-5 active:opacity-60 ${i !== sections.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <View className="flex-row items-center">
                <View className={`w-10 h-10 items-center justify-center mr-4 rounded-xl ${item.color ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <item.icon size={20} color={item.color || "#121212"} />
                </View>
                <Text className={`text-base font-bold ${item.color ? 'text-red-500' : 'text-klowk-black'}`}>{item.label}</Text>
              </View>
              <ChevronRight size={18} color={item.color || "#e5e7eb"} />
            </Pressable>
          ))}
        </View>

        <View className="mt-12 mb-32 items-center">
            <Text className="text-gray-300 font-bold text-[10px] uppercase tracking-[4px]">Klowk Version 1.0.0</Text>
        </View>
        
        {/* Bottom Spacer */}
        <View className="h-32 bg-transparent" />
      </ScrollView>
    </SafeAreaView>
  );
}
