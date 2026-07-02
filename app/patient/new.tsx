import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import type { Patient } from '@/lib/types';

export default function NewPatient() {
  const router = useRouter();
  const { addPatient } = useDatabase();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Patient['gender']>(undefined);
  const [contact, setContact] = useState('');
  const [background, setBackground] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Uyarı', 'Hasta adı zorunludur.');
      return;
    }
    setSaving(true);
    await addPatient({ name: name.trim(), birth_date: birthDate || undefined, gender, contact: contact || undefined, background: background || undefined });
    setSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>İptal</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Hasta</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.5 }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <Field label="Ad Soyad *">
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Hasta adı soyadı" placeholderTextColor={colors.placeholder} autoFocus />
      </Field>

      <Field label="Doğum Tarihi">
        <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="1990-01-15" placeholderTextColor={colors.placeholder} keyboardType="numbers-and-punctuation" />
      </Field>

      <Field label="Cinsiyet">
        <View style={styles.genderRow}>
          {(['erkek', 'kadin', 'diger'] as Patient['gender'][]).map(g => (
            <TouchableOpacity key={g!} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{genderLabel(g!)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="İletişim">
        <TextInput style={styles.input} value={contact} onChangeText={setContact} placeholder="Telefon / E-posta" placeholderTextColor={colors.placeholder} keyboardType="phone-pad" />
      </Field>

      <Field label="Başvuru Nedeni / Anamnez">
        <TextInput style={[styles.input, styles.textArea]} value={background} onChangeText={setBackground} placeholder="Hastanın başvuru nedeni, kısa anamnez..." placeholderTextColor={colors.placeholder} multiline numberOfLines={5} textAlignVertical="top" />
      </Field>
    </ScrollView>
    </KeyboardAvoidingView>
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

function genderLabel(g: string) {
  if (g === 'erkek') return 'Erkek';
  if (g === 'kadin') return 'Kadın';
  return 'Diğer';
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
  textArea: { minHeight: 120, paddingTop: spacing.sm },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderBtn: { flex: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  genderBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  genderText: { color: colors.textSecondary, fontWeight: '500' },
  genderTextActive: { color: colors.accentLight },
});
