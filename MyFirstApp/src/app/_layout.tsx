import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from '@/context/AppContext';
import { Colors } from '@/constants/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

function TabsNavigator() {
  const systemScheme = useColorScheme();
  const { settings, isLoading } = useApp();
  const insets = useSafeAreaInsets();

  const isDark =
    settings.theme === 'system' ? systemScheme === 'dark' : settings.theme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Safe bottom insets for Android gesture/button navigation and iOS home indicator
  const bottomInset = insets.bottom;
  const paddingBottom = Platform.OS === 'ios'
    ? Math.max(bottomInset, 20)
    : Math.max(bottomInset, 8);
  const tabHeight = (Platform.OS === 'ios' ? 56 : 54) + paddingBottom;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tabActive,
          tabBarInactiveTintColor: theme.tabInactive,
          tabBarStyle: {
            backgroundColor: theme.tabBar,
            borderTopColor: theme.tabBarBorder,
            borderTopWidth: 1,
            height: tabHeight,
            paddingBottom: paddingBottom,
            paddingTop: 8,
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: -0.1,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'checkbox' : 'checkbox-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: 'Roadmaps',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'school' : 'school-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="timer"
          options={{
            title: 'Focus',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'timer' : 'timer-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <TabsNavigator />
    </AppProvider>
  );
}
