import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography } from '@/lib/theme';
import { searchDiagnoses } from '@/lib/dsm5';
import type { Diagnosis } from '@/lib/types';

const SEVERITIES: { value: Diagnosis['severity']; label: string }[] = [
  { value: 'hafif', label: 'Hafif' },
  { value: 'orta', label: 'Orta' },
  { value: 'siddetli', label: 'Şiddetli' },
];

export default function DiagnosesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getDiagnosesByPatient, addDiagnosis, deleteDiagnosis } = useDatabase();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [severity, setSeverity] = useState<Diagnosis['severity']>('orta');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const d = await getDiagnosesByPatient(id);
    setDiagnoses(d);
  }, [id, getDiagnosesByPatient]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.length > 1 ? searchDiagnoses(search) : [];

  const selectDiagnosis = (code: string, name: string) => {
    setSelectedCode(code);
    setSelectedName(name);
    setSearch('');
  };

  const save = async () => {
    if (!selectedCode && !selectedName) return;
    await addDiagnosis({ patient_id: id, dsm_code: selectedCode || undefined, dsm_name: selectedName || undefined, severity, is_primary: isPrimary, notes: notes || undefined, date: new Date().toISOString().split('T')[0] });
    setSelectedCode(''); setSelectedName(''); setSearch(''); setSeverity('orta'); setIsPrimary(false); setNotes('');
    setAdding(false);
    load();
  };

  const remove = (d: Diagnosis) => {
    Alert.alert('Tanıyı Sil', `"${d.dsm_name || d.dsm_code}" silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteDiagnosis(d.id); load(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></TouchableOpacity>
        <Text style={styles.title}>Tanılar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <Text style={styles.addBtnText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {diagnoses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
            <Text style={styles.emptyText}>Henüz tanı eklenmemiş</Text>
          </View>
        ) : (
          diagnoses.map(d => (
            <View key={d.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  {d.is_primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Birincil</Text></View>}
                  <Text style={styles.diagName}>{d.dsm_name || 'Belirtilmemiş'}</Text>
                  {d.dsm_code ? <Text style={styles.diagCode}>{d.dsm_code}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => remove(d)}>
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>🗑</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardMeta}>
                {d.severity ? <SeverityBadge severity={d.severity} /> : null}
                {d.date ? <Text style={styles.metaText}>📅 {d.date}</Text> : null}
              </View>
              {d.notes ? <Text style={styles.diagNotes}>{d.notes}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Tanı Ekle</Text>

            <TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder="DSM-5 kodu veya adı ara..." placeholderTextColor={colors.placeholder} />
            {filtered.slice(0, 5).map(d => (
              <TouchableOpacity key={d.code} style={styles.suggestion} onPress={() => selectDiagnosis(d.code, d.name)}>
                <Text style={styles.sugCode}>{d.code}</Text>
                <Text style={styles.sugName} numberOfLines={1}>{d.name}</Text>
              </TouchableOpacity>
            ))}
            {selectedCode || selectedName ? (
              <View style={styles.selected}>
                <Text style={styles.selectedText}>✓ {selectedCode} — {selectedName}</Text>
              </View>
            ) : null}

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Şiddet</Text>
            <View style={styles.chipRow}>
              {SEVERITIES.map(s => (
                <TouchableOpacity key={s.value} style={[styles.chip, severity === s.value && styles.chipActive]} onPress={() => setSeverity(s.value)}>
                  <Text style={[styles.chipText, severity === s.value && styles.chipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryToggle} onPress={() => setIsPrimary(p => !p)}>
              <Text style={styles.primaryToggleText}>{isPrimary ? '☑' : '☐'} Birincil Tanı</Text>
            </TouchableOpacity>

            <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Notlar (isteğe bağlı)" placeholderTextColor={colors.placeholder} multiline />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setAdding(false); setSelectedCode(''); setSelectedName(''); setSearch(''); }}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; color: string }> = {
    hafif: { label: 'Hafif', color: colors.success },
    orta: { label: 'Orta', color: colors.warning },
    siddetli: { label: 'Şiddetli', color: colors.error },
  };
  const s = map[severity] || { label: severity, color: colors.textMuted };
  return (
    <View style={{ backgroundColor: s.color + '20', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color: s.color, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: spacing.xl + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  back: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, ...typography.h3 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.md, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  primaryBadge: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  primaryText: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  diagName: { ...typography.body, fontWeight: '600' },
  diagCode: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  metaText: { color: colors.textMuted, fontSize: 12 },
  diagNotes: { ...typography.small, marginTop: spacing.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '85%' },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  input: { backgroundColor: colors.inputBg, color: colors.text, borderRadius: radius.md, padding: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  suggestion: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.background, borderRadius: radius.sm, marginBottom: 4 },
  sugCode: { color: colors.accent, fontWeight: '700', fontSize: 13, minWidth: 60 },
  sugName: { flex: 1, color: colors.text, fontSize: 13 },
  selected: { backgroundColor: colors.accentDim, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm },
  selectedText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  label: { ...typography.label, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  primaryToggle: { marginBottom: spacing.sm },
  primaryToggleText: { color: colors.text, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
