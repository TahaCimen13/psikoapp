import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import type { Patient } from '@/lib/types';

export default function NewPatient() {
  const router = useRouter();
  const { addPatient } = useDatabase();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState<Patient['gender']>(undefined);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sessionFee, setSessionFee] = useState('');
  const [background, setBackground] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      setNameError('Danışan adı zorunludur');
      return;
    }
    setNameError('');
    setSaving(true);
    const fee = parseFloat(sessionFee.replace(',', '.'));
    await addPatient({
      name: name.trim(),
      birth_date: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
      gender,
      contact: [phone.trim(), email.trim()].filter(Boolean).join(' / ') || undefined,
      session_fee: Number.isFinite(fee) && fee > 0 ? fee : undefined,
      background: background || undefined,
    });
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
        <Text style={styles.title}>Yeni Danışan</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.5 }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <Field label="Ad Soyad *" error={nameError}>
        <TextInput
          style={[styles.input, nameError ? { borderColor: colors.error } : null]}
          value={name}
          onChangeText={t => { setName(t); if (nameError && t.trim()) setNameError(''); }}
          placeholder="Ad Soyad"
          placeholderTextColor={colors.placeholder}
          autoFocus
        />
      </Field>

      <Field label="Doğum Tarihi">
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Icon name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
            {birthDate
              ? birthDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Tarih seç'}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={birthDate || new Date(1990, 0, 1)}
            mode="date"
            maximumDate={new Date()}
            onChange={(_, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date) setBirthDate(date);
            }}
          />
        )}
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

      <Field label="Telefon">
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="05xx xxx xx xx" placeholderTextColor={colors.placeholder} keyboardType="phone-pad" />
      </Field>

      <Field label="E-posta (opsiyonel)">
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="ornek@eposta.com" placeholderTextColor={colors.placeholder} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      </Field>

      <Field label="Seans Ücreti (TL)">
        <TextInput style={styles.input} value={sessionFee} onChangeText={setSessionFee} placeholder="0" placeholderTextColor={colors.placeholder} keyboardType="numeric" />
      </Field>

      <Field label="Başvuru Nedeni">
        <TextInput style={[styles.input, styles.textArea]} value={background} onChangeText={setBackground} placeholder="Başvuru nedeni..." placeholderTextColor={colors.placeholder} multiline numberOfLines={5} textAlignVertical="top" />
      </Field>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
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
  fieldError: { color: colors.error, fontSize: 12, marginTop: 4 },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder },
  textArea: { minHeight: 120, paddingTop: spacing.sm },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBg, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  dateText: { color: colors.text, fontSize: 15 },
  datePlaceholder: { color: colors.placeholder, fontSize: 15 },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderBtn: { flex: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder },
  genderBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  genderText: { color: colors.textSecondary, fontWeight: '500' },
  genderTextActive: { color: colors.accentLight },
});
