import { Tabs } from 'expo-router';
import { colors } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Anasayfa', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="patients"
        options={{ title: 'Hastalar', tabBarIcon: ({ color }) => <TabIcon emoji="👥" color={color} /> }}
      />
      <Tabs.Screen
        name="diagnose"
        options={{ title: 'Tanı', tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'Kütüphane', tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} /> }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{ title: 'AI Asistan', tabBarIcon: ({ color }) => <TabIcon emoji="🤖" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#94a3b8' ? 0.5 : 1 }}>{emoji}</Text>;
}
