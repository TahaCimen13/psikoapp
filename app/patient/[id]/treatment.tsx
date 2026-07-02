import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { generateCaseFormulation, suggestInterventions } from '@/lib/claude';

const APPROACHES = ['BDT', 'DBT', 'ACT', 'Psikodinamik', 'EMDR', 'Diger'];

export default function TreatmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTreatmentPlan, saveTreatmentPlan, getPatient, getDiagnosesByPatient, getSessionsByPatient, getAssessmentsByPatient, settings } = useDatabase();
  const [approach, setApproach] = useState('');
  const [goals, setGoals] = useState('');
  const [interventions, setInterventions] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const plan = await getTreatmentPlan(id);
    if (plan) {
      setApproach(plan.approach || '');
      setGoals(plan.goals || '');
      setInterventions(plan.interventions || '');
      setNotes(plan.notes || '');
    }
    setLoaded(true);
  }, [id, getTreatmentPlan]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    await saveTreatmentPlan({ patient_id: id, approach: approach || undefined, goals: goals || undefined, interventions: interventions || undefined, notes: notes || undefined });
    setSaving(false);
    Alert.alert('Kaydedildi', 'Tedavi planı güncellendi.');
  };

  const generateFormulation = async () => {
    if (!settings.claude_api_key) {
      Alert.alert('API Anahtarı Eksik', 'Ayarlardan Claude API anahtarı ekleyin.');
      return;
    }
    setGenerating(true);
    try {
      const [patient, diagnoses, sessions, assessments] = await Promise.all([
        getPatient(id), getDiagnosesByPatient(id), getSessionsByPatient(id), getAssessmentsByPatient(id),
      ]);
      if (!patient) return;
      const result = await generateCaseFormulation(settings.claude_api_key, patient, diagnoses, sessions, assessments);
      setGoals(prev => prev ? prev + '\n\n--- AI Formülasyonu ---\n' + result : result);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateSuggestions = async () => {
    if (!settings.claude_api_key) {
      Alert.alert('API Anahtarı Eksik', 'Ayarlardan Claude API anahtarı ekleyin.');
      return;
    }
    setGenerating(true);
    try {
      const [patient, diagnoses] = await Promise.all([getPatient(id), getDiagnosesByPatient(id)]);
      if (!patient) return;
      const result = await suggestInterventions(settings.claude_api_key, patient, diagnoses, approach);
      setInterventions(prev => prev ? prev + '\n\n--- AI Önerileri ---\n' + result : result);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!loaded) return <View style={styles.container}><ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} /></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.title}>Tedavi Planı</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? '...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Terapi Yaklaşımı</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          <View style={styles.chipRow}>
            {APPROACHES.map(a => (
              <TouchableOpacity key={a} style={[styles.chip, approach === a && styles.chipActive]} onPress={() => setApproach(a === approach ? '' : a)}>
                <Text style={[styles.chipText, approach === a && styles.chipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.aiRow}>
          <Text style={styles.label}>Hedefler & Formülasyon</Text>
          <TouchableOpacity style={styles.aiBtn} onPress={generateFormulation} disabled={generating}>
            <Text style={styles.aiBtnText}>{generating ? '...' : '✨ AI Oluştur'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={[styles.input, { minHeight: 140 }]} value={goals} onChangeText={setGoals} placeholder="Tedavi hedefleri, vaka formülasyonu..." placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" />

        <View style={styles.aiRow}>
          <Text style={styles.label}>Müdahale Teknikleri</Text>
          <TouchableOpacity style={styles.aiBtn} onPress={generateSuggestions} disabled={generating}>
            <Text style={styles.aiBtnText}>{generating ? '...' : '✨ AI Öner'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={[styles.input, { minHeight: 140 }]} value={interventions} onChangeText={setInterventions} placeholder="Kullanılacak teknikler, egzersizler..." placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" />

        <Text style={styles.label}>Ek Notlar</Text>
        <TextInput style={[styles.input, { minHeight: 80 }]} value={notes} onChangeText={setNotes} placeholder="İlaç takibi, konsültasyon notları..." placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 40 },
  label: { ...typography.label, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  aiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  aiBtn: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  aiBtnText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.md },
});
