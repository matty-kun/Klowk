import { ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { Settings as SettingsIcon, User, Bell, Shield, CircleHelp, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const sections = [
    { icon: User, label: 'Profile' },
    { icon: Bell, label: 'Notifications' },
    { icon: Shield, label: 'Privacy & Security' },
    { icon: CircleHelp, label: 'Help & Support' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-klowk-white">
      <ScrollView className="px-6 pt-4">
        <Text className="text-4xl font-extrabold text-klowk-black mb-8">Settings</Text>

        <View className="bg-klowk-gray rounded-3xl p-6 mb-8 flex-row items-center border border-gray-100">
           <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm border border-gray-50">
              <User size={30} color="#FF5A00" />
           </View>
           <View>
              <Text className="text-lg font-black text-klowk-black">Premium User</Text>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Klowk Pro Account</Text>
           </View>
        </View>

        {sections.map((item, i) => (
          <Pressable 
            key={i} 
            className="flex-row items-center justify-between py-5 border-b border-gray-50 active:opacity-60"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-4 shadow-sm border border-gray-50">
                <item.icon size={20} color="#121212" />
              </View>
              <Text className="text-base font-bold text-klowk-black">{item.label}</Text>
            </View>
            <ChevronRight size={18} color="#e5e7eb" />
          </Pressable>
        ))}

        <View className="mt-12 mb-20 items-center">
            <Text className="text-gray-300 font-bold text-[10px] uppercase tracking-[4px]">Klowk Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
