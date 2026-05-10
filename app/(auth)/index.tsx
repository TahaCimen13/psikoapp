import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { colors, spacing, radius, typography } from '@/lib/theme';

export default function LockScreen() {
  const { unlock } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePress = async (digit: string) => {
    setError(false);
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      const ok = await unlock(newPin);
      if (!ok) {
        Vibration.vibrate(400);
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 600);
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

      {error && <Text style={styles.errorText}>Yanlış PIN, tekrar deneyin</Text>}

      <View style={styles.pad}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((k, ki) => (
              k === '' ? (
                <View key={ki} style={styles.keyEmpty} />
              ) : k === '⌫' ? (
                <TouchableOpacity key={ki} style={styles.key} onPress={handleDelete}>
                  <Text style={styles.keyDelete}>⌫</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity key={ki} style={styles.key} onPress={() => handlePress(k)}>
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              )
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  top: { alignItems: 'center', marginBottom: spacing.xl },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.small },
  dotsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.accent, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: colors.accent },
  dotError: { borderColor: colors.error, backgroundColor: colors.error },
  errorText: { color: colors.error, fontSize: 13, marginBottom: spacing.md },
  pad: { marginTop: spacing.xl, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.lg },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { width: 72, height: 72 },
  keyText: { fontSize: 24, fontWeight: '600', color: colors.text },
  keyDelete: { fontSize: 22, color: colors.textSecondary },
});
