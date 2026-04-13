import React from 'react';
import { View, Pressable, Text, Dimensions } from 'react-native';
import { Link, withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { Plus, Home, History, BarChart3, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// 1. Create a Custom Swappable Navigator for Expo Router
const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

// 2. Custom Tab Bar to recreate our "Icon Island"
function CustomTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  return (
    <View 
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
      }}
    >
        {/* Main Navigation Island */}
        <View 
            style={{
                flex: 1,
                height: 68,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 34,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
                elevation: 8,
                marginRight: 12,
            }}
        >
        {state.routes.map((route, index) => {
            if (route.name === 'settings') return null;
            const isFocused = state.index === index;

            const onPress = () => {
                const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                }
            };

            const Icon = { index: Home, history: History, reports: BarChart3 }[route.name] || Home;
            const color = isFocused ? '#FF5A00' : '#121212';
            const label = { index: 'Home', history: 'History', reports: 'Data' }[route.name];

            return (
            <Pressable key={route.key} onPress={onPress} className="items-center justify-center flex-1 h-full">
                <Icon size={22} color={color} />
                <Text style={{ color, fontSize: 8, fontWeight: isFocused ? '900' : '600', marginTop: 2, textTransform: 'uppercase' }}>
                    {label}
                </Text>
            </Pressable>
            );
        })}
        </View>

        {/* Integrated Plus Button */}
        <Link href="/modal" asChild>
            <Pressable 
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                style={{
                    width: 68,
                    height: 68,
                    backgroundColor: '#FF5A00',
                    borderRadius: 34,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#FF5A00',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 15,
                    elevation: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                }}
            >
                <Plus size={32} color="#ffffff" strokeWidth={3} />
            </Pressable>
        </Link>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <MaterialTopTabs
        tabBar={(props) => <CustomTabBar {...props} />}
        tabBarPosition="bottom"
        screenOptions={{
           swipeEnabled: true,
        }}
      >
        <MaterialTopTabs.Screen name="index" options={{ title: 'Home' }} />
        <MaterialTopTabs.Screen name="history" options={{ title: 'History' }} />
        <MaterialTopTabs.Screen name="reports" options={{ title: 'Data' }} />
        {/* Settings is NOT in the MaterialTopTabs so it won't be swappable */}
      </MaterialTopTabs>
    </View>
  );
}
