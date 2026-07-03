import { Tabs } from 'expo-router';
import { colors } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bugün', tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'home' : 'home-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="patients" options={{ title: 'Danışanlar', tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'people' : 'people-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Takvim', tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Kütüphane', tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'library' : 'library-outline'} size={22} color={color} /> }} />
      <Tabs.Screen name="ai-chat" options={{ title: 'Asistan', tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={color} /> }} />
    </Tabs>
  );
}
