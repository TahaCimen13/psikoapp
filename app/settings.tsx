import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';

export default function Settings() {
  const router = useRouter();
  const { settings, updateSettings } = useDatabase();
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setApiKey(settings.claude_api_key || '');
    setName(settings.psychologist_name || '');
    setTitle(settings.psychologist_title || '');
  }, [settings]);

  const save = async () => {
    setSaving(true);
    await updateSettings({
      claude_api_key: apiKey.trim() || undefined,
      psychologist_name: name.trim() || undefined,
      psychologist_title: title.trim() || undefined,
    });
    setSaving(false);
    Alert.alert('Kaydedildi', 'Ayarlar başarıyla güncellendi.');
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <SectionLabel label="Psikolog Profili" />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Ad Soyad</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Dr. Ad Soyad" placeholderTextColor={colors.placeholder} />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Unvan</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Klinik Psikolog" placeholderTextColor={colors.placeholder} />
      </View>

      <SectionLabel label="AI Asistan" />

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Claude API anahtarınızı Anthropic Console'dan (console.anthropic.com) alabilirsiniz. Anahtar yalnızca cihazınızda saklanır.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Claude API Anahtarı</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-ant-..."
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg, paddingTop: spacing.lg },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { ...typography.h2 },
  sectionLabel: { ...typography.label, marginTop: spacing.lg, marginBottom: spacing.sm },
  field: { marginBottom: spacing.sm },
  fieldLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder },
  infoBox: { backgroundColor: colors.accentDim, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.accent + '44' },
  infoText: { color: colors.accentLight, fontSize: 13, lineHeight: 20 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
