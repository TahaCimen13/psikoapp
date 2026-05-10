import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';

export default function NewSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addSession, getSessionsByPatient } = useDatabase();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  const [duration, setDuration] = useState('50');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!date.trim()) {
      Alert.alert('Uyarı', 'Tarih zorunludur.');
      return;
    }
    setSaving(true);
    const sessions = await getSessionsByPatient(id);
    const sessionNumber = sessions.length + 1;
    const dateTime = `${date}T${time}:00`;
    await addSession({
      patient_id: id,
      date: dateTime,
      duration: parseInt(duration) || undefined,
      session_number: sessionNumber,
      status: 'completed',
      summary: summary || undefined,
    });
    setSaving(false);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>İptal</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Seans</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.5 }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <Field label="Tarih *">
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2024-01-15" placeholderTextColor={colors.placeholder} keyboardType="numbers-and-punctuation" />
      </Field>

      <Field label="Saat">
        <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="10:00" placeholderTextColor={colors.placeholder} keyboardType="numbers-and-punctuation" />
      </Field>

      <Field label="Süre (dakika)">
        <TextInput style={styles.input} value={duration} onChangeText={setDuration} placeholder="50" placeholderTextColor={colors.placeholder} keyboardType="numeric" />
      </Field>

      <Field label="Seans Özeti">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={summary}
          onChangeText={setSummary}
          placeholder="Bu seansın kısa özeti..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.sm },
  cancel: { color: colors.textSecondary, fontSize: 15 },
  title: { ...typography.h3 },
  saveBtn: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  field: { marginBottom: spacing.md },
  fieldLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder },
  textArea: { minHeight: 100, paddingTop: spacing.sm },
});
