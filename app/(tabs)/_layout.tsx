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
            tabBarInactiveTintColor: '#121212',
            headerShown: false,
            tabBarStyle: {
              position: 'absolute',
              bottom: 15,
              left: 20,
              right: 115,
              backgroundColor: 'rgba(255, 255, 255, 0.92)', // Much cleaner white glass
              borderRadius: 32,
              height: 64,
              borderTopWidth: 0,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.8)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 15,
              elevation: 8,
            },
            tabBarShowLabel: true,
            tabBarLabelStyle: {
              fontWeight: '900',
              fontSize: 11,
              marginBottom: 10,
              textTransform: 'uppercase',
            },
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
            href: null,
          }}
        />
      </Tabs>

      {/* Global Inline Plus Button - Floating above Navbar (Right) */}
      <Link href="/modal" asChild>
        <Pressable 
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          style={{
            position: 'absolute',
            bottom: 100, // Moved higher for better breathing room
            right: 20,
            width: 68,
            height: 68,
            backgroundColor: 'rgba(255, 90, 0, 0.9)',
            borderRadius: 34,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            shadowColor: '#FF5A00',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <Plus size={32} color="#ffffff" strokeWidth={3} />
        </Pressable>
      </Link>
    </View>
  );
}
