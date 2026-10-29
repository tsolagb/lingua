import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function Layout() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 54 : insets.bottom + 60,
          paddingBottom: Platform.OS === 'web' ? 6 : insets.bottom + 2,
          paddingTop: Platform.OS === 'web' ? 6 : 4,
          paddingHorizontal: 28,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="home" size={size} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Grades',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="ribbon" size={size} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="bar-chart" size={size} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="heart" size={size} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
    </Tabs>
  );
}
