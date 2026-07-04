import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '@/contexts/database-context';
import { colors, spacing, radius, typography, safeTop } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import { searchDiagnoses, getDiagnosisByCode } from '@/lib/dsm5';
import type { Diagnosis } from '@/lib/types';

const SEVERITIES: { value: Diagnosis['severity']; label: string }[] = [
  { value: 'hafif', label: 'Hafif' },
  { value: 'orta', label: 'Orta' },
  { value: 'siddetli', label: 'Şiddetli' },
];

export default function DiagnosesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getDiagnosesByPatient, addDiagnosis, updateDiagnosis, deleteDiagnosis } = useDatabase();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [severity, setSeverity] = useState<Diagnosis['severity']>('orta');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');

  // Detay/düzenleme: karta dokununca açılır
  const [detail, setDetail] = useState<Diagnosis | null>(null);
  const [editSeverity, setEditSeverity] = useState<Diagnosis['severity']>('orta');
  const [editPrimary, setEditPrimary] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [showCriteria, setShowCriteria] = useState(false);
  const [editDirty, setEditDirty] = useState(false);

  const openDetail = (d: Diagnosis) => {
    setDetail(d);
    setEditSeverity(d.severity ?? 'orta');
    setEditPrimary(!!d.is_primary);
    setEditNotes(d.notes ?? '');
    setShowCriteria(false);
    setEditDirty(false);
  };

  const saveDetail = async () => {
    if (!detail) return;
    await updateDiagnosis(detail.id, { severity: editSeverity, is_primary: editPrimary, notes: editNotes.trim() || undefined });
    setDetail(null);
    load();
  };

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
            <TouchableOpacity key={d.id} style={styles.card} onPress={() => openDetail(d)}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  {d.is_primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Birincil</Text></View>}
                  <Text style={styles.diagName}>{d.dsm_name || 'Belirtilmemiş'}</Text>
                  {d.dsm_code ? <Text style={styles.diagCode}>{d.dsm_code}</Text> : null}
                </View>
                <Icon name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.cardMeta}>
                {d.severity ? <SeverityBadge severity={d.severity} /> : null}
                {d.date ? <Text style={styles.metaText}>📅 {d.date}</Text> : null}
              </View>
              {d.notes ? <Text style={styles.diagNotes} numberOfLines={2}>{d.notes}</Text> : null}
            </TouchableOpacity>
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

      {/* Tanı detayı: DSM kriterleri (referans) + düzenleme + silme */}
      <Modal visible={detail !== null} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            {detail && (() => {
              const dsm = detail.dsm_code ? getDiagnosisByCode(detail.dsm_code) : undefined;
              return (
                <>
                  <View style={styles.detailHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>{detail.dsm_name || 'Tanı'}</Text>
                      {detail.dsm_code ? <Text style={styles.diagCode}>{detail.dsm_code}{detail.date ? ` · ${detail.date}` : ''}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => { const d = detail; setDetail(null); remove(d); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
                    {dsm && (
                      <TouchableOpacity style={styles.criteriaToggle} onPress={() => setShowCriteria(v => !v)}>
                        <Icon name={showCriteria ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.accent} />
                        <Text style={styles.criteriaToggleText}>DSM-5 Tanı Kriterleri ({dsm.criteria.length})</Text>
                      </TouchableOpacity>
                    )}
                    {dsm && showCriteria && (
                      <View style={styles.criteriaBox}>
                        {dsm.criteria.map((c, i) => (
                          <Text key={i} style={styles.criteriaText}>• {c}</Text>
                        ))}
                        {dsm.notes ? <Text style={styles.criteriaNote}>{dsm.notes}</Text> : null}
                        <Text style={styles.criteriaDisclaimer}>Referans amaçlıdır; tanı klinik değerlendirmeyle konur.</Text>
                      </View>
                    )}

                    <Text style={[styles.label, { marginTop: spacing.sm }]}>Şiddet</Text>
                    <View style={styles.chipRow}>
                      {SEVERITIES.map(s => (
                        <TouchableOpacity key={s.value} style={[styles.chip, editSeverity === s.value && styles.chipActive]} onPress={() => { setEditSeverity(s.value); setEditDirty(true); }}>
                          <Text style={[styles.chipText, editSeverity === s.value && styles.chipTextActive]}>{s.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.primaryToggle} onPress={() => { setEditPrimary(p => !p); setEditDirty(true); }}>
                      <Text style={styles.primaryToggleText}>{editPrimary ? '☑' : '☐'} Birincil Tanı</Text>
                    </TouchableOpacity>

                    <TextInput
                      style={[styles.input, { minHeight: 70 }]}
                      value={editNotes}
                      onChangeText={t => { setEditNotes(t); setEditDirty(true); }}
                      placeholder="Notlar (seyir, ayırıcı tanı düşünceleri...)"
                      placeholderTextColor={colors.placeholder}
                      multiline
                      textAlignVertical="top"
                    />
                  </ScrollView>

                  <View style={styles.modalActions}>
                    <TouchableOpacity onPress={() => setDetail(null)}>
                      <Text style={styles.cancelText}>Kapat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.saveBtn, !editDirty && { opacity: 0.4 }]} onPress={saveDetail} disabled={!editDirty}>
                      <Text style={styles.saveBtnText}>Kaydet</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingTop: safeTop + spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
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
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  criteriaToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  criteriaToggleText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  criteriaBox: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, marginTop: spacing.xs, gap: 6 },
  criteriaText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  criteriaNote: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  criteriaDisclaimer: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
