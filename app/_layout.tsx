import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { initDatabase } from '@/lib/database';
import { DatabaseProvider } from '@/contexts/database-context';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { colors } from '@/lib/theme';
import LockScreen from '@/components/LockScreen';
import { Icon } from '@/components/ui/Icon';

function AppContent() {
  const { isLocked, hasPIN } = useAuth();

  if (hasPIN && isLocked) return <LockScreen />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="patient/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="patient/[id]/session/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="patient/[id]/session/[sessionId]" />
      <Stack.Screen name="patient/[id]/diagnoses" />
      <Stack.Screen name="patient/[id]/assessments" />
      <Stack.Screen name="patient/[id]/homework" />
      <Stack.Screen name="patient/[id]/treatment" />
      <Stack.Screen name="library/[bookId]" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const init = useCallback(() => {
    setInitError(null);
    initDatabase()
      .then(() => setReady(true))
      .catch(e => setInitError(e?.message || 'Veritabanı başlatılamadı.'));
  }, []);

  useEffect(() => { init(); }, [init]);

  if (initError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ marginBottom: 12 }}>
          <Icon name="warning-outline" size={48} color={colors.warning} />
        </View>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Uygulama başlatılamadı</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>{initError}</Text>
        <TouchableOpacity
          onPress={init}
          style={{ backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <DatabaseProvider>
        <StatusBar style="dark" />
        <AppContent />
      </DatabaseProvider>
    </AuthProvider>
  );
}
