import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Plus, Home, History, BarChart3, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FF5A00',
          tabBarInactiveTintColor: '#9ca3af',
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 10,
            left: 20,
            right: 105,
            backgroundColor: '#ffffff',
            borderRadius: 20,
            height: 60,
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontWeight: 'bold',
            fontSize: 10,
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <History size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Data',
            tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
      </Tabs>

      {/* Global Inline Plus Button - Floating above Navbar (Right) */}
      <Link href="/modal" asChild>
        <Pressable 
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          style={{
            position: 'absolute',
            bottom: 85,
            right: 20,
            width: 64,
            height: 64,
            backgroundColor: '#FF5A00',
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <Plus size={28} color="#ffffff" strokeWidth={3} />
        </Pressable>
      </Link>
    </View>
  );
}
