import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { ASSESSMENT_TESTS } from '@/lib/types';
import type { Assessment } from '@/lib/types';

export default function AssessmentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getAssessmentsByPatient, addAssessment, deleteAssessment } = useDatabase();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [adding, setAdding] = useState(false);
  const [testName, setTestName] = useState('');
  const [customTest, setCustomTest] = useState('');
  const [score, setScore] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const a = await getAssessmentsByPatient(id);
    setAssessments(a);
  }, [id, getAssessmentsByPatient]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const name = testName === 'Diger' ? customTest : testName;
    if (!name.trim()) return;
    await addAssessment({
      patient_id: id,
      test_name: name.trim(),
      score: score ? parseFloat(score) : undefined,
      interpretation: interpretation.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    });
    setTestName(''); setCustomTest(''); setScore(''); setInterpretation(''); setNotes('');
    setAdding(false);
    load();
  };

  const remove = (a: Assessment) => {
    Alert.alert('Değerlendirmeyi Sil', `"${a.test_name}" silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteAssessment(a.id); load(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.title}>Değerlendirmeler</Text>
        <TouchableOpacity style={styles.chartLink} onPress={() => router.push(`/patient/${id}/progress`)}>
          <Text style={styles.chartLinkText}>📈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <Text style={styles.addBtnText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {assessments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📊</Text>
            <Text style={styles.emptyText}>Henüz değerlendirme eklenmemiş</Text>
          </View>
        ) : (
          assessments.map(a => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testName}>{a.test_name}</Text>
                  {a.date ? <Text style={styles.date}>📅 {a.date}</Text> : null}
                </View>
                {a.score !== undefined && a.score !== null ? (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{a.score}</Text>
                  </View>
                ) : null}
                <TouchableOpacity onPress={() => remove(a)}>
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>🗑</Text>
                </TouchableOpacity>
              </View>
              {a.interpretation ? <Text style={styles.interpretation}>{a.interpretation}</Text> : null}
              {a.notes ? <Text style={styles.notesText}>{a.notes}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Değerlendirme Ekle</Text>

              <Text style={styles.label}>Test Seç</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                <View style={styles.chipRow}>
                  {ASSESSMENT_TESTS.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, testName === t && styles.chipActive]} onPress={() => setTestName(t)}>
                      <Text style={[styles.chipText, testName === t && styles.chipTextActive]} numberOfLines={1}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {testName === 'Diger' && (
                <TextInput style={styles.input} value={customTest} onChangeText={setCustomTest} placeholder="Test adı" placeholderTextColor={colors.placeholder} />
              )}

              <TextInput style={styles.input} value={score} onChangeText={setScore} placeholder="Puan / Skor" placeholderTextColor={colors.placeholder} keyboardType="numeric" />
              <TextInput style={styles.input} value={interpretation} onChangeText={setInterpretation} placeholder="Yorum (ör: Orta düzey depresyon)" placeholderTextColor={colors.placeholder} />
              <TextInput style={[styles.input, { minHeight: 80 }]} value={notes} onChangeText={setNotes} placeholder="Ek notlar" placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" />

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => { setAdding(false); setTestName(''); setScore(''); }}>
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={save}>
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  chartLink: { padding: spacing.xs, marginRight: spacing.xs },
  chartLinkText: { fontSize: 20 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: 4 },
  testName: { ...typography.body, fontWeight: '600' },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  scoreBadge: { backgroundColor: colors.accentDim, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, minWidth: 44, alignItems: 'center' },
  scoreText: { color: colors.accent, fontWeight: '700', fontSize: 16 },
  interpretation: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  notesText: { color: colors.textMuted, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder, maxWidth: 200 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
