import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { wipeAllData } from '@/lib/database';
import { colors, spacing, radius, typography } from '@/lib/theme';

export default function LockScreen() {
  const { unlock, removePIN } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // PIN doğrulanmadan sıfırlama = tüm klinik verilerin silinmesi.
  // Aksi halde kilit ekranı tek dokunuşla atlatılabilirdi.
  const forgotPIN = () => {
    Alert.alert(
      "PIN'i mi unuttunuz?",
      'Güvenlik nedeniyle PIN yalnızca tüm uygulama verileri (danışanlar, seanslar, notlar) silinerek sıfırlanabilir. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Verileri Sil ve Sıfırla',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Emin misiniz?', 'TÜM veriler kalıcı olarak silinecek.', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Evet, hepsini sil',
                style: 'destructive',
                onPress: async () => {
                  await wipeAllData();
                  await removePIN();
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const handlePress = async (digit: string) => {
    if (pin.length >= 4) return;
    setError(false);
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      const ok = await unlock(newPin);
      if (!ok) {
        Vibration.vibrate(400);
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 800);
      }
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError(false);
  };

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Uygulamayı Aç</Text>
        <Text style={styles.subtitle}>4 haneli PIN'inizi girin</Text>
      </View>

      <View style={styles.dotsRow}>
        {dots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled && styles.dotFilled, error && styles.dotError]} />
        ))}
      </View>

      <Text style={[styles.errorText, !error && { opacity: 0 }]}>Yanlış PIN, tekrar deneyin</Text>

      <View style={styles.pad}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((k, ki) => (
              k === '' ? (
                <View key={ki} style={styles.keyEmpty} />
              ) : k === '⌫' ? (
                <TouchableOpacity key={ki} style={styles.key} onPress={handleDelete} activeOpacity={0.6}>
                  <Text style={styles.keyDelete}>⌫</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity key={ki} style={styles.key} onPress={() => handlePress(k)} activeOpacity={0.6}>
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              )
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={forgotPIN} style={styles.resetBtn} activeOpacity={0.6}>
        <Text style={styles.resetText}>PIN'i unuttum</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'space-evenly', padding: spacing.lg },
  top: { alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: spacing.sm },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.small },
  dotsRow: { flexDirection: 'row', gap: spacing.lg },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.accent, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: colors.accent },
  dotError: { borderColor: colors.error, backgroundColor: colors.error },
  errorText: { color: colors.error, fontSize: 13 },
  pad: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.lg },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { width: 72, height: 72 },
  keyText: { fontSize: 24, fontWeight: '600', color: colors.text },
  keyDelete: { fontSize: 22, color: colors.textSecondary },
  resetBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  resetText: { color: colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },
});
