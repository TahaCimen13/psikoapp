import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initDatabase } from '@/lib/database';
import { DatabaseProvider } from '@/contexts/database-context';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <DatabaseProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="patient/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="patient/[id]" />
        <Stack.Screen name="patient/[id]/session/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="patient/[id]/session/[sessionId]" />
        <Stack.Screen name="library/[bookId]" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </DatabaseProvider>
  );
}
