import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_ITEMS = [
  { name: 'index', title: 'Ana Sayfa', icon: 'home' },
  { name: 'workouts', title: 'Antrenman', icon: 'fitness-center' },
  { name: 'tracking', title: 'Takip', icon: 'query-stats' },
  { name: 'motivation', title: 'Motivasyon', icon: 'emoji-events' },
  { name: 'profile', title: 'Profil', icon: 'person' },
] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useAuth();
  const activeColor = Colors[colorScheme ?? 'light'].tint;
  const tabBarHeight = Platform.select({ ios: 84, default: 72 });

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        sceneStyle: { backgroundColor: '#030712' },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: 20, default: 8 }),
          backgroundColor: '#111827',
          borderTopColor: '#1F2937',
          borderTopWidth: 1,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarAllowFontScaling: false,
      }}>
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <MaterialIcons size={focused ? 25 : 23} name={tab.icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
